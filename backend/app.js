import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "ws";

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
import adminRouter from "./routes/admin.mjs";
import aiAlertsRouter from "./routes/aiAlerts.mjs";
import analyticsRouter from "./routes/analytics.mjs";

// AI Services & Cron
import cron from "node-cron";
import { AIAlertService } from "./services/aiAlertService.mjs";
import { AnalyticsService } from "./services/analyticsService.mjs";

// Middleware
import { authMiddleware } from "./authMiddleware.mjs";
import { adminMiddleware } from "./adminMiddleware.mjs";

const app = express();
const port = process.env.PORT || 8081;

// ==========================================
//  CORS - Allow localhost + Cloudflare tunnel
// ==========================================
const allowedOrigins = [
  "http://localhost:8083",
  "http://localhost:8082",
  "http://localhost:3000",
  // Add Cloudflare tunnel URLs from .env (comma-separated)
  ...(process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
    : [])
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    // Check if origin is in the explicitly allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Also allow any *.trycloudflare.com subdomain for quick tunnels (Regex for safety)
    if (/\.trycloudflare\.com$/.test(origin)) {
      return callback(null, true);
    }

    // In development, you might want to log blocked origins
    console.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error(`CORS policy: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With", "X-HTTP-Method-Override"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
//  Force UTF-8 on all JSON responses
// ==========================================
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

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
app.use("/api/alerts", aiAlertsRouter);
app.use("/api/analytics", analyticsRouter);

// Admin Routes (Require JWT + Owner Role)
app.use("/api/admin", authMiddleware, adminMiddleware, adminRouter);

// ==========================================
//  404 Handler
// ==========================================
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ==========================================
//  Global Error Handler
// ==========================================
app.use((err, req, res, next) => {
  console.error("[Global Error]", err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

// ==========================================
//  Server & WebSocket Setup
// ==========================================
const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws) => {
  console.log("[WebSocket] New client connected");
  ws.on("message", (message) => {
    console.log(`[WebSocket] Received: ${message}`);
  });
  ws.send(JSON.stringify({ type: "welcome", message: "Connected to Agri ERP Real-time Server" }));
});

// Start server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
  console.log(`WebSocket Server active on /ws`);
  
  // Initialize AI Smart Alerts Cron (Every 1 hour)
  cron.schedule("0 * * * *", () => {
    AIAlertService.processAllAlerts().catch(err => {
      console.error("[Cron Error] AI Alert Service failed:", err);
    });
  });

  // Initialize Daily Stats Aggregation (Every day at 00:05)
  cron.schedule("5 0 * * *", () => {
    AnalyticsService.aggregateAllDailyStats().catch(err => {
      console.error("[Cron Error] Analytics Service failed:", err);
    });
  });

  // Optional: Run once on startup for immediate feedback
  AIAlertService.processAllAlerts().catch(err => {
    console.error("[Startup Error] AI Alert Service failed:", err);
  });
});
