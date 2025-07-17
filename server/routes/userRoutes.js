// server/routes/userRoutes.js

const express = require("express");
const router = express.Router();
const User = require("../models/user");

// Save or update user
router.post("/save", async (req, res) => {
  const { name, deviceId } = req.body;

  let user = await User.findOne({ deviceId });
  if (user) {
    user.name = name;
    await user.save();
  } else {
    user = await User.create({ name, deviceId });
  }

  res.json({ message: "User saved successfully", user });
});

// Log command
router.post("/log-command", async (req, res) => {
  const { deviceId, command } = req.body;
  const user = await User.findOne({ deviceId });

  if (user) {
    user.commands.push(command);
    await user.save();
    res.json({ message: "Command logged" });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

module.exports = router; // ✅ Make sure you're exporting the router
