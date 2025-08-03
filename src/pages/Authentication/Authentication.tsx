// import { useState } from "react";
// import LoginPage from "./pages/LoginPage/LoginPage";
// import ForgotPassword from "./pages/LoginPage/ForgotPassword/ForgotPassword";
// import NotificationCard from "./components/NotificationCard";
// import MailSent from "./components/MailSent";
// import PasswordSet from "./components/PasswordSet";

// const Authentication = () => {
//   const [response, setResponse] = useState({});
//   const [error, setError] = useState({});
//   const [inputValue, setInputValue] = useState({});

//   const validateEmail = (email) => {
//     // Regular expression pattern for email validation
//     const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

//     // Perform validation
//     return emailPattern.test(email);
//   };

//   function handleInputChange(e) {
//     setResponse({});
//     const name = e.target.name;
//     setInputValue((prev) => ({ ...prev, [name]: e.target.value }));
//     // to remove error msg
//     if (error[name]) {
//       if (validate(name)) {
//         setError((prev) => ({ ...prev, [name]: false }));
//         e.target.setCustomValidity("");
//       }
//     }
//   }
//   function validate(name) {
//     if (name == "email") {
//       return validateEmail(inputValue.email);
//     }
//     if (name == "password") {
//       return inputValue.password?.length > 0;
//     }
//     return false;
//   }

//   function handleBlur(e) {
//     const name = e.target.name;
//     const isValid = validate(name);
//     setError((prev) => ({ ...prev, [name]: !isValid }));
//     !isValid && e.target.setCustomValidity("Invalid format");
//     console.log(e.target, "tag");
//     console.log(error, "err", validate(name));
//   }

//   function handleSubmit(e) {
//     console.log('handled')
//     e.preventDefault();
//     // if (!inputValue.email ) {
//       setError((prev) => ({ ...prev, status: true }));
//       console.log('reached');
//     // }
//     console.log(inputValue);
//     console.log(error);
//   }

//   return (
//     <>
//       {/* <LoginPage
//         inputValue={inputValue}
//         error={error}
//         handleSubmit={handleSubmit}
//         response={response}
//         onChange={handleInputChange}
//         onBlur={handleBlur}
//       /> */}
//       {/* <ForgotPassword
//         inputValue={inputValue}
//         error={error}
//         handleSubmit={handleSubmit}
//         response={response}
//         onChange={handleInputChange}
//         onBlur={handleBlur}
//       /> */}
//       {/* <MailSent/>  */}
//       <PasswordSet/>
//     </>
//   );
// };

// export default Authentication;


import { useNavigate } from "react-router-dom";
import ministryBackground from "@/assets/ministry-background.jpg";
import { PortalCard } from "./components/Portal";
import { ShieldExclamationIcon, UsersIcon } from "@heroicons/react/24/outline";

const Authentication = () => {
  const navigate = useNavigate();

  const handleManagementPortal = () => {
    navigate("/login");
  };

  const handleMemberPortal = () => {
    navigate("/member-login");
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url('https://res.cloudinary.com/akwaah/image/upload/v1740860331/background_oswjfy.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Gradient Overlay */}
      <div className="bg-primary/60  backdrop-blur-sm">
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-ministry-accent/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-ministry-gold/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
      
      {/* Header */}
      <header className="relative z-10 p-6">
        {/* <MinistryLogo /> */}
      </header>
      
      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-6">
        <div className="w-full max-w-2xl">
          {/* Welcome Section */}
          <div className="text-center mb-12 animate-slide-up">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight ">
              Welcome to the
              <span className="block  bg-clip-text text-white">
                Worldwide Word Ministries Portal
              </span>
            </h1>
            
            <div className="w-24 h-1 bg-white mx-auto mb-8 rounded-full" />
            
            <p className="text-xl text-white/90 font-medium">
              Where would you like to go?
            </p>
          </div>
          
          {/* Portal Cards */}
          <div className="space-y-6">
            <PortalCard
              title="Management Portal"
              description="For administrators to manage projects, members, and operations"
              icon={<ShieldExclamationIcon className="w-6 h-6 text-white" />}
              onClick={handleManagementPortal}
              delay={200}
            />
            
            <PortalCard
              title="Member Portal"
              description="For members to access personal dashboards, updates, and services"
              icon={<UsersIcon className="w-6 h-6 text-white" />}
              onClick={handleMemberPortal}
              delay={400}
            />
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="relative z-10 text-center py-6">
        <p className="text-white/60 text-sm">
          © 2024 Worldwide Word Ministries. All rights reserved.
        </p>
      </footer>
      </div>
    </div>
  );
};

export default Authentication;
