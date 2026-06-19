// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { register, login, logout, refresh } = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");
const prisma = require("../config/prisma");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refresh);

router.get("/me", auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, email: true }
    });

    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;