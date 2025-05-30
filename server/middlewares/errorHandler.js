// Centralized error handler for Express
module.exports = (err, req, res, next) => {
  // Default to 500 if status not set
  const status = err.status || 500;
  let message = err.message || "Internal Server Error";

  // Sequelize validation errors
  if (err.name === "SequelizeValidationError" || err.name === "SequelizeUniqueConstraintError") {
    message = err.errors?.[0]?.message || message;
    return res.status(400).json({ message });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  // Custom error with status
  res.status(status).json({ message });
};
