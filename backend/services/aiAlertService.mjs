import { prisma } from '../prismaClient.mjs';

/**
 * Hardened AI Alert Service (Phase 1.5)
 * Includes Cooldowns, Scoring, and Standardized Metadata.
 */
export class AIAlertService {
  static BATCH_SIZE = parseInt(process.env.AI_BATCH_SIZE || '50');
  static COOLDOWN_HOURS = 24;

  /**
   * Process alerts in batches with configurable size.
   */
  static async processAllAlerts() {
    console.log(`[AI Alert Service] Starting checks (Batch Size: ${this.BATCH_SIZE})...`);
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const tenants = await prisma.tenant.findMany({
        where: { status: 'active', is_deleted: false },
        take: this.BATCH_SIZE,
        skip: skip,
        select: { id: true }
      });

      if (tenants.length === 0) {
        hasMore = false;
        break;
      }

      await Promise.allSettled(tenants.map(t => this.processTenantAlerts(t.id)));
      skip += this.BATCH_SIZE;
    }
    console.log('[AI Alert Service] All alerts processed.');
  }

  static async processTenantAlerts(tenantId) {
    try {
      await this.checkExpiryAlerts(tenantId);
      await this.checkStockAlerts(tenantId);
      await this.checkDebtAlerts(tenantId);
      await this.checkDeadStockAlerts(tenantId);
    } catch (error) {
      console.error(`[AI Alert Service] Tenant ${tenantId} Error:`, error.message);
    }
  }

  /**
   * Expiry: Priority Logic & Standardized Metadata
   */
  static async checkExpiryAlerts(tenantId) {
    const today = new Date();
    const products = await prisma.product.findMany({
      where: { tenantId, expire_date: { not: null } }
    });

    for (const product of products) {
      const expiryDate = new Date(product.expire_date);
      if (isNaN(expiryDate.getTime())) continue;

      const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      if (diffDays > 7 || diffDays < 0) continue;

      let priority = 'normal';
      let score = 60;

      if (diffDays <= 1) { priority = 'critical'; score = 100; }
      else if (diffDays <= 3) { priority = 'urgent'; score = 85; }

      const message = `[${priority.toUpperCase()}] "${product.name}" expires in ${diffDays} days.`;
      const metadata = { productId: product.id, daysLeft: diffDays };

      await this.upsertAlert(tenantId, 'expiry', String(product.id), message, priority, score, metadata);
    }
  }

  /**
   * Stock: Critical levels & Metadata
   */
  static async checkStockAlerts(tenantId) {
    const products = await prisma.product.findMany({
      where: { tenantId, low_stock_threshold: { not: null, gt: 0 } }
    });

    for (const product of products) {
      if (product.quantity >= product.low_stock_threshold) continue;

      let priority = 'normal';
      let score = 70;

      if (product.quantity === 0) { priority = 'critical'; score = 100; }
      else if (product.quantity <= product.low_stock_threshold * 0.1) { priority = 'urgent'; score = 90; }

      const message = `Stock Alert: "${product.name}" level at ${product.quantity} (Threshold: ${product.low_stock_threshold}).`;
      const metadata = { productId: product.id, current: product.quantity, min: product.low_stock_threshold };

      await this.upsertAlert(tenantId, 'stock', String(product.id), message, priority, score, metadata);
    }
  }

  /**
   * Debt: Risk-based Scoring
   */
  static async checkDebtAlerts(tenantId) {
    const customers = await prisma.customer.findMany({
      where: { tenantId, debt: { gt: 0 } }
    });

    for (const customer of customers) {
      let priority = 'normal';
      let score = 50 + Math.min(40, Math.floor(customer.debt / 1000));

      if (customer.debt > 10000) { priority = 'critical'; score = 95; }
      else if (customer.debt > 5000) { priority = 'urgent'; score = 80; }

      const message = `Debt Risk: Customer "${customer.name}" owes $${customer.debt.toLocaleString()}.`;
      const metadata = { customerId: customer.id, amount: customer.debt };

      await this.upsertAlert(tenantId, 'debt', String(customer.id), message, priority, score, metadata);
    }
  }

  /**
   * Dead Stock: Enhanced SQL with Index Optimization
   */
  static async checkDeadStockAlerts(tenantId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    // Using subquery with indexed date check
    const deadProducts = await prisma.$queryRaw`
      SELECT p.id, p.name 
      FROM products p
      WHERE p.tenant_id = ${tenantId}
      AND NOT EXISTS (
        SELECT 1 FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        WHERE si.product_id = p.id
        AND s.tenant_id = ${tenantId}
        AND s.date >= ${dateStr}
      )
      LIMIT 100
    `;

    for (const product of deadProducts) {
      await this.upsertAlert(tenantId, 'dead_stock', String(product.id), 
        `Dead Stock: "${product.name}" has no sales in 30 days.`, 'normal', 40, { productId: product.id });
    }
  }

  /**
   * Core Upsert Logic with COOLDOWN protection
   */
  static async upsertAlert(tenantId, type, referenceId, message, priority, score, metadata) {
    const cooldownPeriod = new Date();
    cooldownPeriod.setHours(cooldownPeriod.getHours() - this.COOLDOWN_HOURS);

    try {
      // Check for recent alert to respect cooldown
      const recentAlert = await prisma.aIAlert.findUnique({
        where: { tenantId_type_referenceId: { tenantId, type, referenceId } }
      });

      if (recentAlert && recentAlert.lastTriggeredAt > cooldownPeriod && recentAlert.priority === priority) {
        // Skip if already triggered recently with same priority
        return;
      }

      await prisma.aIAlert.upsert({
        where: { tenantId_type_referenceId: { tenantId, type, referenceId } },
        update: {
          message,
          priority,
          score,
          metadata,
          isRead: false,
          lastTriggeredAt: new Date()
        },
        create: {
          tenantId,
          type,
          referenceId,
          message,
          priority,
          score,
          metadata
        }
      });
    } catch (err) {
      console.error(`[AI Service] Upsert Failed: ${err.message}`);
    }
  }
}
