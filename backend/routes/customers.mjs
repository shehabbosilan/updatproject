import { prisma } from "../prismaClient.mjs";
import { Router } from "express";



const router = Router();

// =========================
//  SEARCH CUSTOMER BY PHONE
// =========================
router.get("/customers/search/:phone", async (req, res) => {
  const { phone } = req.params;
  try {
    const customer = await prisma.customer.findFirst({
      where: {
        phone,
        tenantId: req.user.tenant_id,
      },
      include: {
        sales: {
          where: { is_deleted: 0 },
        },
      },
    });

    if (customer) {
      const total_debt = customer.sales.reduce(
        (acc, sale) => acc + (sale.remaining || 0),
        0
      );
      
      const { sales, ...customerData } = customer;
      
      res.json({
        ...customerData,
        total_debt,
      });
    } else {
      res.status(404).json({ message: "Customer not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
//  ADD/UPDATE CUSTOMER
// =========================
router.post("/customers", async (req, res) => {
  const { name, phone } = req.body;
  try {
    const existing = await prisma.customer.findFirst({
      where: { phone, tenantId: req.user.tenant_id },
    });

    if (existing) {
      const updated = await prisma.customer.update({
        where: { id: existing.id },
        data: { name },
      });
      res.json({ id: updated.id, name, phone, message: "Customer updated" });
    } else {
      const created = await prisma.customer.create({
        data: {
          tenantId: req.user.tenant_id,
          name,
          phone,
        },
      });
      res.json({
        id: created.id,
        name,
        phone,
        message: "Customer created",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
//  GET ALL CUSTOMERS WITH DEBT
// =========================
router.get("/customers", async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { tenantId: req.user.tenant_id },
      include: {
        sales: {
          where: { is_deleted: 0 },
        },
      },
    });

    const result = customers.map((c) => {
      const total_debt = c.sales.reduce(
        (acc, sale) => acc + (sale.remaining || 0),
        0
      );
      
      const { sales, ...customerData } = c;
      return {
        ...customerData,
        total_debt,
      };
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
