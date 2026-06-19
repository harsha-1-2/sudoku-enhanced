const express = require("express");
const router = express.Router();
const { register, login, logout, refresh } = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// ✅ NEW: Refresh token endpoint (no auth needed - uses refresh cookie)
router.post("/refresh", refresh);

// ✅ Verify user endpoint - protected route
router.get("/me", auth, async (req, res) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.user.id);
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
