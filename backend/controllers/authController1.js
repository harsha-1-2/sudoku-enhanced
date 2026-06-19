const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: "Email already used" });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hash
    });

    res.json({ msg: "User created successfully" });
  } 
  catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.time("login-total");

    console.time("db-find");
    const user = await User.findOne({ email });
    console.timeEnd("db-find");

    if (!user) {
      console.timeEnd("login-total");
      return res.status(400).json({ msg: "User not found" });
    }

    console.time("bcrypt-compare");
    const match = await bcrypt.compare(password, user.password);
    console.timeEnd("bcrypt-compare");

    if (!match) {
      console.timeEnd("login-total");
      return res.status(400).json({ msg: "Wrong password" });
    }

    console.time("jwt-sign");
    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    console.timeEnd("jwt-sign");

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/"
    };

    // Send access token as HTTP-Only cookie
    res.cookie("token", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    // Send refresh token as HTTP-Only cookie (with longer expiry)
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    console.timeEnd("login-total");
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } 
  catch (err) {
    console.timeEnd("login-total");
    res.status(500).json({ msg: err.message });
  }
};

exports.logout = async (req, res) => {
  res.clearCookie("token");
  res.clearCookie("refreshToken");
  res.json({ msg: "Logged out successfully" });
};

// ✅ NEW: Refresh token endpoint
exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ msg: "No refresh token" });

    const verified = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    // Issue new access token
    const newAccessToken = jwt.sign(
      { id: verified.id, email: verified.email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/"
    };

    res.cookie("token", newAccessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.json({ msg: "Token refreshed" });
  } catch (err) {
    res.status(401).json({ msg: "Invalid refresh token" });
  }
};
