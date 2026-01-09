import learning from "@/assets/banner/learning.svg";
import { ReactNode, useEffect, useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

const BannerWrapper = ({children, imgSrc, isAdmin=false}: {children: ReactNode, imgSrc?: string, isAdmin?:boolean}) => {
  const [isSticky, setIsSticky] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return ( 
   <div
  className={`
    bg-primary text-white overflow-hidden
    ${
      isAdmin
        ? "w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]"
        : (isSticky
        ? "fixed top-20 left-0 right-0 z-30 shadow-lg w-full"
        : "w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]")
    }
  `}
>
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        {/* Geometric circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/3 -translate-x-1/4"></div>
        
        {/* Diagonal lines pattern */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="diagonalLines" patternUnits="userSpaceOnUse" width="40" height="40" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="40" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagonalLines)" />
        </svg>
      </div>

      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-transparent to-primary/50"></div>

      {/* Decorative top border with dots */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent">
      
      </div>
      <div className="absolute top-0 right-0 h-full w-auto flex items-center opacity-10 lg:opacity-40 pointer-events-none">
        <img
          src={imgSrc || learning}
          alt=""
          className="h-full w-auto object-contain"
        />
      </div>
      
      {/* Content container */}
      <div 
        className={`
          relative z-10 h-full flex flex-col items-center mx-auto 
          transition-all duration-300 ease-in-out
          ${isSticky 
            ? 'py-6 px-4 lg:px-16 xl:px-32 3xl:px-64' 
            : 'py-6 px-4 lg:px-16 xl:px-32 3xl:px-64'
          }
        `}
      >
        <div className="w-full mb-4 flex justify-start">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-white/90 hover:text-white transition"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back</span>
          </button>
        </div>
        
        {children}
      </div>

      {/* Decorative bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-white/0 via-white/20 to-white/0"></div>
      
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-white/20"></div>
      <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-white/20"></div>
    </div>
  );
}

export default BannerWrapper;