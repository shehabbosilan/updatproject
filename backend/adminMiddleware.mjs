export const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== "owner") {
    return res.status(403).json({ message: "Forbidden - Owner access required" });
  }
  next();
};
