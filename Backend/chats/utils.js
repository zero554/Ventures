const { Business } = require("../models/business");
const { Chat } = require("../models/chat");
const { Message } = require("../models/chat");

const ObjectId = require("mongoose").Types.ObjectId;

class QueryHandler {
  makeUserOnline(userId) {
    return new Promise(async (resolve, reject) => {
      try {
        Business.findAndModify(
          {
            _id: userId,
          },
          [],
          { $set: { online: "Y" } },
          { new: true, upsert: true },
          (err, result) => {
            if (err) {
              reject(err);
            }
            resolve(result.value);
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  userSessionCheck(data) {
    return new Promise(async (resolve, reject) => {
      try {
        Business.findOne({ _id: data.userId, online: "Y" }, (err, result) => {
          if (err) {
            reject(err);
          }
          resolve(result);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  getUserInfo({ userId, socketId = false }) {
    let queryProjection = null;
    if (socketId) {
      queryProjection = {
        socketId: true,
      };
    } else {
      queryProjection = {
        online: 1,
        _id: false,
        id: "$_id",
      };
    }
    return new Promise(async (resolve, reject) => {
      try {
        const client = await Business.findOne(
          {
            _id: userId,
          }
          // {
          //   $project: queryProjection,
          // },
        );
        socketId ? resolve(client["socketId"]) : resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  addSocketId({ userId, socketId }) {
    const data = {
      id: userId,
      value: {
        $set: {
          socketId: socketId,
          online: "Y",
        },
      },
    };
    return new Promise(async (resolve, reject) => {
      try {
        const [DB, ObjectID] = await this.Mongodb.onConnect();
        DB.collection("users").update(
          { _id: ObjectID(data.id) },
          data.value,
          (err, result) => {
            DB.close();
            if (err) {
              reject(err);
            }
            resolve(result);
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  getChatList(clientOneId) {
    return new Promise(async (resolve, reject) => {
      try {
        const chatList = await Chat.aggregate([
          {
            $match: {
              "clients._id": ObjectId(clientOneId),
            },
          },
          { $unwind: "$clients" },
          {
            $match: {
              "clients._id": { $ne: ObjectId(clientOneId) },
            },
          },
          {
            $project: {
              businessId: "$clients._id",
              title: "$clients.businessName",
              imageAlt: "$clients.businessName",
              online: "$clients.online",
              _id: false,
              chatId: "$_id",
              messages: { $slice: ["$messages", -1] },
            },
          },
        ]).sort({ createdAt: 1 });
        resolve(chatList);
      } catch (error) {
        reject(error);
      }
    });
  }

  insertMessages(messagePacket) {
    console.log(messagePacket);
    return new Promise(async (resolve, reject) => {
      try {
        const message = await new Message({
          ...messagePacket,
          state: "DELIVERED",
        });

        if (message) {
          await Chat.updateOne(
            { _id: messagePacket.chatId },
            { $push: { messages: message } }
          );
        }

        resolve(message);
      } catch (error) {
        reject(error);
      }
    });
  }

  updateMessages(messagePacket) {
    return new Promise(async (resolve, reject) => {
      try {
        await Chat.updateOne(
          { _id: messagePacket.chatId, "messages._id": messagePacket },
          {
            $set: { "messages.$.state": messagePacket.state },
          }
        );

        const chat = await Chat.aggregate([
          {
            $match: { _id: ObjectId(messagePacket.chatId) },
          },
          { $unwind: "$messages" },
          { $match: { "messages._id": ObjectId(messagePacket._id) } },
        ]);

        // console.log(chat[0].messages);
        resolve(chat[0].messages);
      } catch (error) {
        reject(error);
      }
    });
  }

  logout(userID, isSocketId) {
    const data = {
      $set: {
        online: "N",
      },
    };
    return new Promise(async (resolve, reject) => {
      try {
        let condition = {};
        if (isSocketId) {
          condition.socketId = userID;
        } else {
          condition._id = ObjectID(userID);
        }
        Business.update(condition, data, (err, result) => {
          if (err) {
            reject(err);
          }
          resolve(result);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = new QueryHandler();
