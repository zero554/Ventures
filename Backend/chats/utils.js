const { Business } = require("../models/business");

("use strict");

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
        online: true,
        _id: false,
        id: "$_id",
      };
    }
    return new Promise(async (resolve, reject) => {
      try {
        Business.aggregate([
          {
            $match: {
              _id: userId,
            },
          },
          {
            $project: queryProjection,
          },
        ]).toArray((err, result) => {
          if (err) {
            reject(err);
          }
          socketId ? resolve(result[0]["socketId"]) : resolve(result);
        });
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

  getChatList(socketId) {
    return new Promise(async (resolve, reject) => {
      try {
        Chat.aggregate([
          {$unwind:"$clients"},
          {
            $match: {
              "Business.socketId": socketId,
            },
          },
          {
            $project: {
              businessName: true,
              online: true,
              chatId: "$_id",
            },
          },
        ]).toArray((err, result) => {
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

  insertMessages(messagePacket) {
    return new Promise(async (resolve, reject) => {
      try {
        const [DB, ObjectID] = await this.Mongodb.onConnect();
        Message.insertOne(messagePacket, (err, result) => {
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

  getMessages({chatId, businessId}) {
    return new Promise(async (resolve, reject) => {
      try {
        Message
          .aggregate([{
            $match:{
              "chatId": chatId, "receiver":
            }
          }
          ])
          .find(data)
          .sort({ timestamp: 1 })
          .toArray((err, result) => {
            DB.close();
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

  logout(userID, isSocketId) {
    const data = {
      $set: {
        online: "N",
      },
    };
    return new Promise(async (resolve, reject) => {
      try {
        const [DB, ObjectID] = await this.Mongodb.onConnect();
        let condition = {};
        if (isSocketId) {
          condition.socketId = userID;
        } else {
          condition._id = ObjectID(userID);
        }
        DB.collection("users").update(condition, data, (err, result) => {
          DB.close();
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
