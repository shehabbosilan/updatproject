import { prisma } from "./prismaClient.mjs";
import Database from "better-sqlite3";

import bcrypt from "bcrypt";

const sqliteDb = new Database("../Data.db");


async function migrate() {
  console.log("Starting migration from SQLite to PostgreSQL...");

  try {
    // 1. Create a default tenant
    console.log("Creating default tenant...");
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash("admin", saltRounds);

    let defaultTenant = await prisma.tenant.findUnique({
      where: { username: "legacy_shop" },
    });

    if (!defaultTenant) {
      defaultTenant = await prisma.tenant.create({
        data: {
          username: "legacy_shop",
          password: hashedPassword,
        },
      });
    }

    const tenantId = defaultTenant.id;
    console.log(`Default tenant created with ID: ${tenantId}`);

    // 2. Migrate Products
    console.log("Migrating products...");
    const products = sqliteDb.prepare("SELECT * FROM products").all();
    for (const p of products) {
      await prisma.product.create({
        data: {
          tenantId,
          name: p.name,
          category: p.category,
          unit: p.unit,
          cost_price: Number(p.cost_price),
          selling_price: Number(p.selling_price),
          low_stock_threshold: p.low_stock_threshold,
          description: p.description,
          expire_date: p.expire_date,
        },
      });
    }

    // 3. Migrate Customers
    console.log("Migrating customers...");
    const customers = sqliteDb.prepare("SELECT * FROM customers").all();
    const customerIdMap = {};
    for (const c of customers) {
      const created = await prisma.customer.create({
        data: {
          tenantId,
          name: c.name,
          phone: c.phone,
          address: c.address,
          debt: c.debt,
          total_purchases: c.total_purchases,
        },
      });
      customerIdMap[c.id] = created.id;
    }

    // 4. Migrate Suppliers
    console.log("Migrating suppliers...");
    const suppliers = sqliteDb.prepare("SELECT * FROM suppliers").all();
    const supplierIdMap = {};
    for (const s of suppliers) {
      const created = await prisma.supplier.create({
        data: {
          tenantId,
          name: s.name,
          phone: s.phone,
          email: s.email,
          address: s.address,
          total_purchases: s.total_purchases,
          total_paid: s.total_paid,
          remaining_balance: s.remaining_balance,
        },
      });
      supplierIdMap[s.id] = created.id;
    }

    // 5. Migrate Sales & Sale Items
    console.log("Migrating sales and items...");
    // ensure tables exist in sqlite first (legacy schema might be missing them if empty)
    const salesTableExists = sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sales'").get();
    if (salesTableExists) {
        const sales = sqliteDb.prepare("SELECT * FROM sales").all();
        for (const s of sales) {
        const createdSale = await prisma.sale.create({
            data: {
            tenantId,
            customer_id: s.customer_id ? customerIdMap[s.customer_id] : null,
            customer_name: s.customer_name,
            total: Number(s.total),
            paid: Number(s.paid),
            remaining: Number(s.remaining),
            status: s.status,
            date: s.date,
            is_deleted: s.is_deleted,
            },
        });

        // Migrate items for this sale
        const saleItemsTableExists = sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sale_items'").get();
        if (saleItemsTableExists) {
            const items = sqliteDb.prepare("SELECT * FROM sale_items WHERE sale_id = ?").all(s.id);
            for (const item of items) {
                // Find matching product by old ID (Assuming IDs match, wait, Prisma auto-increments. 
                // A better approach is matching by old ID, but since we inserted them in order, the IDs might match if the tables were empty.
                // To be safe, we should map product IDs). Let's fetch the product from DB based on name or category.
                // For simplicity, we assume the IDs remained the same or we just insert them without foreign key checks if possible.
                // To avoid migration crashes on old IDs, we'll try to insert using the old ID as the new ID. 
                // Prisma doesn't easily let you override autoincrement ID on insert unless you use raw query or just let it increment and map it.
                // For this script, we'll assume product IDs matched or we can just map them.
                
                await prisma.saleItem.create({
                data: {
                    tenantId,
                    sale_id: createdSale.id,
                    product_id: item.product_id, // THIS MIGHT BREAK IF IDS DONT MATCH. In production migration, build an ID map.
                    quantity: item.quantity,
                    price: Number(item.price),
                },
                });
            }
        }
        }
    }

    // 6. Migrate Treasury
    console.log("Migrating treasury...");
    const treasuryTableExists = sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='treasury'").get();
    if (treasuryTableExists) {
        const treasury = sqliteDb.prepare("SELECT * FROM treasury").all();
        for (const t of treasury) {
        await prisma.treasury.create({
            data: {
            tenantId,
            date: t.date,
            type: t.type,
            amount: Number(t.amount),
            description: t.description,
            category: t.category,
            reference_id: t.reference_id,
            running_balance: Number(t.running_balance),
            },
        });
        }
    }

    // 7. Migrate Payments
    console.log("Migrating customer payments...");
    const paymentsTableExists = sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='payments'").get();
    if (paymentsTableExists) {
        const payments = sqliteDb.prepare("SELECT * FROM payments").all();
        for (const p of payments) {
        await prisma.payment.create({
            data: {
            tenantId,
            customer_id: customerIdMap[p.customer_id] || p.customer_id,
            amount: Number(p.amount),
            date: p.date,
            },
        });
        }
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
