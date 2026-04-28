import { prisma } from "../prismaClient.mjs";
import { Router } from "express";



const router = Router();

// =========================
//  ADD PAYMENT (FIFO LOGIC)
// =========================
router.post("/payments", async (req, res) => {
  const { customer_id, amount } = req.body;
  const tenantId = req.user.tenant_id;
  const date = new Date().toISOString();

  const calculatedAmount = Number(amount);

  if (!customer_id || !calculatedAmount || calculatedAmount <= 0) {
    return res.status(400).json({ message: "Invalid payment data" });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      let remainingToAllocate = calculatedAmount;
      
      const sales = await tx.sale.findMany({
        where: {
          tenantId,
          customer_id: parseInt(customer_id),
          remaining: { gt: 0 },
          is_deleted: 0,
        },
        orderBy: { date: "asc" },
      });

      for (const sale of sales) {
        if (remainingToAllocate <= 0) break;

        const paymentForThisSale = Math.min(Number(sale.remaining), remainingToAllocate);

        const newPaid = Number(sale.paid) + paymentForThisSale;
        const newRemaining = Number(sale.remaining) - paymentForThisSale;
        let newStatus = newRemaining <= 0 ? "PAID" : "PARTIALLY PAID";

        await tx.sale.update({
          where: { id: sale.id },
          data: {
            paid: newPaid,
            remaining: newRemaining,
            status: newStatus,
          },
        });

        remainingToAllocate -= paymentForThisSale;
      }

      await tx.payment.create({
        data: {
          tenantId,
          customer_id: parseInt(customer_id),
          amount: calculatedAmount,
          date,
        },
      });

      // Treasury Integration
      const customer = await tx.customer.findFirst({
        where: { id: parseInt(customer_id), tenantId },
      });

      const lastEntry = await tx.treasury.findFirst({
        where: { tenantId },
        orderBy: { id: "desc" },
      });

      const prevBalance = lastEntry ? (lastEntry.running_balance || 0) : 0;
      const newBalance = prevBalance + calculatedAmount;

      await tx.treasury.create({
        data: {
          tenantId,
          type: "IN",
          amount: calculatedAmount,
          description: `Customer Payment: ${customer ? customer.name : "Unknown"}`,
          reference_id: "PAYMENT_LGR",
          date,
          running_balance: newBalance,
        },
      });

      return { appliedAmount: calculatedAmount, unallocated: remainingToAllocate };
    });

    res.json({
      success: true,
      message: "Payment processed successfully",
      applied: result.appliedAmount,
      excess: result.unallocated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error processing payment: " + error.message,
    });
  }
});

// =========================
//  GET PAYMENTS BY CUSTOMER
// =========================
router.get("/payments/:customer_id", async (req, res) => {
  const customer_id = parseInt(req.params.customer_id);
  const tenantId = req.user.tenant_id;

  try {
    const payments = await prisma.payment.findMany({
      where: { customer_id, tenantId },
      orderBy: { date: "desc" },
    });
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
