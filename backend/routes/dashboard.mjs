import { prisma } from "../prismaClient.mjs";
import { Router } from "express";



const router = Router();

// =========================
//  GET DASHBOARD STATS
// =========================
router.get("/dashboard", async (req, res) => {
  const tenantId = req.user.tenant_id;
  
  try {
    const today = new Date().toISOString().split("T")[0];

    // 1. Total Revenue (Single Source of Truth: Payments Table)
    const revAgg = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { tenantId },
    });
    const totalRevenue = revAgg._sum.amount || 0;

    // 2. Total Outstanding Debt
    const debtAgg = await prisma.sale.aggregate({
      _sum: { remaining: true },
      where: { tenantId, is_deleted: 0 },
    });
    const totalDebt = debtAgg._sum.remaining || 0;

    // 3. Number of Customers in Debt
    const customersInDebtList = await prisma.sale.groupBy({
      by: ["customer_id"],
      where: { tenantId, remaining: { gt: 0 }, is_deleted: 0, customer_id: { not: null } },
    });
    const customersInDebt = customersInDebtList.length;

    // 4. Low Stock Products
    const lowStock = await prisma.product.count({
      where: { tenantId, low_stock_threshold: { lte: 5 } },
    });

    // 5. Sales Today (Total Invoice Amount)
    const salesTodayAgg = await prisma.sale.aggregate({
      _sum: { total: true },
      where: { tenantId, is_deleted: 0, date: { startsWith: today } },
    });
    const salesToday = salesTodayAgg._sum.total || 0;

    // 6. Recent Sales for the table
    const recentSales = await prisma.sale.findMany({
      where: { tenantId, is_deleted: 0 },
      orderBy: { id: "desc" },
      take: 5,
    });

    res.json({
      totalRevenue,
      totalDebt,
      customersInDebt,
      lowStock,
      salesToday,
      recentSales,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
