import { useAppStore } from "@/store";
import { HOST } from "@/utils/constants";
import { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const socket = useRef();
  const { userInfo } = useAppStore();

  useEffect(() => {
    if (userInfo) {
      socket.current = io(HOST, {
        withCredentials: true,
        query: { userId: userInfo.id },
      });
      socket.current.on("connect", () => {
        console.log("Connected to socket server");
      });

      const handleReceiveMessage = (message) => {
        const { selectedChatData, selectedChatType, addMessage } =
          useAppStore.getState();

        if (
          selectedChatType !== undefined &&
          (selectedChatData._id === message.sender._id ||
            selectedChatData._id === message.recipient._id)
        ) {
          console.log("message rcv", message);
          addMessage(message);
        }
      };

      const handleReceiveChannelMessage = (message) => {
        const { selectedChatData, selectedChatType, addMessage } =
          useAppStore.getState();

        if (
          selectedChatType !== undefined &&
          selectedChatData._id === message.channelId
        ) {
          addMessage(message);
        }
      };

      const handleUpdateMessageReaction = (updatedMessage) => {
        const { selectedChatMessages, setSelectedChatMessages } =
          useAppStore.getState();
        const newMessages = selectedChatMessages.map((msg) =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        );
        setSelectedChatMessages(newMessages);
      };

      const handleUpdateOnlineUsers = (onlineUsers) => {
        const { setOnlineUsers } = useAppStore.getState();
        setOnlineUsers(onlineUsers);
      };

      const handleUserTypingStart = (typingData) => {
        const { setUserTypingStart } = useAppStore.getState();
        setUserTypingStart(typingData);
      };

      const handleUserTypingStop = (typingData) => {
        const { setUserTypingStop } = useAppStore.getState();
        setUserTypingStop(typingData);
      };

      socket.current.on("receiveMessage", handleReceiveMessage);
      socket.current.on("receive-channel-message", handleReceiveChannelMessage);
      socket.current.on("updateMessageReaction", handleUpdateMessageReaction);
      socket.current.on("update-online-users", handleUpdateOnlineUsers);
      socket.current.on("user-typing-start", handleUserTypingStart);
      socket.current.on("user-typing-stop", handleUserTypingStop);

      return () => {
        socket.current.off("receiveMessage", handleReceiveMessage);
        socket.current.off("receive-channel-message", handleReceiveChannelMessage);
        socket.current.off("updateMessageReaction", handleUpdateMessageReaction);
        socket.current.off("update-online-users", handleUpdateOnlineUsers);
        socket.current.off("user-typing-start", handleUserTypingStart);
        socket.current.off("user-typing-stop", handleUserTypingStop);
        socket.current.disconnect();
      };
    }
  }, [userInfo]);

  return (
    <SocketContext.Provider value={socket.current}>
      {children}
    </SocketContext.Provider>
  );
};
