import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import { GET_ALL_MESSAGES_ROUTE, GET_CHANNEL_MESSAGES_ROUTE, HOST } from "@/utils/constants";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { MdFolderZip } from "react-icons/md";
import { IoMdArrowRoundDown } from "react-icons/io";
import { IoCloseSharp } from "react-icons/io5";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getColor } from "@/lib/utils";
import { useSocket } from "@/context/SocketContext";
import { playWalkieTalkieBeep } from "@/utils/audio";

// Customized Walkie-Talkie voice player component
const VoiceMessagePlayer = ({ fileUrl }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [heights, setHeights] = useState([10, 16, 12, 20, 8, 14, 22, 16, 10, 18, 12, 14]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    // Dynamic wave animation interval when playing
    let animInterval = null;
    if (isPlaying) {
      animInterval = setInterval(() => {
        setHeights(
          [...Array(12)].map(() => Math.max(4, Math.floor(Math.random() * 22 + 4)))
        );
      }, 120);
    } else {
      setHeights([10, 16, 12, 20, 8, 14, 22, 16, 10, 18, 12, 14]);
    }

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      if (animInterval) clearInterval(animInterval);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
    }
  };

  const handleScrub = (value) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const formatAudioTime = (time) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="flex items-center gap-3.5 bg-[#1b1c24]/90 border border-white/5 rounded-xl p-3 shadow-md w-64 md:w-72 select-none">
      <audio ref={audioRef} src={`${HOST}/${fileUrl}`} preload="metadata" />
      
      {/* Action Button */}
      <button
        onClick={togglePlay}
        className="w-9 h-9 rounded-full bg-[#8338ec] hover:bg-[#741bda] flex items-center justify-center text-white transition-all duration-300 shadow-md flex-shrink-0 focus:outline-none"
      >
        {isPlaying ? (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Voice Soundwaves Visualizer */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        
        {/* Animated wave lines */}
        <div className="flex items-end gap-1 h-6 px-1">
          {heights.map((height, idx) => {
            const progress = duration ? (currentTime / duration) * 12 : 0;
            const isFilled = idx < progress;

            return (
              <span
                key={idx}
                style={{ height: `${height}px` }}
                className={`w-1 rounded-full transition-all duration-200 ${
                  isFilled ? "bg-[#8338ec]" : "bg-neutral-600/50"
                }`}
              />
            );
          })}
        </div>

        {/* Timelines scrubber */}
        <div className="flex items-center justify-between text-[9px] text-neutral-400 font-semibold leading-none">
          <span>{formatAudioTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => handleScrub(Number(e.target.value))}
            className="flex-1 mx-2 h-[2px] bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#8338ec] focus:outline-none"
          />
          <span>{formatAudioTime(duration)}</span>
        </div>

      </div>
    </div>
  );
};

