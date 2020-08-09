const express = require("express");
const router = express.Router();
const _ = require("lodash");
const Joi = require("joi");
const { Chat, Message, validateMessage } = require("../models/chat");
const mongoose = require("mongoose");
const { Business } = require("../models/business");
const QueryHandler = require("../chats/utils");

var ObjectId = require("mongoose").Types.ObjectId;

router.put("/", async (req, res) => {
  const { clientOneId, clientTwoId } = req.body;

  let chat;
  try {
    chat = QueryHandler.createChat({ clientOneId, clientTwoId });
  } catch (error) {
    res.send("Failed to initiate chat");
    return;
  }
  res.send(chat);
});

router.post("/", async (req, res) => {
  const { error } = Joi.validate(req.body);
  if (error) return res.status(404).send(error.details[0].message);

  // deal with File uploads
  if (req.file) {
  }

  const message = await new Message(
    _.pick(req.body, ["chatId", "senderId", "receiverId", "message"])
  ).save();

  await Chat.updateOne(
    { _id: req.body.chatId },
    { $push: { messages: message } }
  );

  res.send("Message sent");
});

router.post("/messages", async (req, res) => {
  let messageList;
  let messageCount;

  try {
    messageList = await Chat.aggregate([
      {
        $match: {
          _id: ObjectId(req.body.chatId),
        },
      },
      { $unwind: "$messages" },

      {
        $project: {
          createdAt: "$messages.createdAt",
          updatedAt: "$messages.updatedAt",
          senderId: "$messages.senderId",
          receiverId: "$messages.receiverId",
          chatId: "$_id",
          files: "$messages.files",
          message: "$messages.message",
          state: "$messages.state",
          _id: "$messages._id",
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: 10 * req.body.offset },
      { $limit: 10 },
    ]);

    messageCount = await Chat.aggregate([
      {
        $match: {
          _id: ObjectId(req.body.chatId),
        },
      },
      { $unwind: "$messages" },
      { $count: "count" },
    ]);
  } catch (error) {
    console.log(error);
    res.status(400).send("Failed to fetch messages");
    return;
  }
  res.send({ messageList, messageCount });
});

router.get("/", async (req, res) => {
  let chatList;
  try {
    chatList = await QueryHandler.getChatList(req.body.clientOneId);
  } catch (error) {
    res.send("Failed to get chats");
  }

  res.send(chatList);
});

router.post("/messageState", async (req, res) => {
  try {
    await Message.updateOne(
      { _id: ObjectId(req.body.messageId) },
      { state: req.body.state }
    );
  } catch (error) {
    res.send("Failed to update message state");
  }

  res.send("Message state updated");
});

module.exports = router;
