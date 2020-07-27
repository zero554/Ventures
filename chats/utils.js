const { Business } = require("../models/business");
const { Chat } = require("../models/chat");
const { Message, File } = require("../models/chat");
const { Notification } = require("../models/notification");
const { Storage } = require("@google-cloud/storage");
const ObjectId = require("mongoose").Types.ObjectId;

const sharp = require("sharp");
const { reject } = require("lodash");

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

  getNotifications({ userId }) {
    return new Promise(async (resolve, reject) => {
      try {
        const notificationList = await Notification.find({
          target: userId,
        });

        const notificationCount = await Notification.aggregate([
          {
            $match: { target: ObjectId(userId), state: "DELIVERED" },
          },
          {
            $count: "unread",
          },
        ]);

        resolve({ list: notificationList, unreadCount: notificationCount });
      } catch (error) {
        console.log(error);
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

  async createChat({ clientOneId, clientTwoId, chatId, message }) {
    return new Promise(async (resolve, reject) => {
      const clientOne = await Business.findById(clientOneId);
      const clientTwo = await Business.findById(clientTwoId);

      // Check if clients exist
      if (!clientOne)
        reject({ error: `Business with key ${clientOneId} does not exist` });
      else if (!clientTwo)
        reject({ error: `Business with key ${clientTwoId} does not exist` });

      try {
        // Check if a chat between the two clients exists
        const sharedChat = await Chat.aggregate([
          {
            $match: { "clients._id": ObjectId(clientOneId) },
          },
          { $unwind: "$clients" },
          {
            $match: { "clients._id": ObjectId(clientTwoId) },
          },
        ]);

        if (sharedChat[0]) reject({ error: "Chat object exist" });
        else {
          let fileObj;
          if (message.files[0]) {
            const [obj] = await Promise.all([this.uploadDoc(message)]);
            fileObj = obj;
          }
          const chat = await new Chat({
            _id: ObjectId(chatId),
            clients: [clientOne, clientTwo],
            messages: [
              new Message({
                _id: ObjectId(message._id),
                senderId: clientOneId,
                receiverId: clientTwoId,
                message: message.text,
                state: "DELIVERED",
                files: [fileObj],
              }),
            ],
          }).save();
          // res.json(chat);
          resolve(chat);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  uploadDoc(messagePacket) {
    return new Promise(async (resolve, reject) => {
      const file = messagePacket.files[0];
      let fileName;
      if (file.type.includes("image")) fileName = `img-${Date.now()}.jpg`;
      else fileName = file.originalName;

      // Creates a client
      const bucketName = process.env.BUCKET;
      const GCStorage = new Storage();
      const bucket = GCStorage.bucket("venture_bucket");

      const blob = bucket.file(file.originalName.replace(/ /g, "_"));

      const blobStream = blob.createWriteStream({
        resumable: false,
      });

      blobStream.on("finish", () => {
        blob.move(fileName).then(async () => {
          bucket.file(fileName).makePublic();

          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

          resolve(
            new File({
              name: fileName,
              caption: file.caption,
              url: publicUrl,
              type: file.type,
            })
          );
        });
      });

      if (file.type.includes("image")) {
        const fileBuffer = await sharp(file.file)
          .jpeg({
            options: {
              quality: 85,
              chromaSubsampling: "4:4:4",
            },
          })
          .toBuffer();
        blobStream.end(fileBuffer);
      } else {
        blobStream.end(file.file);
      }
    });
  }

  async insertMessages(messagePacket) {
    let fileObj;

    if (messagePacket.files[0]) {
      const [obj] = await Promise.all([this.uploadDoc(messagePacket)]);
      fileObj = obj;
    }

    return new Promise(async (resolve, reject) => {
      try {
        const message = await new Message({
          ...messagePacket,
          state: "DELIVERED",
          files: [fileObj],
        });

        if (message) {
          await Chat.findByIdAndUpdate(
            { _id: ObjectId(messagePacket.chatId) },
            { $push: { messages: message } }
          );
        }

        resolve({ ...message._doc, chatId: messagePacket.chatId });
      } catch (error) {
        reject(error);
      }
    });
  }

  insertNotification({ type, receiverId, senderName, rating }) {
    console.log("hya");
    return new Promise(async (resolve, reject) => {
      try {
        const notification = await new Notification({
          type,
          message:
            type === "MESSAGE"
              ? `${senderName} sent you a message.`
              : `${senderName} gave you a ${rating} rating.`,
          target: receiverId,
          state: "DELIVERED",
        }).save();
        console.log("Notification", notification);
        resolve(notification);
      } catch (error) {
        console.log(error);
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

        resolve({ ...chat[0].messages, chatId: messagePacket.chatId });
      } catch (error) {
        reject(error);
      }
    });
  }

  updateNotification({ id }) {
    return new Promise(async (resolve, reject) => {
      try {
        const notification = await Notification.updateOne(
          { _id: id },
          { state: "READ" }
        );

        console.log(notification);
        resolve(notification);
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
