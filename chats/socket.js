/*
 * Real time private chatting app using Angular 2, Nodejs, mongodb and Socket.io
 * @author Shashank Tiwari
 */

"use strict";

const path = require("path");
const { Business } = require("../models/business");
const queryHandler = require("./utils");

class Socket {
  constructor(socket) {
    this.io = socket;
  }

  socketEvents() {
    this.io.on("connection", (socket) => {
      /* Get the user's Chat list	*/

      socket.on("notifications", async (data) => {
        if (data.userId === "") {
          this.io.emit(`notification-response`, {
            error: true,
            message: "User not found",
          });
        } else {
          try {
            const [response] = await Promise.all([
              queryHandler.getNotifications(data),
            ]);

            this.io.to(socket.id).emit(`notification-response`, {
              error: false,
              notifications: response,
            });
          } catch (error) {
            this.io.to(socket.id).emit(`notification-response`, {
              error: true,
              notifications: [],
            });
          }
        }
      });

      socket.on(`chat-list`, async (data) => {
        if (data.userId === "") {
          this.io.emit(`chat-list-response`, {
            error: true,
            message: "User not found",
          });
        } else {
          try {
            const [chatlistResponse] = await Promise.all([
              queryHandler.getChatList(data.userId),
            ]);

            this.io.to(socket.id).emit(`chat-list-response`, {
              error: false,
              chatList: chatlistResponse,
            });
          } catch (error) {
            this.io.to(socket.id).emit(`chat-list-response`, {
              error: true,
              chatList: [],
            });
          }
        }
      });

      /**
       * send the messages to the user
       */
      socket.on(`add-message`, async (data) => {
        if (data.message === "") {
          this.io.to(socket.id).emit(`add-message-response`, {
            error: true,
            message: "Message is null",
          });
        } else if (data.senderId === "") {
          this.io.to(socket.id).emit(`add-message-response`, {
            error: true,
            message: "Sender id is null",
          });
        } else if (data.receiverId === "") {
          this.io.to(socket.id).emit(`add-message-response`, {
            error: true,
            message: "Receiver id is null",
          });
        } else {
          try {
            const [toSocketId, message, notification] = await Promise.all([
              queryHandler.getUserInfo({
                userId: data.receiverId,
                socketId: true,
              }),

              queryHandler.insertMessages(data),
              queryHandler.insertNotification({
                userId: data.receiverId,
                type: "MESSAGE",
                message: "New message",
                from: data.senderName,
              }),
            ]);

            this.io.to(toSocketId).emit(`add-message-response`, message);
            this.io.to(toSocketId).emit(`receive-notification`, notification);
            this.io.to(socket.id).emit(`add-message-response`, message);
          } catch (error) {
            console.log(error);
            this.io.to(socket.id).emit(`add-message-response`, {
              error: true,
              message: "couldn't send message",
            });
          }
        }
      });

      socket.on("add-chat", async (data) => {
        if (data.clientOneId === "") {
          this.io.to(socket.id).emit(`add-chat-response`, {
            error: true,
            message: "clientOne id is null",
          });
        } else if (data.clientTwoId === "") {
          this.io.to(socket.id).emit(`add-chat-response`, {
            error: true,
            message: "clientTwo id is null",
          });
        } else if (data.message.text === "") {
          this.io.to(socket.id).emit(`add-chat-response`, {
            error: true,
            message: "Initiation message id is null",
          });
        } else {
          try {
            const [toSocketId, chat] = await Promise.all([
              queryHandler.getUserInfo({
                userId: data.clientTwoId,
                socketId: true,
              }),
              queryHandler.createChat(data),
            ]);

            this.io.to(socket.id).emit(`add-message-response`, {
              ...chat.messages[0],
              chatId: chat._id,
            });

            this.io.to(toSocketId).emit(`add-chat-response`, chat);
          } catch (error) {
            console.log(error);
            this.io.to(socket.id).emit(`add-chat-response`, {
              error: true,
              message: "couldn't initiate chat",
            });
          }
        }
      });

      socket.on(`set-typing`, async (data) => {
        if (data.receiverId === "") {
          this.io.to(socket.id).emit(`add-message-response`, {
            error: true,
            message: "Receiver id is null",
          });
        } else {
          try {
            const [toSocketId] = await Promise.all([
              queryHandler.getUserInfo({
                userId: data.receiverId,
                socketId: true,
              }),
            ]);

            this.io.to(toSocketId).emit(`set-typing-response`, {
              userId: data.senderId,
              userAction: "typing",
            });
          } catch (error) {
            this.io.to(socket.id).emit(`set-typing-response`, {
              error: true,
              message: "couldn't broadcast typing state",
            });
          }
        }
      });

      socket.on("update-notification", async (data) => {
        if (data.id === "") {
          this.io.to(socket.id).emit("update-notification-response", {
            error: true,
            message: "Notification id is null",
          });
        } else {
          try {
            const [notification] = await Promise.all([
              queryHandler.updateNotification(data),
            ]);

            console.log(notification);
          } catch (error) {
            this.io.to(socket.id).emit(`update-message-response`, {
              error: true,
              message: "couldn't update notification state",
            });
          }
        }
      });

      socket.on("update-message", async (data) => {
        if (data.messageId === "") {
          this.io.to(socket.id).emit(`update-message-response`, {
            error: true,
            message: "Message id is null",
          });
        } else if (data.state === "") {
          this.io.to(socket.id).emit(`update-message-response`, {
            error: true,
            message: "Message state is null",
          });
        } else {
          try {
            const [toSocketId, message] = await Promise.all([
              queryHandler.getUserInfo({
                userId: data.senderId,
                socketId: true,
              }),
              queryHandler.updateMessages(data),
            ]);

            this.io.to(socket.id).emit(`update-message-response`, message);

            this.io.to(toSocketId).emit(`update-message-response`, message);
          } catch (error) {
            this.io.to(socket.id).emit(`update-message-response`, {
              error: true,
              message: "couldn't set message state",
            });
          }
        }
      });

      /**
       * Logout the user
       */
      socket.on("logout", async (data) => {
        try {
          const userId = data.userId;
          await queryHandler.logout(userId);
          this.io.to(socket.id).emit(`logout-response`, {
            error: false,
            message: CONSTANTS.USER_LOGGED_OUT,
            userId: userId,
          });

          socket.broadcast.emit(`chat-list-response`, {
            error: false,
            userDisconnected: true,
            userid: userId,
          });
        } catch (error) {
          this.io.to(socket.id).emit(`logout-response`, {
            error: true,
            message: CONSTANTS.SERVER_ERROR_MESSAGE,
            userId: userId,
          });
        }
      });

      /**
       * sending the disconnected user to all socket users.
       */
      socket.on("disconnect", async () => {
        socket.broadcast.emit(`chat-list-response`, {
          error: false,
          userDisconnected: true,
          userid: socket.request._query["userId"],
        });
      });
    });
  }

  socketConfig() {
    this.io.use(async (socket, next) => {
      try {
        await Business.updateOne(
          {
            _id: socket.request._query["userId"],
          },
          {
            online: "Y",
            socketId: socket.id,
          }
        );
        next();
      } catch (error) {
        // Error
        console.error(error);
      }
    });

    this.socketEvents();
  }
}
module.exports = Socket;
