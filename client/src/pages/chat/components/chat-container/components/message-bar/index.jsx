import { useEffect, useRef, useState } from "react";
import { GrAttachment } from "react-icons/gr";
import { RiEmojiStickerLine } from "react-icons/ri";
import { IoSend } from "react-icons/io5";
import { FiMic, FiSquare } from "react-icons/fi";
import EmojiPicker from "emoji-picker-react";
import { useAppStore } from "@/store";
import { useSocket } from "@/context/SocketContext";
import { apiClient } from "@/lib/api-client";
import { UPLOAD_FILE_ROUTE } from "@/utils/constants";
import { toast } from "sonner";
import { playWalkieTalkieStatic, playWalkieTalkieBeep } from "@/utils/audio";

const MessageBar = () => {
  const emojiRef = useRef();
  const fileInputRef = useRef();
  const socket = useSocket();
  const {
    selectedChatType,
    selectedChatData,
    userInfo,
    setIsUploading,
    setFileUploadProgress,
  } = useAppStore();

  const [message, setMessage] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Typing state refs/effects
  const typingTimeoutRef = useRef(null);
  const isCurrentlyTypingRef = useRef(false);

  useEffect(() => {
    if (!message.trim() || !socket || !selectedChatData) {
      if (isCurrentlyTypingRef.current && socket) {
        socket.emit("typing-stop", {
          userId: userInfo.id || userInfo._id,
          chatType: selectedChatType,
          chatId: selectedChatData._id,
        });
        isCurrentlyTypingRef.current = false;
      }
      return;
    }

    if (!isCurrentlyTypingRef.current && socket) {
      isCurrentlyTypingRef.current = true;
      socket.emit("typing-start", {
        userId: userInfo.id || userInfo._id,
        chatType: selectedChatType,
        chatId: selectedChatData._id,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isCurrentlyTypingRef.current && socket && selectedChatData) {
        socket.emit("typing-stop", {
          userId: userInfo.id || userInfo._id,
          chatType: selectedChatType,
          chatId: selectedChatData._id,
        });
        isCurrentlyTypingRef.current = false;
      }
    }, 2000);
  }, [message, selectedChatData, selectedChatType, socket, userInfo]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isCurrentlyTypingRef.current && socket && selectedChatData) {
        socket.emit("typing-stop", {
          userId: userInfo.id || userInfo._id,
          chatType: selectedChatType,
          chatId: selectedChatData._id,
        });
      }
      isCurrentlyTypingRef.current = false;
    };
  }, [selectedChatData?._id]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setEmojiPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  });

  const handleAddEmoji = (emoji) => {
    setMessage((msg) => msg + emoji.emoji);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    if (selectedChatType === "contact") {
      socket.emit("sendMessage", {
        sender: userInfo.id,
        content: message,
        recipient: selectedChatData._id,
        messageType: "text",
        fileUrl: undefined,
      });
    } else if (selectedChatType === "channel") {
      socket.emit("send-channel-message", {
        sender: userInfo.id,
        content: message,
        messageType: "text",
        fileUrl: undefined,
        channelId: selectedChatData._id,
      });
    }
    
    // Play send beep
    playWalkieTalkieBeep(true);

    // Stop typing indicator immediately
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isCurrentlyTypingRef.current && socket && selectedChatData) {
      socket.emit("typing-stop", {
        userId: userInfo.id || userInfo._id,
        chatType: selectedChatType,
        chatId: selectedChatData._id,
      });
    }
    isCurrentlyTypingRef.current = false;

    setMessage("");
  };

  const handleAttachmentClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAttachmentChange = async (event) => {
    try {
      const file = event.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        setIsUploading(true);
        const response = await apiClient.post(UPLOAD_FILE_ROUTE, formData, {
          withCredentials: true,
          onUploadProgress: (data) => {
            setFileUploadProgress(Math.round((100 * data.loaded) / data.total));
          },
        });

        if (response.status === 200 && response.data) {
          setIsUploading(false);
          if (selectedChatType === "contact") {
            socket.emit("sendMessage", {
              sender: userInfo.id,
              content: undefined,
              recipient: selectedChatData._id,
              messageType: "file",
              fileUrl: response.data.filePath,
            });
          } else if (selectedChatType === "channel") {
            socket.emit("send-channel-message", {
              sender: userInfo.id,
              content: undefined,
              messageType: "file",
              fileUrl: response.data.filePath,
              channelId: selectedChatData._id,
            });
          }
        }
      }
    } catch (error) {
      setIsUploading(false);
      console.log({ error });
    }
  };

  // Voice Recording Functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([audioBlob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
        await uploadVoiceMessage(file);
        stream.getTracks().forEach((track) => track.stop());
      };

      // Play static squelch noise on transmitter activation
      playWalkieTalkieStatic(0.4);

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Microphone access error:", error);
      toast.error("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
      setIsRecording(false);
      clearInterval(timerRef.current);
      audioChunksRef.current = [];
      toast.info("Recording cancelled.");
    }
  };

  const uploadVoiceMessage = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      setIsUploading(true);
      setFileUploadProgress(0);

      const response = await apiClient.post(UPLOAD_FILE_ROUTE, formData, {
        withCredentials: true,
        onUploadProgress: (data) => {
          setFileUploadProgress(Math.round((100 * data.loaded) / data.total));
        },
      });

      if (response.status === 200 && response.data) {
        setIsUploading(false);
        const socketData = {
          sender: userInfo.id || userInfo._id,
          content: undefined,
          messageType: "file",
          fileUrl: response.data.filePath,
        };

        if (selectedChatType === "contact") {
          socket.emit("sendMessage", {
            ...socketData,
            recipient: selectedChatData._id,
          });
        } else if (selectedChatType === "channel") {
          socket.emit("send-channel-message", {
            ...socketData,
            channelId: selectedChatData._id,
          });
        }
        
        // Play walkie talkie beep on voice message transmission complete
        playWalkieTalkieBeep(true);
      }
    } catch (error) {
      setIsUploading(false);
      console.error("Audio recording upload failed:", error);
      toast.error("Failed to upload voice message.");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="h-[10vh] bg-[#1c1d25]/60 flex justify-center items-center px-4 md:px-8 mb-4 md:mb-6 gap-4 md:gap-6 z-10">
      <div className="flex-1 flex bg-[#2a2b33] rounded-md items-center gap-5 pr-5">
        
        {isRecording ? (
          <div className="flex-1 flex items-center justify-between p-4 text-white">
            <div className="flex items-center gap-3 select-none">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs text-neutral-400 uppercase tracking-widest font-bold">Recording Voice</span>
              <span className="text-sm font-bold text-neutral-200 ml-2">{formatTime(recordingTime)}</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={cancelRecording}
                className="text-red-500 hover:text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={stopRecording}
                className="bg-[#22c55e] hover:bg-[#16a34a] text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-300 shadow-md focus:outline-none"
              >
                <FiSquare className="text-xs" /> Send
              </button>
            </div>
          </div>
        ) : (
          <>
            <input
              type="text"
              className="flex-1 p-5 bg-transparent rounded-md focus:border-none focus:outline-none text-white text-sm"
              placeholder="Enter Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
            />
            <button
              className="text-neutral-500 focus:outline-none focus:text-white hover:text-white duration-300 transition-all"
              onClick={handleAttachmentClick}
            >
              <GrAttachment className="text-xl" />
            </button>
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleAttachmentChange}
            />
            
            {/* Voice Message Recording Button */}
            <button
              className="text-neutral-500 hover:text-[#8338ec] focus:outline-none duration-300 transition-all"
              onClick={startRecording}
              title="Record Voice Message"
            >
              <FiMic className="text-xl" />
            </button>

            <div className="relative">
              <button
                className="text-neutral-500 focus:outline-none focus:text-white hover:text-white duration-300 transition-all"
                onClick={() => setEmojiPickerOpen(true)}
              >
                <RiEmojiStickerLine className="text-xl" />
              </button>
              <div className="absolute bottom-16 right-0" ref={emojiRef}>
                <EmojiPicker
                  theme="dark"
                  open={emojiPickerOpen}
                  onEmojiClick={handleAddEmoji}
                  autoFocusSearch={false}
                />
              </div>
            </div>
          </>
        )}
      </div>
      
      {!isRecording && (
        <button
          className="bg-[#8417ff] rounded-md flex items-center justify-center p-5 focus:border-none hover:bg-[#741bda] focus:bg-[#741bda] focus:outline-none focus:text-white duration-300 transition-all"
          onClick={handleSendMessage}
        >
          <IoSend className="text-xl text-white" />
        </button>
      )}
    </div>
  );
};

export default MessageBar;
