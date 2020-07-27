const mongoose = require("mongoose");
const Joi = require("joi");
const { businessSchema } = require("./business");

let Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 3 },
  caption: { type: String, required: false },
  url: { type: String, required: true },
  type: { type: String, enum: ["image", "file"] },
});

const messageSchema = new mongoose.Schema({
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: false, default: Date.now },
  senderId: { type: ObjectId, ref: "Business" },
  receiverId: { type: ObjectId, ref: "Business" },
  files: { type: [fileSchema], required: false },
  state: { type: String, enum: ["SENT", "DELIVERED", "READ"], default: "SENT" },
  message: { type: String, required: false },
  replyMessageId: { type: ObjectId, ref: "Message" },
});

const chatSchema = new mongoose.Schema({
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: false, default: Date.now },
  clients: {
    type: [
      businessSchema.add({
        businessEmail: {
          type: String,
          required: true,
          minlength: 3,
          unique: false,
        },
      }),
    ],
    required: true,
  },
  messages: { type: [messageSchema], required: false },
});

function validateMessage(message) {
  return Joi.validate(message, {
    chatId: Joi.string().required().min(24),
    senderId: Joi.string().required().min(24),
    receiverId: Joi.string().required().min(24),
    fileId: Joi.string().min(24),
  });
}

function validateFile(file) {
  return Joi.validate(file, {
    name: Joi.string().required().min(3),
    url: Joi.string().required().min,
  });
}

module.exports.validateFile = validateFile;
module.exports.validateMessage = validateMessage;
module.exports.Chat = mongoose.model("Chat", chatSchema);
module.exports.Message = mongoose.model("Message", messageSchema);
module.exports.File = mongoose.model("File", fileSchema);
