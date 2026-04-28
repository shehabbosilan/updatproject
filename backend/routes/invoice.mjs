import { prisma } from "../prismaClient.mjs";
import { Router } from "express";



const router = Router();

// =========================
//  CREATE INVOICE (Similar to sales)
// =========================
router.post("/invoice", async (req, res) => {
  const { customer_name, total, date, items } = req.body;
  const tenantId = req.user.tenant_id;

  try {
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          tenantId,
          customer_name,
          total: Number(total),
          paid: 0, // default if not provided
          remaining: Number(total), // assuming no initial payment in this simplified route
          date,
        },
      });

      for (const item of items) {
        await tx.saleItem.create({
          data: {
            tenantId,
            sale_id: sale.id,
            product_id: parseInt(item.id),
            quantity: parseInt(item.quantity),
            price: Number(item.selling_price),
          },
        });
      }
    });

    res.json({ success: true, message: "Invoice saved" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error saving invoice" });
  }
});

// =========================
//  GET ALL INVOICES
// =========================
router.get("/invoice", async (req, res) => {
  const tenantId = req.user.tenant_id;
  try {
    const invoices = await prisma.sale.findMany({
      where: { tenantId },
      orderBy: { id: "desc" },
    });

    res.json(invoices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching invoices" });
  }
});

// =========================
//  GET INVOICE BY ID
// =========================
router.get("/invoice/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const tenantId = req.user.tenant_id;

  try {
    const invoice = await prisma.sale.findFirst({
      where: { id, tenantId },
    });

    const items = await prisma.saleItem.findMany({
      where: { sale_id: id, tenantId },
    });

    res.json({ invoice, items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching invoice" });
  }
});

export default router;
