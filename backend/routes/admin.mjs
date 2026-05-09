import { prisma } from "../prismaClient.mjs";
import { Router } from "express";

const router = Router();

// =========================
//  GET ALL TENANTS
// =========================
router.get("/tenants", async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      where: { is_deleted: false },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        expiresAt: true,
        _count: {
          select: {
            products: true,
            sales: true,
            customers: true
          }
        }
      }
    });
    res.json(tenants);
  } catch (error) {
    console.error("Error fetching tenants:", error);
    res.status(500).json({ message: "Error fetching tenants" });
  }
});

// =========================
//  SUSPEND TENANT
// =========================
router.post("/tenants/:id/suspend", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.tenant.update({
      where: { id: parseInt(id) },
      data: { status: "suspended" }
    });
    res.json({ success: true, message: "Tenant suspended successfully" });
  } catch (error) {
    console.error("Error suspending tenant:", error);
    res.status(500).json({ message: "Error suspending tenant" });
  }
});

// =========================
//  ACTIVATE TENANT
// =========================
router.post("/tenants/:id/activate", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.tenant.update({
      where: { id: parseInt(id) },
      data: { status: "active" }
    });
    res.json({ success: true, message: "Tenant activated successfully" });
  } catch (error) {
    console.error("Error activating tenant:", error);
    res.status(500).json({ message: "Error activating tenant" });
  }
});

// =========================
//  SOFT DELETE TENANT
// =========================
router.delete("/tenants/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.tenant.update({
      where: { id: parseInt(id) },
      data: { is_deleted: true, deleted_at: new Date() }
    });
    res.json({ success: true, message: "Tenant deleted successfully" });
  } catch (error) {
    console.error("Error deleting tenant:", error);
    res.status(500).json({ message: "Error deleting tenant" });
  }
});

// =========================
//  GENERATE INVITE CODE
// =========================
router.post("/invites", async (req, res) => {
  try {
    // Generate a random 8-character string for the code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await prisma.inviteCode.create({
      data: {
        code,
        expiresAt
      }
    });

    res.json({ success: true, invite });
  } catch (error) {
    console.error("Error generating invite:", error);
    res.status(500).json({ message: "Error generating invite code" });
  }
});

export default router;
