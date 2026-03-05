import learning from "@/assets/banner/learning.svg";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type BannerSize = "default" | "compact";

interface BannerProps {
  children: ReactNode;
  imgSrc?: string;
  isAdmin?: boolean;
  size?: BannerSize;
}

export const Banner = ({
  children,
  imgSrc = learning,
  isAdmin = false,
  size = "default",
}: BannerProps) => {
  const navigate = useNavigate();
  const compact = size === "compact";

  return (
    <div className="relative w-full rounded-t-lg bg-primary text-white">
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div
          className={`absolute top-0 right-0 rounded-full bg-white ${
            compact
              ? "h-40 w-40 -translate-y-1/2 translate-x-1/3"
              : "h-64 w-64 -translate-y-1/2 translate-x-1/3"
          }`}
        />
        <div
          className={`absolute bottom-0 left-0 rounded-full bg-white ${
            compact
              ? "h-28 w-28 translate-y-1/3 -translate-x-1/4"
              : "h-48 w-48 translate-y-1/3 -translate-x-1/4"
          }`}
        />

        <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="diagonalLines"
              patternUnits="userSpaceOnUse"
              width="40"
              height="40"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="40" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagonalLines)" />
        </svg>
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-primary via-transparent to-primary/50" />

      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div
        className={`pointer-events-none absolute top-0 right-0 flex h-full w-auto items-center ${
          compact ? "opacity-5 lg:opacity-20" : "opacity-10 lg:opacity-40"
        }`}
      >
        <img src={imgSrc} alt="" className="h-full w-auto object-contain" />
      </div>

      <div
        className={`app-page-padding relative z-10 mx-auto flex h-full flex-col items-center transition-all duration-300 ease-in-out ${
          compact ? "py-3 md:py-4" : "py-6"
        }`}
      >
        {!isAdmin && (
          <div className={`${compact ? "mb-2" : "mb-4"} flex w-full justify-start`}>
            <button
              onClick={() => navigate(-1)}
              className={`flex items-center gap-2 text-white/90 transition hover:text-white ${
                compact ? "text-xs md:text-sm" : "text-sm"
              }`}
            >
              <ArrowLeftIcon className={compact ? "h-4 w-4 md:h-5 md:w-5" : "h-5 w-5"} />
              <span>Back</span>
            </button>
          </div>
        )}

        {children}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-white/0 via-white/20 to-white/0" />

      {!compact && (
        <>
          <div className="absolute top-0 left-0 h-20 w-20 border-t-2 border-l-2 border-white/20" />
          <div className="absolute top-0 right-0 h-20 w-20 border-t-2 border-r-2 border-white/20" />
        </>
      )}
    </div>
  );
};
