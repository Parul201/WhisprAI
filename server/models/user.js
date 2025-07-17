const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  command: String,
});

module.exports = mongoose.model("User", userSchema);
