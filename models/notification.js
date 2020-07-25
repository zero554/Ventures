const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema({
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: false, default: Date.now },
  type: { type: String, required: true },
  message: { type: String, required: true },
  target: { type: User, required: true },
  state: { type: String, enum: ["SENT", "DELIVERED", "READ"] },
});
