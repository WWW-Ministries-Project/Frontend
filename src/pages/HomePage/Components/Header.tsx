import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import hamburger from "/src/assets/sidenav.svg";
import ChurchLogo from "@/components/ChurchLogo";
import { ProfilePicture } from "@/components";
import { CartIcon } from "../pages/MarketPlace/components/cart/CartIcon";

import { useAuth } from "../../../context/AuthWrapper";
import { decodeToken, removeToken } from "../../../utils/helperFunctions";
import { relativePath } from "@/utils";

interface IProps {
  handleShowNav?: () => void;
}

export const Header = ({ handleShowNav }: IProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSchoolMenuOpen, setIsSchoolMenuOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const schoolRef = useRef<HTMLDivElement>(null);

  const token = decodeToken();
  const profileImg = token?.profile_img ?? "";
  const name = token?.name ?? "";
  const isMinistryWorker = token?.ministry_worker;
  const isLifeCenterLeader = token?.life_center_leader;

  const isMemberRoute = location.pathname.startsWith("/member");
  const isSchoolRoute = location.pathname.includes("school-of-ministries");

  const isActive = (path: string) => location.pathname.startsWith(path);

  const memberNavItems = [
    { label: "Home", path: relativePath.member.dashboard },
    { label: "Marketplace", path: relativePath.member.market },
    ...(isLifeCenterLeader
      ? [{ label: "Life Center", path: relativePath.member.lifeCenter }]
      : []),
  ];

  const schoolItems = [
    { label: "Explore programs", path: relativePath.member.schoolOfMinistries.allPrograms },
    { label: "My learning", path: relativePath.member.schoolOfMinistries.myEnrolledPrograms },
    { label: "Instructor portal", path: relativePath.member.schoolOfMinistries.instructorPortal },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMobileNavOpen(false);
    setIsSchoolMenuOpen(false);
    setIsProfileMenuOpen(false);
  };

  const handleLogout = () => {
    removeToken();
    logout();
    navigate("/login");
  };

  /* Close dropdowns on outside click */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }

      if (
        schoolRef.current &&
        !schoolRef.current.contains(e.target as Node)
      ) {
        setIsSchoolMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* Auto close mobile nav on resize */
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileNavOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white md:text-sm lg:text-md">
      <div className="flex items-center justify-between px-4 ">
        {/* Left */}
        <div className="flex items-center gap-3">
          <ChurchLogo show />

          {!isMemberRoute && (
            <img
              src={hamburger}
              alt="menu"
              onClick={handleShowNav}
              className="lg:hidden w-6 h-6 cursor-pointer"
            />
          )}

          {isMemberRoute && (
            <button
              aria-label="Toggle navigation"
              aria-expanded={isMobileNavOpen}
              onClick={() => setIsMobileNavOpen(v => !v)}
              className="lg:hidden p-2 rounded-md hover:bg-primary/10"
            >
              ☰
            </button>
          )}
        </div>

        {/* Desktop Nav */}
        {isMemberRoute && (
          <nav className="hidden lg:flex items-center gap-2">
            {memberNavItems.map(item => (
              <button
                key={item.label}
                onClick={() => handleNavigate(item.path)}
                className={`px-4 py-2 rounded-md font-semibold transition ${
                  isActive(item.path)
                    ? "bg-primary text-white"
                    : "text-primary hover:bg-primary/10"
                }`}
              >
                {item.label}
              </button>
            ))}

            <div ref={schoolRef} className="relative">
              <button
                aria-expanded={isSchoolMenuOpen}
                onClick={() => setIsSchoolMenuOpen(v => !v)}
                className={`px-4 py-2 rounded-md flex items-center gap-1 font-semibold ${
                  isSchoolRoute
                    ? "bg-primary text-white"
                    : "text-primary hover:bg-primary/10"
                }`}
              >
                School of Ministries
              </button>

              {isSchoolMenuOpen && (
                <div role="menu" className="absolute mt-2 w-56 bg-white border rounded-md shadow-lg">
                  {schoolItems.map(item => (
                    <button
                      key={item.label}
                      onClick={() => handleNavigate(item.path)}
                      className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-100 ${
                        isActive(item.path) ? "text-primary font-semibold" : ""
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>
        )}

        {/* Right */}
        <div ref={profileRef} className="flex items-center gap-3 relative">
          {isMemberRoute && <CartIcon />}

          <button
            onClick={() => setIsProfileMenuOpen(v => !v)}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100"
          >
            <ProfilePicture alt={name} src={profileImg} name={name} className="w-8 h-8" />
            <span className="hidden md:block font-semibold text-primary">
              {name}
            </span>
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 top-12 w-56 bg-white border rounded-md shadow-lg">
              {isMinistryWorker && (
                <button
                  onClick={() =>
                    navigate(isMemberRoute ? "/home/dashboard" : "/member/dashboard")
                  }
                  className="w-full text-left px-4 py-3 hover:bg-gray-100"
                >
                  {isMemberRoute ? "Go to admin portal" : "Go to member portal"}
                </button>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 text-red-600"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Nav */}
      {isMemberRoute && (
        <div
          className={`lg:hidden transition-all duration-300 overflow-hidden ${
            isMobileNavOpen ? "max-h-[500px] border-t" : "max-h-0"
          }`}
        >
          <nav className="px-4 py-3 space-y-2">
            {[...memberNavItems, { label: "School of Ministries", path: relativePath.member.schoolOfMinistries.allPrograms }].map(
              item => (
                <button
                  key={item.label}
                  onClick={() => handleNavigate(item.path)}
                  className="block w-full text-left px-4 py-3 rounded-md hover:bg-primary/10"
                >
                  {item.label}
                </button>
              )
            )}
          </nav>
        </div>
      )}
    </header>
  );
};