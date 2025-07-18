import React from 'react';
import loader from "@/assets/wwm-logo.png";
import { useLoaderStore } from "@/pages/HomePage/store/globalComponentsStore";

interface LoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Loader: React.FC<LoaderProps> = ({ 
  message = "Loading...", 
  size = 'md' 
}) => {
    const { loading } = useLoaderStore();
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-48 h-48'
  };

  const containerSizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-40 h-40',
    lg: 'w-56 h-56'
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen w-full fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-transparent backdrop-blur-sm ${loading?"block":"hidden"}`}>
      {/* Main loader container with divine effects */}
      <div className={`relative ${containerSizeClasses[size]} flex items-center justify-center`}>
        
        {/* Outer pulse rings */}
        <div className="absolute inset-0 rounded-full animate-pulse-ring border-2 border-amber-400/30"></div>
        <div className="absolute inset-0 rounded-full animate-pulse-ring border border-orange-500/40 [animation-delay:500ms]"></div>
        
        {/* Divine glow background */}
        <div className="absolute inset-4 rounded-full animate-divine-glow bg-gradient-radial from-amber-300/30 via-yellow-200/20 to-transparent"></div>
        
        {/* Flame-like particles */}
        <div className="absolute top-[15%] left-[75%] w-2 h-6 rounded-full bg-gradient-to-t from-orange-800 via-orange-500 to-yellow-400 animate-flame-flicker blur-[0.5px] [animation-delay:0s]"></div>
        <div className="absolute top-[35%] left-[90%] w-2 h-6 rounded-full bg-gradient-to-t from-orange-800 via-orange-500 to-yellow-400 animate-flame-flicker blur-[0.5px] [animation-delay:0.2s]"></div>
        <div className="absolute top-[65%] left-[75%] w-2 h-6 rounded-full bg-gradient-to-t from-orange-800 via-orange-500 to-yellow-400 animate-flame-flicker blur-[0.5px] [animation-delay:0.4s]"></div>
        <div className="absolute top-[85%] left-[50%] w-2 h-6 rounded-full bg-gradient-to-t from-orange-800 via-orange-500 to-yellow-400 animate-flame-flicker blur-[0.5px] [animation-delay:0.6s]"></div>
        <div className="absolute top-[65%] left-[25%] w-2 h-6 rounded-full bg-gradient-to-t from-orange-800 via-orange-500 to-yellow-400 animate-flame-flicker blur-[0.5px] [animation-delay:0.8s]"></div>
        <div className="absolute top-[35%] left-[10%] w-2 h-6 rounded-full bg-gradient-to-t from-orange-800 via-orange-500 to-yellow-400 animate-flame-flicker blur-[0.5px] [animation-delay:1s]"></div>
        
        {/* Main logo container */}
        <div className={`relative ${sizeClasses[size]} rounded-full bg-white/80 backdrop-blur-sm border border-orange-200/50 shadow-2xl animate-logo-breathe flex items-center justify-center overflow-hidden`}>
          
          {/* Inner flame effect */}
          <div className="absolute inset-2 rounded-full animate-flame-dance bg-gradient-conic from-orange-800/30 via-orange-500/50 via-yellow-400/40 via-amber-300/30 to-orange-800/30"></div>
          
          {/* Logo image */}
          <img
            src={loader}
            alt="Worldwide Word Ministries"
            className="relative z-10 w-full h-full object-contain p-2 animate-float filter drop-shadow-lg"
          />
          
          {/* Spiritual light overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-100/10 to-orange-100/5 animate-pulse"></div>
        </div>
        
        {/* Rotating border effect */}
        <div className={`absolute ${sizeClasses[size]} rounded-full animate-spin [animation-duration:4s] bg-gradient-conic from-transparent via-amber-400/60 to-transparent`}></div>
      </div>
      
      {/* Loading message */}
      <div className="mt-8 text-center space-y-2">
        <p className="text-lg font-semibold text-orange-900 animate-pulse">
          {message}
        </p>
        
        {/* Progress dots */}
        <div className="flex space-x-1 justify-center">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:0s]"></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
        </div>
        
        {/* Inspirational subtitle */}
        <p className="text-sm text-orange-700/75 opacity-75 mt-4">
          Spreading the Word Worldwide
        </p>
      </div>
      
      {/* Bottom decorative elements */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-4">
          <div className="w-1 h-8 bg-gradient-to-t from-orange-500/60 to-transparent rounded-full animate-flame-flicker [animation-delay:0s]"></div>
          <div className="w-1 h-8 bg-gradient-to-t from-orange-500/60 to-transparent rounded-full animate-flame-flicker [animation-delay:0.3s]"></div>
          <div className="w-1 h-8 bg-gradient-to-t from-orange-500/60 to-transparent rounded-full animate-flame-flicker [animation-delay:0.6s]"></div>
          <div className="w-1 h-8 bg-gradient-to-t from-orange-500/60 to-transparent rounded-full animate-flame-flicker [animation-delay:0.9s]"></div>
          <div className="w-1 h-8 bg-gradient-to-t from-orange-500/60 to-transparent rounded-full animate-flame-flicker [animation-delay:1.2s]"></div>
        </div>
      </div>
    </div>
  );
};

export default Loader;