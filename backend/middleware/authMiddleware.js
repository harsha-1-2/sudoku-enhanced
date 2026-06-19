const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // ✅ SECURE: Read token from HTTP-Only cookie instead of header
  const token = req.cookies.token;

  if (!token) return res.status(401).json({ msg: "No token" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } 
  catch {
    res.status(401).json({ msg: "Invalid token" });
  }
};
