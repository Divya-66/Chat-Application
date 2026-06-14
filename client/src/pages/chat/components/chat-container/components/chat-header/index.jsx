import { RiCloseFill } from "react-icons/ri";
import { FiSearch, FiX, FiCheck, FiImage } from "react-icons/fi";
import { IoArrowBack } from "react-icons/io5";
import { useAppStore } from "@/store";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { HOST } from "@/utils/constants";
import { getColor } from "@/lib/utils";
import { useState } from "react";

const ChatHeader = () => {
  const { 
    closeChat, 
    selectedChatData, 
    selectedChatType, 
    searchQuery, 
    setSearchQuery,
    chatWallpaper,
    setChatWallpaper,
    onlineUsers,
  } = useAppStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const [wallpaperOpen, setWallpaperOpen] = useState(false);

  const wallpapers = [
    { id: "default", name: "Classic Dark" },
    { id: "obsidian", name: "Deep Obsidian" },
    { id: "nebula", name: "Purple Glow" },
    { id: "grid", name: "Cyber Grid" },
  ];

  const isOnline = selectedChatType === "contact" && onlineUsers.includes(selectedChatData._id);

  return (
    <div className="h-[10vh] border-b-2 border-[#2f303b] flex items-center justify-between px-8 md:px-12 bg-[#1c1d25]/60 backdrop-blur-md relative z-20">
      <div className="flex gap-5 items-center w-full justify-between">
        
        {/* User / Group Info */}
        <div className="flex gap-3 items-center justify-center">
          <div className="w-10 h-10 md:w-12 md:h-12 relative flex-shrink-0">
            {selectedChatType === "contact" ? (
              <Avatar className="h-10 w-10 md:h-12 md:w-12 rounded-full overflow-hidden">
                {selectedChatData.image ? (
                  <AvatarImage
                    src={`${HOST}/${selectedChatData.image}`}
                    alt="profile"
                    className="object-cover w-full h-full bg-black"
                  />
                ) : (
                  <div
                    className={`uppercase h-full w-full text-base md:text-lg border-[1px] flex items-center justify-center rounded-full font-bold select-none ${getColor(
                      selectedChatData.color
                    )}`}
                  >
                    {selectedChatData.firstName
                      ? selectedChatData.firstName.substring(0, 1)
                      : selectedChatData.email.substring(0, 1)}
                  </div>
                )}
              </Avatar>
            ) : (
              <div className="bg-[#ffffff10] h-10 w-10 md:h-12 md:w-12 flex items-center justify-center rounded-full text-white font-bold border border-white/10">
                #
              </div>
            )}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-white font-semibold text-sm md:text-base poppins-medium tracking-wide">
              {selectedChatType === "channel" && selectedChatData.name}
              {selectedChatType === "contact" && (selectedChatData.firstName
                ? `${selectedChatData.firstName} ${selectedChatData.lastName}`
                : selectedChatData.email)}
            </span>
            <span className="text-[10px] md:text-xs text-neutral-400 flex items-center gap-1.5 select-none mt-0.5">
              {selectedChatType === "channel" ? (
                "Channel Room"
              ) : (
                <>
                  <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-neutral-500"}`} />
                  {isOnline ? "Online" : "Offline"}
                </>
              )}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4 md:gap-6">
          
          {/* Real-time search toggle */}
          <div className="flex items-center gap-2">
            {searchOpen && (
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-32 md:w-48 p-2 bg-[#2a2b33] text-white text-xs rounded-lg border border-[#3e4152] focus:border-[#8338ec] outline-none transition-all duration-300 placeholder-neutral-500"
                autoFocus
              />
            )}
            <button
              onClick={() => {
                if (searchOpen) setSearchQuery("");
                setSearchOpen(!searchOpen);
              }}
              className={`p-2 rounded-full transition-all duration-300 ${
                searchOpen ? "text-[#ff006e] bg-[#712c4a30]" : "text-neutral-400 hover:text-white hover:bg-[#2a2b33]"
              }`}
            >
              {searchOpen ? <FiX className="text-xl" /> : <FiSearch className="text-xl" />}
            </button>
          </div>

          {/* Wallpaper picker */}
          <div className="relative">
            <button
              onClick={() => setWallpaperOpen(!wallpaperOpen)}
              className={`p-2 rounded-full transition-all duration-300 text-neutral-400 hover:text-white hover:bg-[#2a2b33] ${
                wallpaperOpen ? "bg-[#2a2b33] text-white" : ""
              }`}
              title="Change wallpaper"
            >
              <FiImage className="text-xl" />
            </button>
            
            {wallpaperOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#1b1c24] border border-[#2f303b] shadow-2xl rounded-xl p-3 flex flex-col gap-2 z-50">
                <span className="text-xs font-semibold text-neutral-400 tracking-wider uppercase mb-1">
                  Chat Wallpaper
                </span>
                {wallpapers.map((wall) => (
                  <button
                    key={wall.id}
                    onClick={() => {
                      setChatWallpaper(wall.id);
                      setWallpaperOpen(false);
                    }}
                    className={`flex items-center justify-between p-2 rounded-lg text-left text-xs font-medium transition-all duration-300 ${
                      chatWallpaper === wall.id 
                        ? "bg-[#8338ec]/20 text-[#a16ee8]" 
                        : "text-neutral-300 hover:bg-[#2a2b33]"
                    }`}
                  >
                    <span>{wall.name}</span>
                    {chatWallpaper === wall.id && <FiCheck className="text-sm" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Close active chat (Back button on mobile) */}
          <button
            className="text-neutral-400 hover:text-red-500 p-2 hover:bg-[#2a2b33] rounded-full duration-300 transition-all focus:outline-none flex items-center justify-center"
            onClick={closeChat}
            title="Go back"
          >
            <span className="md:hidden">
              <IoArrowBack className="text-xl" />
            </span>
            <span className="hidden md:block">
              <RiCloseFill className="text-2xl" />
            </span>
          </button>

        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
