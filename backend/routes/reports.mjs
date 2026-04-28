import { prisma } from "../prismaClient.mjs";
import { Router } from "express";



const router = Router();

// =========================
//  SALES REPORTS
// =========================
router.get("/reports/sales", async (req, res) => {
  const { fromDate, toDate } = req.query;
  const tenantId = req.user.tenant_id;

  let whereClause = {
    tenantId,
    is_deleted: 0,
  };

  if (fromDate || toDate) {
    whereClause.date = {};
    if (fromDate) whereClause.date.gte = fromDate;
    if (toDate) whereClause.date.lte = toDate + "T23:59:59";
  }

  try {
    const sales = await prisma.sale.findMany({
      where: whereClause,
      select: {
        id: true,
        customer_name: true,
        total: true,
        paid: true,
        remaining: true,
        date: true,
      },
    });

    const summary = sales.reduce(
      (acc, s) => {
        acc.total_sales += Number(s.total);
        acc.total_paid += Number(s.paid);
        acc.total_remaining += Number(s.remaining);
        acc.number_of_orders += 1;
        return acc;
      },
      {
        total_sales: 0,
        total_paid: 0,
        total_remaining: 0,
        number_of_orders: 0,
      }
    );

    res.json({ summary, sales });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
// INVENTORY REPORTS
// =========================
router.get("/reports/inventory", async (req, res) => {
  const tenantId = req.user.tenant_id;

  try {
    const products = await prisma.product.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        low_stock_threshold: true,
      },
      orderBy: { name: "asc" },
    });

    const result = products.map((p) => ({
      ...p,
      stock: p.low_stock_threshold || 0,
      status: (p.low_stock_threshold || 0) <= 5 ? "Low Stock" : "OK",
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
//  PRODUCT PERFORMANCE
// =========================
router.get("/reports/products", async (req, res) => {
  const { fromDate, toDate } = req.query;
  const tenantId = req.user.tenant_id;

  let dateFilter = {};
  if (fromDate || toDate) {
    if (fromDate) dateFilter.gte = fromDate;
    if (toDate) dateFilter.lte = toDate + "T23:59:59";
  }

  try {
    // To do an aggregated query by product for sales:
    const saleItems = await prisma.saleItem.findMany({
      where: {
        tenantId,
        sale: {
          is_deleted: 0,
          ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {})
        }
      },
      include: {
        product: true
      }
    });

    const productMap = {};
    for (const item of saleItems) {
      if (!item.product) continue;
      const pid = item.product.id;
      if (!productMap[pid]) {
        productMap[pid] = {
          name: item.product.name,
          total_qty: 0,
          revenue: 0
        };
      }
      productMap[pid].total_qty += item.quantity;
      productMap[pid].revenue += (item.quantity * item.price);
    }

    const data = Object.values(productMap).sort((a, b) => b.total_qty - a.total_qty);

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
//  PRICE LIST
// =========================
router.get("/reports/pricelist", async (req, res) => {
  const tenantId = req.user.tenant_id;

  try {
    const data = await prisma.product.findMany({
      where: { tenantId },
      select: {
        name: true,
        selling_price: true,
        unit: true,
      },
      orderBy: { name: "asc" },
    });
    
    // Map to match frontend expected fields
    const mapped = data.map(d => ({
      name: d.name,
      price: d.selling_price,
      unit: d.unit
    }));
    
    res.json(mapped);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
//  CUSTOMER STATEMENT
// =========================
router.get("/reports/customer-statement", async (req, res) => {
  const { customerId, phone, fromDate, toDate } = req.query;
  const tenantId = req.user.tenant_id;

  try {
    let finalCustomerId = parseInt(customerId);

    // 1. Resolve customer ID if phone is provided
    if (phone && !finalCustomerId) {
      const customer = await prisma.customer.findFirst({
        where: { phone, tenantId },
      });
      if (customer) {
        finalCustomerId = customer.id;
      } else {
        return res.status(404).json({ error: "Customer not found" });
      }
    }

    if (!finalCustomerId) {
      return res.status(400).json({ error: "Customer ID or Phone is required" });
    }

    // 2. Calculate Opening Balance (transactions before fromDate)
    let openingBalance = 0;
    if (fromDate) {
      const prevInvoicesAgg = await prisma.sale.aggregate({
        _sum: { total: true },
        where: { tenantId, customer_id: finalCustomerId, date: { lt: fromDate }, is_deleted: 0 }
      });
      
      const prevPaymentsAgg = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: { tenantId, customer_id: finalCustomerId, date: { lt: fromDate } }
      });

      openingBalance = (prevInvoicesAgg._sum.total || 0) - (prevPaymentsAgg._sum.amount || 0);
    }

    // 3. Fetch Transactions within range
    let dateFilter = {};
    if (fromDate || toDate) {
      if (fromDate) dateFilter.gte = fromDate;
      if (toDate) dateFilter.lte = toDate + "T23:59:59";
    }

    const invoices = await prisma.sale.findMany({
      where: {
        tenantId,
        customer_id: finalCustomerId,
        is_deleted: 0,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {})
      },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    const paymentsData = await prisma.payment.findMany({
      where: {
        tenantId,
        customer_id: finalCustomerId,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {})
      }
    });

    // 4. Enrich and Merge
    let combined = [
      ...invoices.map((inv) => ({
        date: inv.date,
        type: "Invoice",
        description: `Invoice #${inv.id} [${inv.items.map(i => i.product?.name).join(", ")}]`,
        debit: Number(inv.total),
        credit: 0
      })),
      ...paymentsData.map((p) => ({
        date: p.date,
        type: "Payment",
        description: `Payment Receipt #${p.id}`,
        debit: 0,
        credit: Number(p.amount)
      }))
    ];

    // 5. Strict Chronological Sort
    combined.sort((a, b) => {
      const dateCompare = new Date(a.date) - new Date(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.type === "Invoice" ? -1 : 1;
    });

    // 6. Calculate Running Balance
    let runningBalance = openingBalance;
    const statement = combined.map((t) => {
      runningBalance += t.debit - t.credit;
      return { ...t, balance: runningBalance };
    });

    // 7. Standardized First Row for Opening Balance
    if (fromDate) {
       statement.unshift({
         date: fromDate,
         type: "Opening",
         description: "Opening Balance Forward",
         debit: openingBalance > 0 ? openingBalance : 0,
         credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
         balance: openingBalance
       });
    }

    res.json(statement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