const MessageContainer = () => {
  const scrollRef = useRef();
  const socket = useSocket();
  const {
    selectedChatType,
    selectedChatData,
    userInfo,
    selectedChatMessages,
    setSelectedChatMessages,
    setFileDownloadProgress,
    setIsDownloading,
    searchQuery,
    typingUsers,
  } = useAppStore();

  const prevLengthRef = useRef(selectedChatMessages.length);

  useEffect(() => {
    if (selectedChatMessages.length > prevLengthRef.current) {
      if (prevLengthRef.current > 0) {
        const lastMessage = selectedChatMessages[selectedChatMessages.length - 1];
        if (lastMessage) {
          const isSentByMe = selectedChatType === "channel"
            ? (lastMessage.sender?._id === userInfo.id || lastMessage.sender === userInfo.id)
            : (lastMessage.sender === userInfo.id || lastMessage.sender?._id === userInfo.id);

          if (!isSentByMe) {
            playWalkieTalkieBeep(false);
          }
        }
      }
    }
    prevLengthRef.current = selectedChatMessages.length;
  }, [selectedChatMessages, selectedChatType, userInfo.id]);

  const [showImage, setShowImage] = useState(false);
  const [imageURL, setImageURL] = useState(null);

  useEffect(() => {
    const getMessages = async () => {
      try {
        const response = await apiClient.post(
          GET_ALL_MESSAGES_ROUTE,
          { id: selectedChatData._id },
          { withCredentials: true }
        );
        if (response.data.messages) {
          setSelectedChatMessages(response.data.messages);
        }
      } catch (error) {
        console.log({ error });
      }
    };

    const getChannelMessages = async () => {
      try {
        const response = await apiClient.get(
          `${GET_CHANNEL_MESSAGES_ROUTE}/${selectedChatData._id}`,
          { withCredentials: true }
        );
        if (response.data.messages) {
          setSelectedChatMessages(response.data.messages);
        }
      } catch (error) {
        console.log({ error });
      }
    };

    if (selectedChatData._id) {
      if (selectedChatType === "contact") getMessages();
      if (selectedChatType === "channel") getChannelMessages();
    }
  }, [selectedChatData, selectedChatType, setSelectedChatMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [selectedChatMessages, typingUsers]);

  const checkIfImage = (filePath) => {
    const imageRegex =
      /\.(jpg|jpeg|png|gif|bmp|tiff|tif|webp|svg|ico|heic|heif)$/i;
    return imageRegex.test(filePath);
  };

  const checkIfAudio = (filePath) => {
    const audioRegex = /\.(webm|wav|mp3|m4a|ogg|aac)$/i;
    return audioRegex.test(filePath);
  };

  const downloadFile = async (url) => {
    setIsDownloading(true);
    setFileDownloadProgress(0);
    const response = await apiClient.get(`${HOST}/${url}`, {
      responseType: "blob",
      onUploadProgress: (progressEvent) => {
        const { loaded, total } = progressEvent;
        const percentCompleted = Math.round((loaded * 100) / total);
        setFileDownloadProgress(percentCompleted);
      },
    });
    const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = urlBlob;
    link.setAttribute("download", url.split("/").pop());
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(urlBlob);
    setIsDownloading(false);
    setFileDownloadProgress(0);
  };

  const handleAddReaction = (messageId, emoji) => {
    if (socket) {
      socket.emit("add-reaction", {
        messageId,
        emoji,
        userId: userInfo.id || userInfo._id,
        channelId: selectedChatType === "channel" ? selectedChatData._id : undefined,
      });
    }
  };

  const reactionEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  const renderReactionMenu = (message) => {
    return (
      <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 absolute top-[-30px] flex items-center gap-1.5 bg-[#1b1c24] border border-[#2f303b] shadow-2xl rounded-full px-2.5 py-1 z-30 scale-90 group-hover:scale-100">
        {reactionEmojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleAddReaction(message._id, emoji)}
            className="hover:scale-125 transition-transform duration-200 text-sm md:text-base cursor-pointer focus:outline-none"
          >
            {emoji}
          </button>
        ))}
      </div>
    );
  };

  const renderMessageReactions = (message) => {
    if (!message.reactions || message.reactions.length === 0) return null;

    const groups = message.reactions.reduce((acc, current) => {
      acc[current.emoji] = acc[current.emoji] || [];
      acc[current.emoji].push(current.userId);
      return acc;
    }, {});

    const currentUserId = userInfo.id || userInfo._id;

    return (
      <div className="flex flex-wrap gap-1 mt-1.5 select-none">
        {Object.entries(groups).map(([emoji, userIds]) => {
          const hasReacted = userIds.includes(currentUserId);
          return (
            <button
              key={emoji}
              onClick={() => handleAddReaction(message._id, emoji)}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] md:text-xs border transition-all duration-300 ${
                hasReacted
                  ? "bg-[#8338ec]/20 border-[#8338ec] text-[#a16ee8]"
                  : "bg-[#2a2b33]/40 border-white/5 text-neutral-400 hover:border-white/10 hover:text-white"
              }`}
              title={`${userIds.length} reaction(s)`}
            >
              <span>{emoji}</span>
              <span className="font-bold">{userIds.length}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderDMMessages = (message) => {
    const isReceived = message.sender === selectedChatData._id;
    return (
      <div className={`my-3 flex flex-col ${isReceived ? "items-start" : "items-end"}`}>
        <div className="group relative flex items-center gap-2 max-w-[70%]">
          
          {/* Reaction picker on hover */}
          {!isReceived && renderReactionMenu(message)}
          
          {message.messageType === "text" && (
            <div
              className={`p-4 rounded-2xl border text-sm transition-all duration-300 ${
                isReceived
                  ? "bg-[#2a2b33]/40 text-white border-white/5 rounded-tl-none shadow-sm"
                  : "bg-gradient-to-br from-[#8338ec]/20 to-[#975aed]/10 text-purple-100 border-[#8338ec]/35 rounded-tr-none shadow-md"
              } break-words text-left`}
            >
              {message.content}
            </div>
          )}

          {message.messageType === "file" && (
            <div
              className={`p-4 rounded-2xl border text-sm transition-all duration-300 ${
                isReceived
                  ? "bg-[#2a2b33]/40 text-white border-white/5 rounded-tl-none shadow-sm"
                  : "bg-gradient-to-br from-[#8338ec]/20 to-[#975aed]/10 text-purple-100 border-[#8338ec]/35 rounded-tr-none shadow-md"
              } break-words text-left`}
            >
              {checkIfImage(message.fileUrl) ? (
                <div
                  className="cursor-pointer overflow-hidden rounded-lg hover:opacity-95 transition-opacity duration-300"
                  onClick={() => {
                    setShowImage(true);
                    setImageURL(message.fileUrl);
                  }}
                >
                  <img
                    src={`${HOST}/${message.fileUrl}`}
                    className="max-h-[250px] max-w-full object-contain rounded-lg"
                  />
                </div>
              ) : checkIfAudio(message.fileUrl) ? (
                <VoiceMessagePlayer fileUrl={message.fileUrl} />
              ) : (
                <div className="flex items-center justify-center gap-4">
                  <span className="text-white/85 text-3xl bg-black/20 rounded-full p-3">
                    <MdFolderZip />
                  </span>
                  <span className="truncate max-w-[150px] font-medium">{message.fileUrl.split("/").pop()}</span>
                  <button
                    className="bg-black/20 p-2.5 text-xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300 text-white"
                    onClick={() => downloadFile(message.fileUrl)}
                  >
                    <IoMdArrowRoundDown />
                  </button>
                </div>
              )}
            </div>
          )}

          {isReceived && renderReactionMenu(message)}

        </div>

        {/* Reaction badges & timestamp */}
        <div className={`flex flex-col gap-0.5 mt-1 ${isReceived ? "items-start" : "items-end"}`}>
          {renderMessageReactions(message)}
          <div className="text-[10px] text-gray-500 mt-1 px-1 select-none font-medium">
            {moment(message.timestamp).format("LT")}
          </div>
        </div>

      </div>
    );
  };

  const renderChannelMessages = (message) => {
    const isSentByMe = message.sender?._id === userInfo.id;
    return (
      <div className={`my-4 flex flex-col ${isSentByMe ? "items-end" : "items-start"}`}>
        
        {/* Sender Header for Received messages */}
        {!isSentByMe && message.sender && (
          <div className="flex items-center gap-2 mb-1.5 pl-1.5">
            <Avatar className="h-6 w-6 rounded-full overflow-hidden border border-white/10">
              {message.sender.image ? (
                <AvatarImage
                  src={`${HOST}/${message.sender.image}`}
                  alt="profile"
                  className="object-cover w-full h-full bg-black"
                />
              ) : (
                <AvatarFallback
                  className={`uppercase h-full w-full text-[9px] flex items-center justify-center rounded-full font-bold select-none ${getColor(
                    message.sender.color
                  )}`}
                >
                  {message.sender.firstName
                    ? message.sender.firstName.substring(0, 1)
                    : message.sender.email.substring(0, 1)}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="text-xs font-semibold text-neutral-400 select-none">
              {`${message.sender.firstName || ""} ${message.sender.lastName || ""}`.trim() || message.sender.email}
            </span>
          </div>
        )}

        <div className="group relative flex items-center gap-2 max-w-[70%]">
          
          {/* Reaction menu hover */}
          {isSentByMe && renderReactionMenu(message)}

          {message.messageType === "text" && (
            <div
              className={`p-4 rounded-2xl border text-sm transition-all duration-300 ${
                !isSentByMe
                  ? "bg-[#2a2b33]/40 text-white border-white/5 rounded-tl-none shadow-sm animate-fade-in"
                  : "bg-gradient-to-br from-[#8338ec]/20 to-[#975aed]/10 text-purple-100 border-[#8338ec]/35 rounded-tr-none shadow-md"
              } break-words text-left`}
            >
              {message.content}
            </div>
          )}

          {message.messageType === "file" && (
            <div
              className={`p-4 rounded-2xl border text-sm transition-all duration-300 ${
                !isSentByMe
                  ? "bg-[#2a2b33]/40 text-white border-white/5 rounded-tl-none shadow-sm"
                  : "bg-gradient-to-br from-[#8338ec]/20 to-[#975aed]/10 text-purple-100 border-[#8338ec]/35 rounded-tr-none shadow-md"
              } break-words text-left`}
            >
              {checkIfImage(message.fileUrl) ? (
                <div
                  className="cursor-pointer overflow-hidden rounded-lg hover:opacity-95 transition-opacity duration-300"
                  onClick={() => {
                    setShowImage(true);
                    setImageURL(message.fileUrl);
                  }}
                >
                  <img
                    src={`${HOST}/${message.fileUrl}`}
                    className="max-h-[250px] max-w-full object-contain rounded-lg"
                  />
                </div>
              ) : checkIfAudio(message.fileUrl) ? (
                <VoiceMessagePlayer fileUrl={message.fileUrl} />
              ) : (
                <div className="flex items-center justify-center gap-4">
                  <span className="text-white/85 text-3xl bg-black/20 rounded-full p-3">
                    <MdFolderZip />
                  </span>
                  <span className="truncate max-w-[150px] font-medium">{message.fileUrl.split("/").pop()}</span>
                  <button
                    className="bg-black/20 p-2.5 text-xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300 text-white"
                    onClick={() => downloadFile(message.fileUrl)}
                  >
                    <IoMdArrowRoundDown />
                  </button>
                </div>
              )}
            </div>
          )}

          {!isSentByMe && renderReactionMenu(message)}

        </div>

        {/* Reaction badges & timestamp */}
        <div className={`flex flex-col gap-0.5 mt-1 ${isSentByMe ? "items-end" : "items-start"}`}>
          {renderMessageReactions(message)}
          <div className="text-[10px] text-gray-500 mt-1 px-1 select-none font-medium">
            {moment(message.timestamp).format("LT")}
          </div>
        </div>

      </div>
    );
  };

  const renderMessages = () => {
    let lastDate = null;
    
    const filteredMessages = selectedChatMessages.filter((message) => {
      if (!searchQuery) return true;
      if (message.messageType === "text" && message.content) {
        return message.content.toLowerCase().includes(searchQuery.toLowerCase());
      }
      if (message.messageType === "file" && message.fileUrl) {
        return message.fileUrl.split("/").pop().toLowerCase().includes(searchQuery.toLowerCase());
      }
      return false;
    });

    return filteredMessages.map((message, index) => {
      const messageDate = moment(message.timestamp).format("YYYY-MM-DD");
      const showDate = messageDate !== lastDate;
      lastDate = messageDate;
      return (
        <div key={index}>
          {showDate && (
            <div className="text-center text-neutral-500 font-semibold text-xs md:text-sm my-4 select-none uppercase tracking-wider">
              {moment(message.timestamp).format("LL")}
            </div>
          )}
          {selectedChatType === "contact" && renderDMMessages(message)}
          {selectedChatType === "channel" && renderChannelMessages(message)}
        </div>
      );
    });
  };

  const renderTypingIndicator = () => {
    let isTyping = false;
    let typingText = "";

    if (selectedChatType === "contact") {
      const contactIsTyping = typingUsers.some(
        (t) => t.chatType === "contact" && t.userId === selectedChatData._id
      );
      if (contactIsTyping) {
        isTyping = true;
        typingText = `${selectedChatData.firstName || selectedChatData.email} is transmitting`;
      }
    } else if (selectedChatType === "channel") {
      const channelTyping = typingUsers.filter(
        (t) => t.chatType === "channel" && t.chatId === selectedChatData._id
      );
      if (channelTyping.length > 0) {
        isTyping = true;
        if (channelTyping.length === 1) {
          typingText = "Someone is transmitting";
        } else {
          typingText = `${channelTyping.length} users are transmitting`;
        }
      }
    }

    if (!isTyping) return null;

    return (
      <div className="flex items-center gap-2.5 my-3 pl-1.5">
        <div className="flex items-center gap-1.5 bg-[#2a2b33]/40 border border-white/5 rounded-2xl rounded-tl-none p-3.5 shadow-sm animate-pulse">
          <div className="flex gap-1 items-center justify-center h-3 w-8">
            <span className="w-1.5 h-1.5 bg-[#8338ec] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1.5 h-1.5 bg-[#8338ec] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1.5 h-1.5 bg-[#8338ec] rounded-full animate-bounce"></span>
          </div>
          <span className="text-[11px] font-semibold text-neutral-400 select-none ml-1 uppercase tracking-wider">
            {typingText}...
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hidden p-4 px-8 md:w-[65vw] lg:w-[70vw] xl:w-[80vw] w-full z-10">
      {selectedChatMessages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-center text-neutral-500 select-none font-medium">
          No messages yet. Say hello!
        </div>
      ) : (
        renderMessages()
      )}
      {renderTypingIndicator()}
      <div ref={scrollRef} />
      
      {showImage && (
        <div className="fixed z-[1000] top-0 left-0 h-[100vh] w-[100vw] flex items-center justify-center backdrop-blur-xl bg-black/60 transition-all duration-300">
          <div className="relative max-w-[90vw] max-h-[85vh]">
            <img
              src={`${HOST}/${imageURL}`}
              className="max-h-[80vh] rounded-2xl shadow-2xl object-contain bg-black"
            />
          </div>
          <div className="flex gap-4 fixed top-6 z-50">
            <button
              className="bg-[#2a2b33]/60 p-3 text-xl text-white rounded-full hover:bg-black/80 transition-all duration-300 shadow-lg"
              onClick={() => downloadFile(imageURL)}
            >
              <IoMdArrowRoundDown />
            </button>
            <button
              className="bg-[#2a2b33]/60 p-3 text-xl text-white rounded-full hover:bg-black/80 transition-all duration-300 shadow-lg"
              onClick={() => {
                setShowImage(false);
                setImageURL(null);
              }}
            >
              <IoCloseSharp />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageContainer;
