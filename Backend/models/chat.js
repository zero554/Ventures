const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: false, default: Date.now },
  socketId: { type: String, required: true },
});

const messageSChema = new mongoose.Schema({
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: false, default: Date.now },
  chatId: { type: Schema.Types.ObjectId, ref: "Chat" },
  senderId: { type: Schema.Types.ObjectId, ref: "User" },
  receiverId: { type: Schema.Types.ObjectId, ref: "User" },
  fileId: { type: Schema.Types.ObjectId, ref: "File" },
  state: { type: String, enum: ["SENT", "RECEIVED", "READ"], default: "SENT" },
  text: { type: String, required: true },
  replyMessageId: { type: Schema.Types.ObjectId, ref: "Message" },
});

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 3 },
  url: { type: String, required: true },
});
