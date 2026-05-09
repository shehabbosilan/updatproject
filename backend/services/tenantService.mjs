import { TenantRepository } from "../repositories/tenantRepository.mjs";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { emailService } from "./emailService.mjs";

/**
 * Tenant Service: Business Logic Orchestrator
 */
export const TenantService = {
  /**
   * Register a NEW Tenant
   * Strictly simple: creates new, rejects active.
   */
  async register({ email, password, storeName, ignoreDeleted = false }) {
    const cleanEmail = email.toLowerCase().trim();
    
    // 1. Check for ACTIVE account
    const active = await TenantRepository.findActiveByEmail(cleanEmail);
    if (active) {
      const error = new Error("ACTIVE_ACCOUNT_EXISTS");
      error.status = 400;
      throw error;
    }

    // 2. Check for DELETED account (Informational unless forced)
    if (!ignoreDeleted) {
      const deleted = await TenantRepository.findAnyByEmail(cleanEmail);
      if (deleted && deleted.is_deleted) {
        const error = new Error("DELETED_ACCOUNT_EXISTS");
        error.status = 409;
        error.metadata = {
          can_restore: true,
          suggested_action: "restore",
          code: "DELETED_ACCOUNT_EXISTS"
        };
        throw error;
      }
    }

    // 3. New Account Creation
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      return await TenantRepository.create({
        email: cleanEmail,
        password: hashedPassword,
        storeName
      });
    } catch (error) {
      if (error.code === 'P2002') {
        // Race condition: Someone just created an active account
        return await this.register({ email, password, storeName, ignoreDeleted: true });
      }
      throw error;
    }
  },

  /**
   * Request an Account Restoration (Token-based)
   */
  async requestRestore(email) {
    const cleanEmail = email.toLowerCase().trim();
    const tenant = await TenantRepository.findAnyByEmail(cleanEmail);

    if (!tenant || !tenant.is_deleted) {
      // Security: Don't reveal if account exists or not
      return { success: true, message: "If a deleted account exists, a recovery email has been sent." };
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await TenantRepository.setRestoreToken(tenant.id, token, expiry);

    // Send email (Reuse email service logic)
    // Note: In a real app, you'd have a specific template for restoration
    const restoreUrl = `${process.env.FRONTEND_URL || 'http://localhost:8082'}/#/restore-account/${token}`;
    await emailService.sendPasswordResetEmail(tenant.email, restoreUrl); 

    return { success: true, message: "Restoration email sent." };
  },

  /**
   * Complete Restoration via Token
   */
  async completeRestore(token, newPassword) {
    const tenant = await TenantRepository.findByRestoreToken(token);

    if (!tenant) {
      const error = new Error("INVALID_OR_EXPIRED_TOKEN");
      error.status = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    return await TenantRepository.restore(tenant.id, {
      password: hashedPassword
    });
  }
};
