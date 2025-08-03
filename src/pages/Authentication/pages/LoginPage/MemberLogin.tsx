import { Button } from "@/components";
import ChurchLogo from "@/components/ChurchLogo";
import Input from "@/components/Input";
import { ArrowLeftIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import { useNavigate } from "react-router-dom";


const MemberLogin = () => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Member login:", { emailOrPhone, rememberMe });
    // Navigate to OTP page
    navigate("/member-otp");
  };

  return (
    <div className="min-h-screen bg-[url('https://res.cloudinary.com/akwaah/image/upload/v1740860331/background_oswjfy.jpg')] bg-no-repeat bg-right bg-cover">
      <div className="min-h-screen bg-primary/60  backdrop-blur-sm flex items-center justify-center">
      <div className="w-full max-w-md ">
        <div className="text-center mb-8">
          <ChurchLogo />
        </div>
        
        <div className="bg-white/10 backdrop-blur-md border-0 shadow-[var(--glass-shadow)] p-8">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-white">Member Login</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              {/* <Label htmlFor="emailOrPhone" className="text-white">
                Email or Phone Number
              </Label> */}
              <Input
              label="Email"
              labelClassName={"text-white"}
              name="emailOrPhone"
                id="emailOrPhone"
                type="text"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                className=" border-white/20 text-white placeholder:text-white/60"
                placeholder="Enter your email or phone"
               
              />
            </div>

            <div className="bg-ministry-accent/10 border border-ministry-accent/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <InformationCircleIcon className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                <p className="text-white/90 text-sm leading-relaxed">
                  Enter the email or phone number you used to register. 
                  We'll send a one-time password (OTP) to that email or number.
                </p>
              </div>
            </div>

            {/* <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                className="border-white/20 data-[state=checked]:bg-ministry-accent data-[state=checked]:border-ministry-accent"
              />
              <Label htmlFor="remember" className="text-white text-sm">
                Remember me for the next 30 days
              </Label>
            </div> */}

            <Button
              type="submit"
              variant="secondary"
              className="w-full border-white text-white hover:bg-ministry-accent/90  font-semibold"
              value="Send OTP"
            />
          </form>
        </div>
      </div>
      </div>
    </div>
  );
};

export default MemberLogin;