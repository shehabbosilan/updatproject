import { prisma } from '../prismaClient.mjs';

/**
 * Foundation for Phase 2 Analytics.
 * Aggregates daily financial performance per tenant.
 */
export class AnalyticsService {
  /**
   * Run aggregation for all tenants for a specific date (defaults to yesterday).
   */
  static async aggregateAllDailyStats(targetDate = null) {
    if (!targetDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      targetDate = yesterday.toISOString().split('T')[0];
    }

    console.log(`[Analytics Service] Aggregating stats for date: ${targetDate}...`);
    
    const tenants = await prisma.tenant.findMany({
      where: { status: 'active', is_deleted: false },
      select: { id: true }
    });

    for (const tenant of tenants) {
      await this.aggregateTenantDailyStats(tenant.id, targetDate);
    }
    
    console.log('[Analytics Service] Daily aggregation completed.');
  }

  /**
   * Aggregate metrics for a single tenant and date.
   */
  static async aggregateTenantDailyStats(tenantId, dateStr) {
    try {
      // 1. Total Sales & Revenue
      const salesData = await prisma.sale.aggregate({
        where: { tenantId, date: dateStr, is_deleted: 0 },
        _count: { id: true },
        _sum: { total: true }
      });

      // 2. Total Expenses (Treasury OUT)
      const expenseData = await prisma.treasury.aggregate({
        where: { tenantId, date: dateStr, type: 'OUT' },
        _sum: { amount: true }
      });

      const totalSales = salesData._count.id || 0;
      const totalRevenue = salesData._sum.total || 0;
      const totalExpenses = expenseData._sum.amount || 0;
      const totalProfit = totalRevenue - totalExpenses;

      // 3. Upsert stats into daily_stats table
      await prisma.dailyStats.upsert({
        where: { tenantId_date: { tenantId, date: dateStr } },
        update: {
          totalSales,
          totalRevenue,
          totalExpenses,
          totalProfit
        },
        create: {
          tenantId,
          date: dateStr,
          totalSales,
          totalRevenue,
          totalExpenses,
          totalProfit
        }
      });
    } catch (error) {
      console.error(`[Analytics Service] Failed for Tenant ${tenantId} on ${dateStr}:`, error.message);
    }
  }

  /**
   * 1. Sales Forecasting: Simple linear projection based on last 30 days.
   */
  static async forecastSales(tenantId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const stats = await prisma.sale.aggregate({
      where: {
        tenantId,
        date: { gte: dateStr },
        is_deleted: 0
      },
      _sum: { total: true },
      _count: { id: true }
    });

    const totalRevenue = stats._sum.total || 0;
    const avgDailyRevenue = totalRevenue / 30;
    const nextMonthForecast = avgDailyRevenue * 30;

    return {
      avgDailyRevenue,
      nextMonthForecast,
      totalOrders30d: stats._count.id,
      message: `Based on last 30 days, your expected revenue next month is $${nextMonthForecast.toLocaleString()}.`
    };
  }

  /**
   * 2. Inventory Prediction: Days until stockout based on usage velocity.
   */
  static async predictStock(tenantId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    // Calculate usage velocity per product
    const usageVelocity = await prisma.$queryRaw`
      SELECT 
        p.id, 
        p.name, 
        p.quantity as "currentStock",
        COALESCE(SUM(si.quantity), 0) as "totalSold"
      FROM products p
      LEFT JOIN sale_items si ON p.id = si.product_id
      LEFT JOIN sales s ON si.sale_id = s.id AND s.date >= ${dateStr}
      WHERE p.tenant_id = ${tenantId}
      GROUP BY p.id, p.name, p.quantity
    `;

    return usageVelocity.map(p => {
      const dailyUsage = Number(p.totalSold) / 30;
      const daysLeft = dailyUsage > 0 ? Math.floor(Number(p.currentStock) / dailyUsage) : 999;
      
      return {
        id: p.id,
        name: p.name,
        currentStock: p.currentStock,
        dailyUsage,
        daysUntilStockout: daysLeft,
        status: daysLeft <= 5 ? 'critical' : (daysLeft <= 15 ? 'warning' : 'stable'),
        message: daysLeft < 999 ? `Product "${p.name}" will run out in approx ${daysLeft} days.` : `Product "${p.name}" has stable stock.`
      };
    });
  }

  /**
   * 3. Customer Analysis: Inactivity and Debt detection.
   */
  static async analyzeCustomers(tenantId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const customers = await prisma.customer.findMany({
      where: { tenantId },
      include: {
        sales: {
          orderBy: { date: 'desc' },
          take: 1,
          select: { date: true }
        }
      }
    });

    return customers.map(c => {
      const lastSaleDate = c.sales[0]?.date;
      const isInactive = !lastSaleDate || lastSaleDate < dateStr;
      const isHighDebt = (c.debt || 0) > 5000;

      return {
        id: c.id,
        name: c.name,
        debt: c.debt,
        lastSaleDate,
        isInactive,
        isHighDebt,
        status: isInactive ? 'inactive' : 'active',
        message: isInactive ? `Customer "${c.name}" inactive for 30+ days.` : `Customer "${c.name}" is active.`
      };
    });
  }
}
