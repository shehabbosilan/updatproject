import express from "express";
import cors from "cors";

// Routes
import authRouter from "./routes/auth.mjs";
import productsRouter from "./routes/products.mjs";
import invoiceRouter from "./routes/invoice.mjs";
import customersRouter from "./routes/customers.mjs";
import salesRouter from "./routes/sales.mjs";
import paymentsRouter from "./routes/payments.mjs";
import dashboardRouter from "./routes/dashboard.mjs";
import purchasesRouter from "./routes/purchases.mjs";
import reportsRouter from "./routes/reports.mjs";
import suppliersRouter from "./routes/suppliers.mjs";
import treasuryRouter from "./routes/treasury.mjs";

// Middleware
import { authMiddleware } from "./authMiddleware.mjs";

const app = express();
const port = process.env.PORT || 8081;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public Routes
app.use("/api/auth", authRouter);

// Protected Routes (Require JWT)
app.use("/api", authMiddleware, productsRouter);
app.use("/api", authMiddleware, invoiceRouter);
app.use("/api", authMiddleware, customersRouter);
app.use("/api", authMiddleware, salesRouter);
app.use("/api", authMiddleware, paymentsRouter);
app.use("/api", authMiddleware, dashboardRouter);
app.use("/api", authMiddleware, purchasesRouter);
app.use("/api", authMiddleware, reportsRouter);
app.use("/api", authMiddleware, suppliersRouter);
app.use("/api", authMiddleware, treasuryRouter);

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
