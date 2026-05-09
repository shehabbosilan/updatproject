import { prisma } from "../prismaClient.mjs";

/**
 * Tenant Repository: Pure Data Access
 * No hidden logic or magic filters.
 */
export const TenantRepository = {
  /**
   * Find only active tenants (is_deleted = false)
   */
  async findActiveByEmail(email) {
    return await prisma.tenant.findFirst({
      where: { 
        email: email.toLowerCase().trim(), 
        is_deleted: false 
      }
    });
  },

  /**
   * Find any tenant record regardless of deletion status
   */
  async findAnyByEmail(email) {
    return await prisma.tenant.findFirst({
      where: { 
        email: email.toLowerCase().trim() 
      }
    });
  },

  /**
   * Create a new tenant record
   */
  async create(data) {
    return await prisma.tenant.create({
      data: {
        ...data,
        email: data.email.toLowerCase().trim()
      }
    });
  },

  /**
   * Find a tenant by its restoration token
   */
  async findByRestoreToken(token) {
    return await prisma.tenant.findFirst({
      where: {
        restoreToken: token,
        restoreTokenExpiry: { gt: new Date() }
      }
    });
  },

  /**
   * Set a restoration token for a tenant
   */
  async setRestoreToken(id, token, expiry) {
    return await prisma.tenant.update({
      where: { id },
      data: {
        restoreToken: token,
        restoreTokenExpiry: expiry
      }
    });
  },

  /**
   * Restore a soft-deleted tenant (Cleaned up)
   */
  async restore(id, data) {
    return await prisma.tenant.update({
      where: { id },
      data: {
        ...data,
        is_deleted: false,
        deleted_at: null,
        restored_at: new Date(),
        restored_count: { increment: 1 },
        restoreToken: null,
        restoreTokenExpiry: null,
        status: "active"
      }
    });
  }
};
