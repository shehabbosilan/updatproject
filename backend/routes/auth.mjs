import { prisma } from "../prismaClient.mjs";
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";



const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey_change_me_in_prod";

// =========================
//  REGISTER NEW TENANT
// =========================
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await prisma.tenant.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new tenant
    const newTenant = await prisma.tenant.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    // Generate JWT
    const token = jwt.sign({ tenant_id: newTenant.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      message: "Shop created successfully",
      token,
      tenant_id: newTenant.id,
      username: newTenant.username,
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ success: false, message: "Error registering shop" });
  }
});

// =========================
//  LOGIN TENANT
// =========================
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { username },
    });

    if (!tenant) {
      return res.status(401).json({ message: "Invalid credentials" });
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
      username: tenant.username,
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

export default router;
