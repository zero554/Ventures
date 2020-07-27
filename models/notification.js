const mongoose = require("mongoose");
let Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

const notificationSchema = mongoose.Schema({
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: false, default: Date.now },
  type: { type: String, required: true, enum: ["MESSAGE", "RATING"] },
  message: { type: String, required: true },
  target: { type: ObjectId, required: true },
  state: { type: String, enum: ["SENT", "DELIVERED", "READ"] },
});

module.exports.Notification = mongoose.model(
  "Notification",
  notificationSchema
);
