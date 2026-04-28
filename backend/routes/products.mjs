import { prisma } from "../prismaClient.mjs";
import { Router } from "express";



const router = Router();

// =========================
//  ADD PRODUCT
// =========================
router.post("/product", async (req, res) => {
  const {
    name,
    category,
    unit,
    cost_price,
    selling_price,
    low_stock_threshold,
    description,
    expire_date,
  } = req.body;

  try {
    await prisma.product.create({
      data: {
        tenantId: req.user.tenant_id,
        name,
        category,
        unit,
        cost_price: Number(cost_price),
        selling_price: Number(selling_price),
        low_stock_threshold: Number(low_stock_threshold) || 0,
        description,
        expire_date,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error adding product" });
  }
});

// =========================
//  GET ALL PRODUCTS
// =========================
router.get("/product", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { tenantId: req.user.tenant_id },
    });

    const now = new Date();

    const result = products.map((p) => {
      const isExpired = p.expire_date && new Date(p.expire_date) < now;

      const isExpiringSoon =
        p.expire_date &&
        new Date(p.expire_date) > now &&
        new Date(p.expire_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      return {
        ...p,
        is_expired: !!isExpired,
        is_expiring_soon: !!isExpiringSoon,
      };
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching products" });
  }
});

// =========================
//  GET PRODUCT BY ID
// =========================
router.get("/product/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const product = await prisma.product.findFirst({
      where: { 
        id,
        tenantId: req.user.tenant_id
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const now = new Date();

    res.json({
      ...product,
      is_expired: product.expire_date && new Date(product.expire_date) < now,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching product" });
  }
});

// =========================
//  DELETE PRODUCT
// =========================
router.delete("/product/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    await prisma.product.deleteMany({
      where: {
        id,
        tenantId: req.user.tenant_id
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error deleting product" });
  }
});

// =========================
//  UPDATE PRODUCT
// =========================
router.put("/product", async (req, res) => {
  const {
    id,
    name,
    category,
    unit,
    cost_price,
    selling_price,
    low_stock_threshold,
    description,
    expire_date,
  } = req.body;

  try {
    await prisma.product.updateMany({
      where: {
        id: parseInt(id),
        tenantId: req.user.tenant_id
      },
      data: {
        name,
        category,
        unit,
        cost_price: Number(cost_price),
        selling_price: Number(selling_price),
        low_stock_threshold: Number(low_stock_threshold) || 0,
        description,
        expire_date,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error updating product" });
  }
});

// =========================
//  UPDATE STOCK
// =========================
router.put("/product/stock", async (req, res) => {
  const { items } = req.body;

  try {
    // Prisma doesn't natively support bulk decrementing multiple different records differently
    // We'll execute a transaction with multiple updates
    const operations = items.map((item) => {
      return prisma.product.updateMany({
        where: {
          id: parseInt(item.id),
          tenantId: req.user.tenant_id
        },
        data: {
          low_stock_threshold: {
            decrement: parseInt(item.quantity)
          }
        }
      });
    });

    await prisma.$transaction(operations);

    res.json({ success: true, message: "Stock updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error updating stock" });
  }
});

export default router;
