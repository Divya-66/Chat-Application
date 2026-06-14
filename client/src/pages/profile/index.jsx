import { useAppStore } from "@/store";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { colors, getColor } from "@/lib/utils";
import { FaPlus, FaTrash } from "react-icons/fa";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import {
  ADD_PROFILE_IMAGE_ROUTE,
  UPDATE_PROFILE_ROUTE,
  HOST,
  REMOVE_PROFILE_IMAGE_ROUTE,
} from "@/utils/constants";

const Profile = () => {
  const navigate = useNavigate();
  const { userInfo, setUserInfo } = useAppStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [image, setImage] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userInfo) {
      setFirstName(userInfo.firstName || "");
      setLastName(userInfo.lastName || "");
      setSelectedColor(userInfo.color !== undefined ? userInfo.color : 0);
    }
    if (userInfo?.image) {
      setImage(`${HOST}/${userInfo.image}`);
    } else {
      setImage(null);
    }
  }, [userInfo]);

  const validateProfile = () => {
    if (!firstName.trim()) {
      toast.error("First name is required.");
      return false;
    }
    if (!lastName.trim()) {
      toast.error("Last name is required.");
      return false;
    }
    return true;
  };

  const saveChanges = async () => {
    if (validateProfile()) {
      try {
        const response = await apiClient.post(
          UPDATE_PROFILE_ROUTE,
          { firstName, lastName, color: selectedColor },
          { withCredentials: true }
        );
        if (response.status === 200 && response.data) {
          setUserInfo({ ...response.data });
          toast.success("Profile updated successfully.");
          navigate("/chat");
        }
      } catch (error) {
        console.log(error);
        toast.error("Failed to update profile.");
      }
    }
  };

  const handleNavigate = () => {
    if (userInfo?.profileSetup) {
      navigate("/chat");
    } else {
      toast.error("Please setup profile first.");
    }
  };

  const handleFileInputClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append("profile-image", file);
        const response = await apiClient.post(ADD_PROFILE_IMAGE_ROUTE, formData, {
          withCredentials: true,
        });
        if (response.status === 200 && response.data.image) {
          setUserInfo({ ...userInfo, image: response.data.image });
          toast.success("Profile image updated successfully.");
        }
      } catch (error) {
        console.log(error);
        toast.error("Failed to upload image.");
      }
    }
  };

  const handleDeleteImage = async () => {
    try {
      const response = await apiClient.delete(REMOVE_PROFILE_IMAGE_ROUTE, {
        withCredentials: true,
      });
      if (response.status === 200) {
        setUserInfo({ ...userInfo, image: null });
        toast.success("Profile image deleted successfully.");
        setImage(null);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete image.");
    }
  };

  const glowShadows = [
    "shadow-[0_0_20px_#ff006e88]",
    "shadow-[0_0_20px_#ffd60a88]",
    "shadow-[0_0_20px_#06d6a088]",
    "shadow-[0_0_20px_#4cc9f088]",
  ];

  const ringColors = [
    "ring-[#ff006f]/40",
    "ring-[#ffd60a]/40",
    "ring-[#06d6a0]/40",
    "ring-[#4cc9f0]/40",
  ];

  return (
    <div className="bg-[#1c1d25] min-h-screen w-screen flex items-center justify-center p-4 md:p-6 overflow-hidden relative">
      {/* Decorative background ambient glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full bg-purple-700/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full bg-fuchsia-900/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-2xl bg-[#1b1c24]/90 border border-[#2f303b] backdrop-blur-xl rounded-3xl p-6 md:p-10 shadow-2xl flex flex-col gap-6 relative z-10">
        
        {/* Header section with back button */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2f303b]">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleNavigate}
              className="p-2 bg-[#2a2b33] hover:bg-[#343540] text-white rounded-full transition-all duration-300"
            >
              <IoArrowBack className="text-xl" />
            </button>
            <h2 className="text-2xl font-bold tracking-wide text-white poppins-medium">
              Profile Setup
            </h2>
          </div>
          <span className="text-sm text-neutral-400 hidden sm:inline">
            Customize your avatar and details
          </span>
        </div>

        {/* Profile contents */}
        <div className="flex flex-col md:flex-row gap-8 items-center py-4">
          
          {/* Avatar side */}
          <div
            className="relative flex items-center justify-center group"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <div className={`rounded-full p-1.5 transition-all duration-500 ring-4 ${ringColors[selectedColor]} ${glowShadows[selectedColor]}`}>
              <Avatar className="h-32 w-32 md:h-40 md:w-40 rounded-full overflow-hidden border-2 border-[#1c1d25] relative">
                {image ? (
                  <AvatarImage
                    src={image}
                    alt="profile"
                    className="object-cover w-full h-full bg-black transition-all duration-500"
                  />
                ) : (
                  <div
                    className={`uppercase h-full w-full text-5xl flex items-center justify-center rounded-full font-bold select-none ${getColor(
                      selectedColor
                    )}`}
                  >
                    {firstName
                      ? firstName.substring(0, 1)
                      : userInfo?.email?.substring(0, 1) || "U"}
                  </div>
                )}
              </Avatar>
            </div>
            
            {/* Avatar Hover overlays */}
            <div
              className={`absolute inset-1.5 flex items-center justify-center bg-black/60 rounded-full cursor-pointer transition-all duration-300 ${
                hovered ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
              }`}
              onClick={image ? handleDeleteImage : handleFileInputClick}
            >
              {image ? (
                <FaTrash className="text-red-500 text-2xl transition-transform duration-300 hover:scale-110" />
              ) : (
                <FaPlus className="text-white text-2xl transition-transform duration-300 hover:scale-110" />
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleImageChange}
              name="profile-image"
              accept=".png, .jpg, .jpeg, .svg, .webp"
            />
          </div>

          {/* Form details side */}
          <div className="flex-1 w-full flex flex-col gap-4 text-white">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Email Address
              </label>
              <Input
                placeholder="Email"
                type="email"
                disabled
                value={userInfo?.email || ""}
                className="rounded-xl p-4 bg-[#2c2e3b]/80 border border-[#3e4152] disabled:opacity-60 cursor-not-allowed select-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                First Name
              </label>
              <Input
                placeholder="First Name"
                type="text"
                onChange={(e) => setFirstName(e.target.value)}
                value={firstName}
                className="rounded-xl p-4 bg-[#2c2e3b] border border-[#3e4152] focus:border-[#8338ec] focus:ring-1 focus:ring-[#8338ec] outline-none transition-all duration-300"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Last Name
              </label>
              <Input
                placeholder="Last Name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="rounded-xl p-4 bg-[#2c2e3b] border border-[#3e4152] focus:border-[#8338ec] focus:ring-1 focus:ring-[#8338ec] outline-none transition-all duration-300"
              />
            </div>

            {/* Color select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Choose Profile Theme
              </label>
              <div className="flex gap-4 mt-1">
                {colors.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedColor(index)}
                    className={`h-8 w-8 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${color} ${
                      selectedColor === index
                        ? "ring-2 ring-white scale-110 shadow-lg"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Action Button at bottom */}
        <div className="w-full pt-4 border-t border-[#2f303b]">
          <Button
            className="w-full h-14 bg-gradient-to-r from-[#8338ec] to-[#975aed] hover:from-[#741bda] hover:to-[#a16ee8] text-white font-semibold rounded-xl shadow-lg hover:shadow-[0_0_20px_#8338ec44] transition-all duration-300 transform active:scale-[0.98]"
            onClick={saveChanges}
          >
            Save Profile Details
          </Button>
        </div>

      </div>
    </div>
  );
};

export default Profile;
