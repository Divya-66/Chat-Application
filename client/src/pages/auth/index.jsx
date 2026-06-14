import Background from "@/assets/login2.png";
import Victory from "@/assets/victory.svg";
import { TabsContent, TabsTrigger } from "@radix-ui/react-tabs";
import { Tabs, TabsList } from "@/components/ui/tabs";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { LOGIN_ROUTE, SIGNUP_ROUTE } from "@/utils/constants";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store";

const Auth = () => {
  const navigate = useNavigate();
  const { setUserInfo } = useAppStore();
  const [email, setemail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validateLogin = () => {
    if (!email.length) {
      toast.error("Email is required.");
      return false;
    }
    if (!password.length) {
      toast.error("Password is required.");
      return false;
    }
    return true;
  };

  const validateSignup = () => {
    if (!email.length) {
      toast.error("Email is required.");
      return false;
    }
    if (!password.length) {
      toast.error("Password is required.");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Password and confirm password should be same.");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (validateLogin()) {
      try {
        const response = await apiClient.post(
          LOGIN_ROUTE,
          { email, password },
          { withCredentials: true }
        );
        if (response.data.user.id) {
          setUserInfo(response.data.user);
          if (response.data.user.profileSetup) {
            navigate("/chat");
          } else {
            navigate("/profile");
          }
        }
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || "Login failed.");
      }
    }
  };

  const handleSignup = async () => {
    if (validateSignup()) {
      try {
        const response = await apiClient.post(
          SIGNUP_ROUTE,
          { email, password },
          { withCredentials: true }
        );
        if (response.status === 201) {
          setUserInfo(response.data.user);
          navigate("/profile");
        }
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || "Signup failed.");
      }
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#1c1d25] relative overflow-hidden flex items-center justify-center p-4">
      {/* Premium Neon Ambient Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] md:w-[600px] h-[450px] md:h-[600px] bg-[#8338ec]/10 rounded-full blur-[100px] md:blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] md:w-[600px] h-[450px] md:h-[600px] bg-[#8338ec]/8 rounded-full blur-[100px] md:blur-[130px] pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <div className="w-full max-w-5xl bg-[#1b1c24]/50 border border-white/10 backdrop-blur-xl rounded-[32px] shadow-2xl grid xl:grid-cols-2 overflow-hidden relative z-10 transition-all duration-300">
        
        {/* Form Container */}
        <div className="flex flex-col gap-10 items-center justify-center p-8 md:p-14 lg:p-16">
          <div className="flex items-center justify-center flex-col text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-purple-100 to-purple-400 bg-clip-text text-transparent select-none">
                Welcome
              </h1>
              <img src={Victory} alt="Victory Emoji" className="h-10 md:h-12 animate-bounce" />
            </div>
            <p className="text-neutral-400 text-sm md:text-base font-medium max-w-xs mt-1">
              Connect and transmit instantly on the best walkie-talkie chat.
            </p>
          </div>

          <div className="flex items-center justify-center w-full">
            <Tabs className="w-full max-w-md" defaultValue="login">
              <TabsList className="bg-white/5 border border-white/5 rounded-2xl w-full p-1.5 flex gap-1 mb-8">
                <TabsTrigger
                  value="login"
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-neutral-400 transition-all duration-300 focus:outline-none data-[state=active]:bg-[#8338ec] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#8338ec]/20"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-neutral-400 transition-all duration-300 focus:outline-none data-[state=active]:bg-[#8338ec] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#8338ec]/20"
                >
                  Signup
                </TabsTrigger>
              </TabsList>

              <TabsContent className="flex flex-col gap-4 focus-visible:outline-none" value="login">
                <Input
                  placeholder="Email"
                  type="email"
                  className="bg-[#2a2b33]/30 border-white/5 text-white placeholder-neutral-500 rounded-2xl p-6 focus-visible:ring-offset-0 focus-visible:ring-[#8338ec]/50 focus-visible:border-[#8338ec]/50 transition-all duration-300"
                  value={email}
                  onChange={(e) => setemail(e.target.value)}
                />
                <Input
                  placeholder="Password"
                  type="password"
                  className="bg-[#2a2b33]/30 border-white/5 text-white placeholder-neutral-500 rounded-2xl p-6 focus-visible:ring-offset-0 focus-visible:ring-[#8338ec]/50 focus-visible:border-[#8338ec]/50 transition-all duration-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLogin();
                  }}
                />
                <Button 
                  className="bg-[#8338ec] hover:bg-[#741bda] text-white font-bold rounded-2xl p-6 transition-all duration-300 shadow-lg shadow-[#8338ec]/20 focus:outline-none focus:ring-2 focus:ring-[#8338ec]/50 mt-2" 
                  onClick={handleLogin}
                >
                  Sign In
                </Button>
              </TabsContent>

              <TabsContent className="flex flex-col gap-4 focus-visible:outline-none" value="signup">
                <Input
                  placeholder="Email"
                  type="email"
                  className="bg-[#2a2b33]/30 border-white/5 text-white placeholder-neutral-500 rounded-2xl p-6 focus-visible:ring-offset-0 focus-visible:ring-[#8338ec]/50 focus-visible:border-[#8338ec]/50 transition-all duration-300"
                  value={email}
                  onChange={(e) => setemail(e.target.value)}
                />
                <Input
                  placeholder="Password"
                  type="password"
                  className="bg-[#2a2b33]/30 border-white/5 text-white placeholder-neutral-500 rounded-2xl p-6 focus-visible:ring-offset-0 focus-visible:ring-[#8338ec]/50 focus-visible:border-[#8338ec]/50 transition-all duration-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Input
                  placeholder="Confirm Password"
                  type="password"
                  className="bg-[#2a2b33]/30 border-white/5 text-white placeholder-neutral-500 rounded-2xl p-6 focus-visible:ring-offset-0 focus-visible:ring-[#8338ec]/50 focus-visible:border-[#8338ec]/50 transition-all duration-300"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSignup();
                  }}
                />
                <Button 
                  className="bg-[#8338ec] hover:bg-[#741bda] text-white font-bold rounded-2xl p-6 transition-all duration-300 shadow-lg shadow-[#8338ec]/20 focus:outline-none focus:ring-2 focus:ring-[#8338ec]/50 mt-2" 
                  onClick={handleSignup}
                >
                  Create Account
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Visual Decoration Column */}
        <div className="hidden xl:flex flex-col justify-center items-center relative h-full bg-[#16171d]/30 border-l border-white/5 p-12">
          {/* Outer glowing halo behind the image */}
          <div className="absolute w-[380px] h-[380px] bg-[#8338ec]/15 rounded-full blur-[70px] pointer-events-none" />
          <img 
            src={Background} 
            alt="background login" 
            className="h-[440px] w-auto object-contain relative z-10 drop-shadow-[0_12px_40px_rgba(131,56,236,0.25)] select-none" 
          />
        </div>

      </div>
    </div>
  );
};

export default Auth;
