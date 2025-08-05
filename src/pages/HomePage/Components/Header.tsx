import hamburger from "/src/assets/sidenav.svg";
import { ProfilePicture } from "@/components";
import ChurchLogo from "@/components/ChurchLogo";
import { MouseEventHandler, useState, useRef, useEffect } from "react";
import { matchRoutes, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthWrapper";
import { decodeToken, removeToken } from "../../../utils/helperFunctions";
import { routes } from "@/routes/appRoutes";

interface IProps {
  handleShowNav?: () => void;
}

export const Header = ({ handleShowNav }: IProps) => {
  const navigate = useNavigate();
  const [showLogOut, setShowLogOut] = useState<boolean>(false);
  const [showMobileNav, setShowMobileNav] = useState<boolean>(false);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState<boolean>(false);
  const [showMobileSchoolDropdown, setShowMobileSchoolDropdown] = useState<boolean>(false);
  const { logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  
  const matches = matchRoutes(routes, location);
  const routeName = matches?.find(m => m.route.name)?.route.name;

  // Function to check if a nav item is active
  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  // Check if any school of ministries route is active
  const isSchoolRouteActive = () => {
    return location.pathname.includes('/member/school-of-ministries');
  };

  const toggleMobileNav = () => {
    setShowMobileNav((prev) => !prev);
  };

  const handleClick: MouseEventHandler<HTMLDivElement> = () => {
    setShowLogOut((prev) => !prev);
  };

  const handleLogOut = () => {
    removeToken();
    logout();
    navigate("/login");
  };

  const handleNavItemClick = (path: string) => {
    navigate(path);
    setShowMobileNav(false); // Close mobile nav after navigation
    setShowSchoolDropdown(false); // Close dropdown after navigation
  };

  const toggleSchoolDropdown = () => {
    setShowSchoolDropdown((prev) => !prev);
  };

  const toggleMobileSchoolDropdown = () => {
    setShowMobileSchoolDropdown((prev) => !prev);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSchoolDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const decodedToken = decodeToken();
  const profileImg = decodedToken?.profile_img ?? "";
  const name = decodedToken?.name ?? "";
  const isMinistryWorker = decodedToken?.ministry_worker

  const memberNavItems = [
    { label: "Home", path: "/member/dashboard" },
    { label: "Marketplace", path: "/member/market" },
    { label: "Life Center", path: "/member/life-center" },
    // { label: "Appointments", path: "/member/appointments" },
  ];

  const schoolOfMinistriesItems = [
    { label: "All programs", path: "/member/school-of-ministries/programs" },
    { label: "My class", path: "/member/school-of-ministries/my-class" },
  ];

  return (
    <div className="flex flex-col">
      <div className="flex items-center">
        <header className="flex justify-between items-center w-full">
          <div className="flex items-center gap-x-6">
            <div>
              <ChurchLogo show={true} className="h-3" />
            </div>
            <div className="flex items-center gap-x-2">
              {routeName !== "member" &&<img
                src={hamburger}
                alt="hamburger menu"
                onClick={handleShowNav}
                className="cursor-pointer inline sm:inline md:inline text-primary lg:hidden"
              />}
              {/* Mobile Navigation Toggle for Member Routes */}
              {routeName === "member" && (
                <button
                  onClick={toggleMobileNav}
                  className="lg:hidden text-primary hover:text-primary/80 transition-colors duration-200 p-1"
                  aria-label="Toggle navigation menu"
                >
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    {showMobileNav ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Desktop Navigation Items */}
          {routeName === "member" && (
            <nav className="hidden lg:flex items-center gap-x-6">
              {memberNavItems.map((item) => {
                const isActive = isActiveRoute(item.path);
                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavItemClick(item.path)}
                    className={`font-medium transition-colors duration-200 px-3 py-2 rounded-md ${
                      isActive
                        ? "text-white bg-primary font-bolder"
                        : "text-primary font-semibold hover:text-primary/80 hover:bg-primary/10"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
              
              {/* School of Ministries Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleSchoolDropdown}
                  className={`font-medium transition-colors duration-200 px-3 py-2 rounded-md flex items-center gap-1 ${
                    isSchoolRouteActive()
                      ? "text-white bg-primary font-bolder"
                      : "text-primary font-semibold hover:text-primary/80 hover:bg-primary/10"
                  }`}
                >
                  School of Ministries
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${showSchoolDropdown ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showSchoolDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    {schoolOfMinistriesItems.map((item) => {
                      const isActive = isActiveRoute(item.path);
                      return (
                        <button
                          key={item.label}
                          onClick={() => handleNavItemClick(item.path)}
                          className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors duration-200 hover:bg-gray-50 first:rounded-t-md last:rounded-b-md ${
                            isActive
                              ? "text-primary bg-primary/10"
                              : "text-gray-700 hover:text-primary"
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </nav>
          )}

          {/* <div className={routeName === "member" ? "flex-1" : "w-[40.9%]"} /> */}

          <div className="relative w-[246px] flex justify-end gap-x-2 items-center">
            <div
              className="flex items-center rounded-xl gap-x-3 cursor-pointer"
              onClick={handleClick}
            >
              <ProfilePicture
                src={profileImg}
                className="w-[2rem] h-[2rem] bg-lightGray/90 border text-primary"
                name={name}
                alt="profile picture"
              />
              <span className="text-primary font-semibold hidden md:block">{name}</span>
            </div>
            {showLogOut && (
              <div
               
                className="absolute z-50 top-12 border w-[246px] rounded-lg bg-white  shadow-xl items-center hover:bg-neutralGray cursor-pointer"
              >
               {isMinistryWorker&&<div  onClick={()=>navigate(routeName === "member"?"/home/dashboard":"/member/dashboard")} className="hover:bg-gray-100 w-full p-4 py-2 rounded-lg">
                 {routeName === "member"? "Go to admin portal":"Go to member portal"}
               </div>}
               <hr />
               <div  onClick={handleLogOut} className="hover:bg-gray-100 w-full p-4 py-2 rounded-lg">
                 Log out
               </div>
              </div>
            )}
          </div>
        </header>
      </div>

      {/* Mobile Navigation Menu */}
      {routeName === "member" && showMobileNav && (
        <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg">
          <nav className="px-4 py-3 space-y-2">
            {memberNavItems.map((item) => {
              const isActive = isActiveRoute(item.path);
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavItemClick(item.path)}
                  className={`w-full text-left font-medium transition-colors duration-200 px-3 py-3 rounded-md block ${
                    isActive
                      ? "text-white bg-primary"
                      : "text-primary hover:text-primary/80 hover:bg-primary/10"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            
            {/* Mobile School of Ministries Dropdown */}
            <div>
              <button
                onClick={toggleMobileSchoolDropdown}
                className={`w-full text-left font-medium transition-colors duration-200 px-3 py-3 rounded-md flex items-center justify-between ${
                  isSchoolRouteActive()
                    ? "text-white bg-primary"
                    : "text-primary hover:text-primary/80 hover:bg-primary/10"
                }`}
              >
                School of Ministries
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${showMobileSchoolDropdown ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showMobileSchoolDropdown && (
                <div className="ml-4 mt-2 space-y-1">
                  {schoolOfMinistriesItems.map((item) => {
                    const isActive = isActiveRoute(item.path);
                    return (
                      <button
                        key={item.label}
                        onClick={() => handleNavItemClick(item.path)}
                        className={`w-full text-left font-medium transition-colors duration-200 px-3 py-2 rounded-md text-sm ${
                          isActive
                            ? "text-white bg-primary"
                            : "text-primary/80 hover:text-primary hover:bg-primary/10"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
};