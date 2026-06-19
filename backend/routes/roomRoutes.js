// routes/roomRoutes.js
const express = require("express");
const router = express.Router();
const { getRoomInfo } = require("../controllers/roomController");

router.get("/:roomId", getRoomInfo);

module.exports = router;