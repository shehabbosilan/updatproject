import { prisma } from "../prismaClient.mjs";
import { Router } from "express";



const router = Router();

// =========================
//  GET ALL SUPPLIERS
// =========================
router.get("/suppliers", async (req, res) => {
  const tenantId = req.user.tenant_id;
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
    res.json(suppliers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
//  ADD/UPDATE SUPPLIER
// =========================
router.post("/suppliers", async (req, res) => {
  const { id, name, phone, email, address, initial_debt } = req.body;
  const tenantId = req.user.tenant_id;
  
  try {
    if (id) {
      await prisma.supplier.updateMany({
        where: { id: parseInt(id), tenantId },
        data: { name, phone, email, address },
      });
      res.json({ success: true, message: "Supplier updated" });
    } else {
      const debt = Number(initial_debt) || 0;
      const created = await prisma.supplier.create({
        data: {
          tenantId,
          name,
          phone,
          email,
          address,
          total_purchases: debt,
          remaining_balance: debt,
        },
      });
      res.json({ success: true, id: created.id });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
//  PAY SUPPLIER
// =========================
router.post("/suppliers/pay", async (req, res) => {
  const { supplier_id, amount, note } = req.body;
  const tenantId = req.user.tenant_id;
  const date = new Date().toISOString();
  const calculatedAmount = Number(amount);

  try {
    await prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findFirst({
        where: { id: parseInt(supplier_id), tenantId },
      });

      if (!supplier) throw new Error("Supplier not found");

      await tx.supplier.update({
        where: { id: supplier.id },
        data: {
          total_paid: { increment: calculatedAmount },
          remaining_balance: { decrement: calculatedAmount },
        },
      });

      await tx.supplierPayment.create({
        data: {
          tenantId,
          supplier_id: supplier.id,
          amount: calculatedAmount,
          date,
          note: note || "Direct Payment",
        },
      });

      // Treasury Integration
      const lastEntry = await tx.treasury.findFirst({
        where: { tenantId },
        orderBy: { id: "desc" },
      });

      const prevBalance = lastEntry ? (lastEntry.running_balance || 0) : 0;
      const newBalance = prevBalance - calculatedAmount;

      await tx.treasury.create({
        data: {
          tenantId,
          type: "OUT",
          amount: calculatedAmount,
          description: `Payment to Supplier: ${supplier.name} (${note || ""})`,
          reference_id: "SUPP_PAY",
          date,
          running_balance: newBalance,
        },
      });
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
//  GET PAYMENT HISTORY
// =========================
router.get("/suppliers/:id/payments", async (req, res) => {
  const supplier_id = parseInt(req.params.id);
  const tenantId = req.user.tenant_id;
  
  try {
    const payments = await prisma.supplierPayment.findMany({
      where: { supplier_id, tenantId },
      orderBy: { date: "desc" },
    });
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
//  DELETE SUPPLIER
// =========================
router.delete("/suppliers/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const tenantId = req.user.tenant_id;

  try {
    await prisma.supplier.deleteMany({
      where: { id, tenantId },
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
