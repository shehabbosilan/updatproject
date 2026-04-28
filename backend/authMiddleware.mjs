import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey_change_me_in_prod";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized - No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach tenant_id to the request object
    req.user = { tenant_id: decoded.tenant_id };
    
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized - Invalid or expired token" });
  }
};
