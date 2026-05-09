import { prisma } from "../prismaClient.mjs";
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { emailService } from "../services/emailService.mjs";
import { TenantService } from "../services/tenantService.mjs";
import { TenantRepository } from "../repositories/tenantRepository.mjs";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey_change_me_in_prod";

// =========================
//  REGISTER NEW TENANT
// =========================
router.post("/register", async (req, res) => {
  const { email, password, inviteCode, storeName } = req.body;

  if (!storeName || storeName.trim().length < 3) {
    return res.status(400).json({ message: "Store name is required (min 3 characters)." });
  }

  if (!inviteCode) {
    return res.status(400).json({ message: "An invite code is required to register." });
  }

  try {
    // 1. Validate invite code
    const validCode = await prisma.inviteCode.findUnique({
      where: { code: inviteCode }
    });

    if (!validCode || validCode.used) {
      return res.status(400).json({ message: "Invalid or already used invite code." });
    }

    if (validCode.expiresAt && new Date(validCode.expiresAt) < new Date()) {
      return res.status(400).json({ message: "Invite code has expired." });
    }

    // 2. Register via TenantService
    const tenant = await TenantService.register({
      email,
      password,
      storeName: storeName.trim(),
      ignoreDeleted: req.body.ignoreDeleted === true
    });

    // 3. Mark invite code as used
    await prisma.inviteCode.update({
      where: { id: validCode.id },
      data: { used: true }
    });

    // 4. Generate JWT
    const token = jwt.sign({ tenant_id: tenant.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      code: "CREATED_SUCCESS",
      message: "Shop created successfully",
      token,
      tenant_id: tenant.id,
      email: tenant.email,
      storeName: tenant.storeName,
    });
  } catch (error) {
    if (error.message === "ACTIVE_ACCOUNT_EXISTS") {
      return res.status(400).json({ code: error.message, message: "This email is already in use by an active account." });
    }
    if (error.message === "DELETED_ACCOUNT_EXISTS") {
      return res.status(409).json({ 
        ...error.metadata,
        message: "Account exists but is deleted. Please choose to restore it explicitly." 
      });
    }
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Register Error:", error);
    res.status(500).json({ success: false, message: "Error registering shop" });
  }
});

// =========================
//  REQUEST RESTORE ACCOUNT
// =========================
router.post("/restore/request", async (req, res) => {
  const { email } = req.body;
  try {
    const result = await TenantService.requestRestore(email);
    res.json(result);
  } catch (error) {
    console.error("Restore Request Error:", error);
    res.status(500).json({ message: "Error processing restoration request" });
  }
});

// =========================
//  COMPLETE RESTORE ACCOUNT
// =========================
router.post("/restore/complete", async (req, res) => {
  const { token, password } = req.body;
  try {
    const tenant = await TenantService.completeRestore(token, password);

    // Generate JWT
    const jwtToken = jwt.sign({ tenant_id: tenant.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      code: "RESTORED_SUCCESS",
      message: "Account restored successfully",
      token: jwtToken,
      tenant_id: tenant.id,
      email: tenant.email,
      storeName: tenant.storeName,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ code: error.message, message: error.message });
    }
    console.error("Restore Complete Error:", error);
    res.status(500).json({ message: "Error completing restoration" });
  }
});

// =========================
//  LOGIN TENANT
// =========================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const tenant = await TenantRepository.findAnyByEmail(email);

    if (!tenant) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (tenant.is_deleted) {
      return res.status(403).json({ message: "Account not found or deleted" });
    }

    if (tenant.status !== "active") {
      return res.status(403).json({ message: "Account suspended" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, tenant.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign({ tenant_id: tenant.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      tenant_id: tenant.id,
      email: tenant.email,
      role: tenant.role,
      storeName: tenant.storeName,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Error during login" });
  }
});

// =========================
//  LOGOUT TENANT
// =========================
router.post("/logout", (req, res) => {
  // Stateless JWT: Just return success. 
  // Client will remove token from localStorage.
  res.json({ success: true, message: "Logged out successfully" });
});

// =========================
//  FORGOT PASSWORD
// =========================
router.post("/forgot-password", async (req, res) => {
  try {
    console.log("=== Forgot Password Request ===");
    console.log("Request Body:", req.body);

    const { email } = req.body;

    if (!email) {
      console.warn("Missing email in request");
      return res.status(400).json({ message: "Email is required" });
    }

    const tenant = await TenantRepository.findActiveByEmail(email);

    console.log("User lookup result:", tenant ? `Found user with ID ${tenant.id}` : "User not found");

    if (!tenant) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate raw token
    const resetToken = crypto.randomBytes(32).toString('hex');
    console.log("Token generated successfully.");
    
    // Hash token for database storage
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // 15 minutes expiry
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry
      }
    });

    // Check email credentials
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("EMAIL_USER or EMAIL_PASS environment variables are missing! Email delivery may fail.");
    }

    // Send email - Dynamically detect baseUrl from request origin for tunnel support
    const origin = req.headers.origin;
    const baseUrl = (origin && origin !== 'null') ? origin : (process.env.FRONTEND_URL || 'http://localhost:8082');
    console.log(`[AUTH] Generating reset link. Origin: ${origin}, Final baseUrl: ${baseUrl}`);
    
    // Ensure no trailing slash on baseUrl and add /#/ for hash history
    const resetUrl = `${baseUrl.replace(/\/$/, "")}/#/reset-password/${resetToken}`;
    console.log(`[AUTH] Final reset URL: ${resetUrl}`);
    
    try {
      await emailService.sendPasswordResetEmail(email, resetUrl);
      console.log("Email sending result: Success");
    } catch (emailError) {
      console.error("Email sending result: Failed", emailError);
      // Safe Fallback: do not crash, just log it.
    }

    const responsePayload = { message: "Password reset link sent" };

    // Bonus: Test Mode
    if (process.env.NODE_ENV !== "production") {
      responsePayload.debug_token = resetToken;
      console.log("Test mode active: including raw token in response");
    }

    res.json(responsePayload);
  } catch (error) {
    console.error("Forgot password error stack:", error.stack || error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
});

// =========================
//  RESET PASSWORD
// =========================
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const tenant = await prisma.tenant.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!tenant) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update tenant and clear token
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.json({ success: true, message: "Password reset successful. You can now login." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "Error resetting password." });
  }
});

export default router;
