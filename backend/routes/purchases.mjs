import { prisma } from "../prismaClient.mjs";
import { Router } from "express";



const router = Router();

// =========================
// GET PURCHASES (SALES HISTORY) WITH FILTERS
// =========================
router.get("/purchases", async (req, res) => {
  const { search, fromDate, toDate, status } = req.query;
  const tenantId = req.user.tenant_id;

  let whereClause = {
    tenantId,
    is_deleted: 0,
  };

  if (search) {
    whereClause.OR = [
      { customer_name: { contains: search } },
      {
        customer: {
          phone: { contains: search },
        },
      },
    ];
  }

  if (fromDate || toDate) {
    whereClause.date = {};
    if (fromDate) whereClause.date.gte = fromDate;
    if (toDate) whereClause.date.lte = toDate + "T23:59:59";
  }

  if (status && status !== "all") {
    whereClause.status = status;
  }

  try {
    const sales = await prisma.sale.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
    });

    // 🔥 FORCED RECONCILIATION: Ensure absolute consistency
    const processedSales = sales.map((s) => {
      const total = Number(s.total) || 0;
      const paid = Number(s.paid) || 0;

      // Recalculate remaining to be safe
      s.remaining = Math.max(0, total - paid);

      // Determine Status exactly from math
      if (s.remaining <= 0) {
        s.status = "PAID";
      } else if (paid > 0) {
        s.status = "PARTIALLY PAID";
      } else {
        s.status = "UNPAID";
      }

      return s;
    });

    // Calculate totals for the filtered results
    const totals = processedSales.reduce(
      (acc, s) => {
        acc.total += s.total;
        acc.paid += s.paid;
        acc.remaining += s.remaining;
        return acc;
      },
      { total: 0, paid: 0, remaining: 0 }
    );

    res.json({ sales: processedSales, totals });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
//  GET SINGLE PURCHASE DETAILS
// =========================
router.get("/purchases/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const tenantId = req.user.tenant_id;

  try {
    const sale = await prisma.sale.findFirst({
      where: { id, tenantId },
    });

    if (!sale) return res.status(404).json({ message: "Invoice not found" });

    // Force reconciliation
    const total = Number(sale.total) || 0;
    const paid = Number(sale.paid) || 0;
    sale.remaining = Math.max(0, total - paid);

    if (sale.remaining <= 0) sale.status = "PAID";
    else if (paid > 0) sale.status = "PARTIALLY PAID";
    else sale.status = "UNPAID";

    const items = await prisma.saleItem.findMany({
      where: { sale_id: id, tenantId },
      include: {
        product: true,
      },
    });

    const formattedItems = items.map(item => ({
      ...item,
      product_name: item.product?.name || "Unknown Product"
    }));

    res.json({ sale, items: formattedItems });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
