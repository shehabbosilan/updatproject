import jwt from "jsonwebtoken";
import { prisma } from "./prismaClient.mjs";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey_change_me_in_prod";

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized - No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch tenant from db
    const tenant = await prisma.tenant.findUnique({
      where: { id: decoded.tenant_id }
    });

    if (!tenant || tenant.deleted) {
      return res.status(403).json({ message: "Account not found or deleted" });
    }

    if (tenant.status !== "active") {
      return res.status(403).json({ message: "Account suspended" });
    }

    if (tenant.role !== "owner" && tenant.expiresAt && new Date(tenant.expiresAt) < new Date()) {
      return res.status(403).json({ message: "Subscription expired" });
    }

    // Attach user payload to the request object
    req.user = { 
      tenant_id: tenant.id,
      role: tenant.role
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized - Invalid or expired token" });
  }
};
