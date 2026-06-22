// controllers/authController.js
const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ msg: "Email already used" });

    const hash = await bcrypt.hash(password, 4);

    await prisma.user.create({
      data: { username, email, password: hash }
    });

    res.json({ msg: "User created successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Wrong password" });

    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/"
    };

    res.cookie("token", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({ user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.logout = async (req, res) => {
  res.clearCookie("token");
  res.clearCookie("refreshToken");
  res.json({ msg: "Logged out successfully" });
};

exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ msg: "No refresh token" });

    const verified = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    const newAccessToken = jwt.sign(
      { id: verified.id, email: verified.email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/"
    };

    res.cookie("token", newAccessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.json({ msg: "Token refreshed" });
  } catch (err) {
    res.status(401).json({ msg: "Invalid refresh token" });
  }
};
