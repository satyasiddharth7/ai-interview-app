const admin = require("../firebaseAdmin");

module.exports = async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ")
      ? header.substring(7)
      : null;

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // contains uid, email
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};