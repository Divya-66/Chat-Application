import Lottie from "react-lottie";
import { animationDefaultOptions } from "@/lib/utils";

const EmptyChatContainer = () => {
  return (
    <div className="flex-1 md:bg-[#1c1d25] md:flex flex-col justify-center items-center hidden duration-1000 transition-all relative">
      {/* Background signal pulse rings representing Walkie-Talkie waves */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
        <div className="absolute w-[200px] h-[200px] border-4 border-purple-500 rounded-full animate-[ping_3.5s_linear_infinite]" />
        <div className="absolute w-[400px] h-[400px] border-2 border-purple-500 rounded-full animate-[ping_5s_linear_infinite]" />
        <div className="absolute w-[600px] h-[600px] border border-purple-500 rounded-full animate-[ping_6.5s_linear_infinite]" />
      </div>

      <div className="relative z-10 flex flex-col justify-center items-center">
        <Lottie
          isClickToPauseDisabled={true}
          height={200}
          width={200}
          options={animationDefaultOptions}
        />
        <div className="text-opacity-80 text-white flex flex-col gap-3 items-center mt-8 transition-all duration-300 text-center">
          <h3 className="poppins-medium text-3xl md:text-4xl font-bold tracking-wide">
            Hi<span className="text-[#8338ec]">! </span>Welcome to{" "}
            <span className="text-[#8338ec]">Walkie-Talkie</span>
          </h3>
          <p className="text-xs md:text-sm text-neutral-400 max-w-xs px-6 leading-relaxed select-none">
            Select a contact or channel from the sidebar to establish a frequency and start transmitting.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmptyChatContainer;
