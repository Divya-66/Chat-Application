import ChatHeader from "./components/chat-header";
import MessageBar from "./components/message-bar";
import MessageContainer from "./components/message-container";
import { useAppStore } from "@/store";

const ChatContainer = () => {
  const { chatWallpaper } = useAppStore();

  const getWallpaperClass = () => {
    switch (chatWallpaper) {
      case "obsidian":
        return "bg-[#0b0c10]";
      case "nebula":
        return "bg-[#0c0a15] bg-gradient-to-br from-[#0c0a15] via-[#140e28] to-[#0b0614] overflow-hidden relative";
      case "grid":
        return "bg-[#14151b] bg-[linear-gradient(to_right,#21222d_1px,transparent_1px),linear-gradient(to_bottom,#21222d_1px,transparent_1px)] bg-[size:3rem_3rem]";
      default:
        return "bg-[#1c1d25]";
    }
  };

  return (
    <div className={`fixed top-0 left-0 h-[100vh] w-full flex flex-col md:static md:flex-1 transition-all duration-500 ${getWallpaperClass()}`}>
      {chatWallpaper === "nebula" && (
        <>
          <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-purple-700/10 blur-[100px] pointer-events-none z-0" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-indigo-900/10 blur-[100px] pointer-events-none z-0" />
        </>
      )}
      <ChatHeader />
      <MessageContainer />
      <MessageBar />
    </div>
  );
};

export default ChatContainer;
