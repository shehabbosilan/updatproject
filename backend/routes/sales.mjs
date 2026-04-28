import { prisma } from "../prismaClient.mjs";
import { Router } from "express";



const router = Router();

// =========================
//  CREATE SALE
// =========================
router.post("/sales", async (req, res) => {
  const { customer_id, customer_name, total, paid, items } = req.body;
  const tenantId = req.user.tenant_id;
  const date = new Date().toISOString();

  // Backend computations
  const calculatedTotal = Number(total);
  const calculatedPaid = Number(paid);
  const remaining = Math.max(0, calculatedTotal - calculatedPaid);

  let status = "UNPAID";
  if (remaining <= 0) status = "PAID";
  else if (calculatedPaid > 0) status = "PARTIALLY PAID";

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Sale
      const sale = await tx.sale.create({
        data: {
          tenantId,
          customer_id: customer_id || null,
          customer_name,
          total: calculatedTotal,
          paid: calculatedPaid,
          remaining,
          status,
          date,
        },
      });

      // 2. Insert Sale Items & Update Stock
      for (const item of items) {
        await tx.saleItem.create({
          data: {
            tenantId,
            sale_id: sale.id,
            product_id: item.id,
            quantity: item.quantity,
            price: Number(item.selling_price),
          },
        });

        await tx.product.updateMany({
          where: { id: item.id, tenantId },
          data: {
            low_stock_threshold: {
              decrement: item.quantity,
            },
          },
        });
      }

      // 3. Record Payment & Treasury if Paid
      if (calculatedPaid > 0) {
        if (customer_id) {
          await tx.payment.create({
            data: {
              tenantId,
              customer_id,
              amount: calculatedPaid,
              date,
            },
          });
        }

        // Treasury Integration
        const lastEntry = await tx.treasury.findFirst({
          where: { tenantId },
          orderBy: { id: "desc" },
        });

        const prevBalance = lastEntry ? (lastEntry.running_balance || 0) : 0;
        const newBalance = prevBalance + calculatedPaid;

        await tx.treasury.create({
          data: {
            tenantId,
            type: "IN",
            amount: calculatedPaid,
            description: `Checkout Payment (Sale #${sale.id}): ${customer_name}`,
            reference_id: `SALE_${sale.id}`,
            date,
            running_balance: newBalance,
          },
        });
      }

      return sale;
    });

    res.json({
      success: true,
      sale_id: result.id,
      remaining,
      message: "Sale completed successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error saving sale: " + error.message });
  }
});

// =========================
// GET ALL SALES
// =========================
router.get("/sales", async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      where: { tenantId: req.user.tenant_id },
      orderBy: { id: "desc" },
    });
    res.json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
