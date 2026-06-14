import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getColor } from "@/lib/utils";
import { useAppStore } from "@/store";
import { HOST, LOGOUT_ROUTE } from "@/utils/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FiEdit2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { IoPowerSharp } from "react-icons/io5";
import { apiClient } from "@/lib/api-client";

const ProfileInfo = () => {
  const { userInfo, setUserInfo } = useAppStore();
  const navigate = useNavigate();

  const logOut = async () => {
    try {
      const response = await apiClient.post(
        LOGOUT_ROUTE,
        {},
        { withCredentials: true }
      );

      if (response.status === 200) {
        navigate("/auth");
        setUserInfo(null);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="absolute bottom-0 h-16 flex items-center justify-between px-6 w-full bg-[#111217] border-t border-[#2f303b] select-none z-10">
      <div className="flex gap-3 items-center justify-center min-w-0">
        <div className="w-10 h-10 relative flex-shrink-0">
          <Avatar className="h-10 w-10 rounded-full overflow-hidden border border-white/10">
            {userInfo.image ? (
              <AvatarImage
                src={`${HOST}/${userInfo.image}`}
                alt="profile"
                className="object-cover w-full h-full bg-black"
              />
            ) : (
              <AvatarFallback
                className={`uppercase h-full w-full text-base flex items-center justify-center rounded-full font-bold ${getColor(
                  userInfo.color
                )}`}
              >
                {userInfo.firstName
                  ? userInfo.firstName.substring(0, 1)
                  : userInfo.email.substring(0, 1)}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
        <div className="flex flex-col text-left truncate min-w-0">
          <span className="font-semibold text-xs md:text-sm text-white truncate">
            {userInfo.firstName && userInfo.lastName
              ? `${userInfo.firstName} ${userInfo.lastName}`
              : "User"}
          </span>
          <span className="text-[10px] text-neutral-400 truncate">
            {userInfo.email}
          </span>
        </div>
      </div>
      <div className="flex gap-4 flex-shrink-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="focus:outline-none">
              <FiEdit2
                className="text-purple-400 hover:text-purple-300 text-lg font-medium transition-colors duration-300 cursor-pointer"
                onClick={() => navigate("/profile")}
              />
            </TooltipTrigger>
            <TooltipContent className="bg-[#1c1b1e] border-none text-white text-xs">
              Edit Profile
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="focus:outline-none">
              <IoPowerSharp
                className="text-red-500 hover:text-red-400 text-lg font-medium transition-colors duration-300 cursor-pointer"
                onClick={logOut}
              />
            </TooltipTrigger>
            <TooltipContent className="bg-[#1c1b1e] border-none text-white text-xs">
              Logout
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default ProfileInfo;
