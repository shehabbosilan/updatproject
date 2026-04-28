import { prisma } from "../prismaClient.mjs";
import { Router } from "express";



const router = Router();

// =========================
//  GET TREASURY DATA
// =========================
router.get("/treasury", async (req, res) => {
  const { fromDate, toDate, type, search } = req.query;
  const tenantId = req.user.tenant_id;

  try {
    let whereClause = { tenantId };

    if (fromDate || toDate) {
      whereClause.date = {};
      if (fromDate) whereClause.date.gte = fromDate;
      if (toDate) whereClause.date.lte = toDate + "T23:59:59";
    }

    if (type && type !== "ALL") {
      whereClause.type = type;
    }

    if (search && search.trim() !== "") {
      whereClause.OR = [
        { description: { contains: search } },
        { reference_id: { contains: search } },
      ];
    }

    const transactions = await prisma.treasury.findMany({
      where: whereClause,
      orderBy: { id: "desc" },
    });

    // Get overall stats
    const lastEntry = await prisma.treasury.findFirst({
      where: { tenantId },
      orderBy: { id: "desc" },
    });

    // We can compute total_in and total_out by grouping or aggregating
    const aggregateIn = await prisma.treasury.aggregate({
      _sum: { amount: true },
      where: { tenantId, type: "IN" },
    });

    const aggregateOut = await prisma.treasury.aggregate({
      _sum: { amount: true },
      where: { tenantId, type: "OUT" },
    });

    res.json({
      transactions,
      current_balance: lastEntry ? (lastEntry.running_balance || 0) : 0,
      total_in: aggregateIn._sum.amount || 0,
      total_out: aggregateOut._sum.amount || 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
//  MANUAL ENTRY (DEPOSIT/WITHDRAWAL)
// =========================
router.post("/treasury/manual", async (req, res) => {
  const { type, amount, description } = req.body;
  const tenantId = req.user.tenant_id;
  const calculatedAmount = Number(amount);

  try {
    if (!calculatedAmount || calculatedAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    await prisma.$transaction(async (tx) => {
      const lastEntry = await tx.treasury.findFirst({
        where: { tenantId },
        orderBy: { id: "desc" },
      });

      const currentBalance = lastEntry ? (lastEntry.running_balance || 0) : 0;

      // Withdrawal Validation
      if (type === "OUT" && calculatedAmount > currentBalance) {
        throw new Error("Insufficient funds in treasury");
      }

      let newBalance = currentBalance;
      if (type === "IN") newBalance += calculatedAmount;
      else if (type === "OUT") newBalance -= calculatedAmount;

      await tx.treasury.create({
        data: {
          tenantId,
          type,
          amount: calculatedAmount,
          description: description || "Manual Adjustment",
          reference_id: "MANUAL",
          date: new Date().toISOString(),
          running_balance: newBalance,
        },
      });
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
