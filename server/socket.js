import { Server as SocketIOServer } from "socket.io";
import Message from "./models/MessagesModel.js";
import Channel from "./models/ChannelModel.js";
const setupSocket = (server) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  const userSocketMap = new Map();

  const disconnect = (socket) => {
    console.log(`Client Disconnected: ${socket.id}`);
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        break;
      }
    }
    io.emit("update-online-users", Array.from(userSocketMap.keys()));
  };

  const sendMessage = async (message) => {
    const senderSocketId = userSocketMap.get(message.sender);
    const recipientSocketId = userSocketMap.get(message.recipient);

    const createdMessage = await Message.create(message);

    const messageData = await Message.findById(createdMessage._id)
      .populate("sender", "id email firstName lastName image color")
      .populate("recipient", "id email firstName lastName image color");

    if (recipientSocketId) {
      io.to(recipientSocketId).emit("receiveMessage", messageData);
    }
    if (senderSocketId) {
      io.to(senderSocketId).emit("receiveMessage", messageData);
    }
  };

  const sendChannelMessage = async (message) => {
    const { channelId, sender, content, messageType, fileUrl } = message;
    const createdMessage = await Message.create({
      sender,
      recipient: null,
      content,
      messageType,
      timestamp: new Date(),
      fileUrl,
    });

    const messageData = await Message.findById(createdMessage._id)
      .populate("sender", "id email firstName lastName image color")
      .exec();

    await Channel.findByIdAndUpdate(channelId, {
      $push: { messages: createdMessage._id },
    });
    const channel = await Channel.findById(channelId).populate("members");

    const finalData = { ...messageData._doc, channelId: channel._id };

    if (channel && channel.members) {
      channel.members.forEach((member) => {
        const memberSocketId = userSocketMap.get(member._id.toString());
        if (memberSocketId) {
          io.to(memberSocketId).emit("receive-channel-message", finalData);
        }
      });
      const adminSocketId = userSocketMap.get(channel.admin._id.toString());
      if (adminSocketId) {
        io.to(adminSocketId).emit("receive-channel-message", finalData);
      }
    }
  };

  const addReaction = async ({ messageId, emoji, userId, channelId }) => {
    try {
      const message = await Message.findById(messageId);
      if (message) {
        if (!message.reactions) {
          message.reactions = [];
        }
        const existingIndex = message.reactions.findIndex(
          (r) => r.userId.toString() === userId && r.emoji === emoji
        );
        if (existingIndex > -1) {
          message.reactions.splice(existingIndex, 1);
        } else {
          message.reactions.push({ userId, emoji });
        }
        await message.save();

        const updatedMessage = await Message.findById(messageId)
          .populate("sender", "id email firstName lastName image color")
          .populate("recipient", "id email firstName lastName image color");

        if (channelId) {
          const channel = await Channel.findById(channelId).populate("members");
          if (channel && channel.members) {
            const finalData = { ...updatedMessage._doc, channelId };
            channel.members.forEach((member) => {
              const memberSocketId = userSocketMap.get(member._id.toString());
              if (memberSocketId) {
                io.to(memberSocketId).emit("updateMessageReaction", finalData);
              }
            });
            const adminSocketId = userSocketMap.get(channel.admin._id.toString());
            if (adminSocketId) {
              io.to(adminSocketId).emit("updateMessageReaction", finalData);
            }
          }
        } else {
          const senderIdStr = updatedMessage.sender._id.toString();
          const recipientIdStr = updatedMessage.recipient._id.toString();
          const senderSocketId = userSocketMap.get(senderIdStr);
          const recipientSocketId = userSocketMap.get(recipientIdStr);

          if (senderSocketId) {
            io.to(senderSocketId).emit("updateMessageReaction", updatedMessage);
          }
          if (recipientSocketId) {
            io.to(recipientSocketId).emit("updateMessageReaction", updatedMessage);
          }
        }
      }
    } catch (error) {
      console.error("Error adding reaction: ", error);
    }
  };

  const handleTypingStart = ({ userId, chatType, chatId }) => {
    if (chatType === "contact") {
      const recipientSocketId = userSocketMap.get(chatId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("user-typing-start", { userId, chatType, chatId: userId });
      }
    } else if (chatType === "channel") {
      Channel.findById(chatId).populate("members").then((channel) => {
        if (channel && channel.members) {
          channel.members.forEach((member) => {
            if (member._id.toString() !== userId) {
              const memberSocketId = userSocketMap.get(member._id.toString());
              if (memberSocketId) {
                io.to(memberSocketId).emit("user-typing-start", { userId, chatType, chatId });
              }
            }
          });
          const adminSocketId = userSocketMap.get(channel.admin._id.toString());
          if (adminSocketId && channel.admin._id.toString() !== userId) {
            io.to(adminSocketId).emit("user-typing-start", { userId, chatType, chatId });
          }
        }
      });
    }
  };

  const handleTypingStop = ({ userId, chatType, chatId }) => {
    if (chatType === "contact") {
      const recipientSocketId = userSocketMap.get(chatId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("user-typing-stop", { userId, chatType, chatId: userId });
      }
    } else if (chatType === "channel") {
      Channel.findById(chatId).populate("members").then((channel) => {
        if (channel && channel.members) {
          channel.members.forEach((member) => {
            if (member._id.toString() !== userId) {
              const memberSocketId = userSocketMap.get(member._id.toString());
              if (memberSocketId) {
                io.to(memberSocketId).emit("user-typing-stop", { userId, chatType, chatId });
              }
            }
          });
          const adminSocketId = userSocketMap.get(channel.admin._id.toString());
          if (adminSocketId && channel.admin._id.toString() !== userId) {
            io.to(adminSocketId).emit("user-typing-stop", { userId, chatType, chatId });
          }
        }
      });
    }
  };

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
      userSocketMap.set(userId, socket.id);
      console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
      io.emit("update-online-users", Array.from(userSocketMap.keys()));
    } else {
      console.log("User ID not provided during connection.");
    }

    socket.on("sendMessage", sendMessage);
    socket.on("send-channel-message", sendChannelMessage);
    socket.on("add-reaction", addReaction);
    socket.on("typing-start", handleTypingStart);
    socket.on("typing-stop", handleTypingStop);
    socket.on("disconnect", () => disconnect(socket));
  });
};

export default setupSocket;
