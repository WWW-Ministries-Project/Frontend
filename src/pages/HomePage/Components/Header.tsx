import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import hamburger from "/src/assets/sidenav.svg";
import ChurchLogo from "@/components/ChurchLogo";
import { ProfilePicture } from "@/components";
import { CartIcon } from "../pages/MarketPlace/components/cart/CartIcon";

import { useAuth } from "../../../context/AuthWrapper";
import { decodeToken } from "../../../utils/helperFunctions";
import { relativePath } from "@/utils";
import { Bars3Icon, Squares2X2Icon } from "@heroicons/react/24/outline";

interface AccessibleMenuProps {
  isOpen: boolean;
  label: string;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  children: React.ReactNode;
}

const AccessibleMenu = ({
  isOpen,
  label,
  onClose,
  triggerRef,
  children,
}: AccessibleMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const items = menuRef.current?.querySelectorAll<HTMLButtonElement>(
      '[role="menuitem"]'
    );
    items?.[0]?.focus();
  }, [isOpen]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const items = menuRef.current?.querySelectorAll<HTMLButtonElement>(
      '[role="menuitem"]'
    );
    if (!items || !items.length) return;

    const index = Array.from(items).indexOf(
      document.activeElement as HTMLButtonElement
    );

    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(index + 1) % items.length].focus();
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(index - 1 + items.length) % items.length].focus();
    }

    if (e.key === "Escape") {
      onClose();
      triggerRef.current?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="absolute top-10  mt-2 w-56 bg-white border rounded-md shadow-lg"
    >
      {children}
    </div>
  );
};

interface IProps {
  handleShowNav?: () => void;
}

export const Header = ({ handleShowNav }: IProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMobileSchoolOpen, setIsMobileSchoolOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSchoolMenuOpen, setIsSchoolMenuOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const schoolRef = useRef<HTMLDivElement>(null);
  const schoolButtonRef = useRef<HTMLButtonElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [showLogoText, setShowLogoText] = useState(true);

  const token = decodeToken();
  const profileImg = token?.profile_img ?? "";
  const name = token?.name ?? "";
  const isMinistryWorker = token?.ministry_worker;
  const isLifeCenterLeader = token?.life_center_leader;
  const isInstructor = token?.instructor;

  const isMemberRoute = location.pathname.startsWith("/member");
  const isSchoolRoute = location.pathname.includes("school-of-ministries");

  const isActive = (path: string) => location.pathname.startsWith(path);

  const memberNavItems = [
    { label: "Home", path: relativePath.member.dashboard },
    { label: "Marketplace", path: relativePath.member.market },
    ...(isLifeCenterLeader
      ? [{ label: "Life Center", path: relativePath.member.lifeCenter }]
      : []),
      { label: "Appointments", path: relativePath.member.appointments }
  ];

  const schoolItems = [
    { label: "Explore programs", path: relativePath.member.schoolOfMinistries.allPrograms },
    { label: "My learning", path: relativePath.member.schoolOfMinistries.myEnrolledPrograms },
    ...(isInstructor
      ? [{ label: "Instructor portal", path: relativePath.member.schoolOfMinistries.instructorPortal }]
      : []),
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMobileNavOpen(false);
    setIsMobileSchoolOpen(false);
    setIsSchoolMenuOpen(false);
    setIsProfileMenuOpen(false);
  };

  const handleChangePassword = () => {
    setIsProfileMenuOpen(false);
    navigate(relativePath.changePassword, {
      state: { from: location.pathname },
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  /* Close dropdowns & mobile nav on outside click */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (
        profileRef.current &&
        !profileRef.current.contains(target)
      ) {
        setIsProfileMenuOpen(false);
      }

      if (
        schoolRef.current &&
        !schoolRef.current.contains(target)
      ) {
        setIsSchoolMenuOpen(false);
      }

      if (
        isMobileNavOpen &&
        mobileNavRef.current &&
        !mobileNavRef.current.contains(target) &&
        !mobileToggleRef.current?.contains(target)
      ) {
        setIsMobileNavOpen(false);
        setIsMobileSchoolOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileNavOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileNavOpen) {
        setIsMobileNavOpen(false);
        setIsMobileSchoolOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isMobileNavOpen]);

  /* Measure header height and handle resize */
  useEffect(() => {
    const measureHeader = () => {
      if (headerRef.current) {
        const measuredHeight = headerRef.current.offsetHeight;
        setHeaderHeight(measuredHeight);
        document.documentElement.style.setProperty(
          "--app-header-height",
          `${measuredHeight}px`
        );
      }
    };

    measureHeader();

    window.addEventListener("resize", measureHeader);
    return () => {
      window.removeEventListener("resize", measureHeader);
      document.documentElement.style.setProperty("--app-header-height", "64px");
    };
  }, []);

  /* Control logo text visibility on small screens */
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");

    const handleChange = () => {
      setShowLogoText(mq.matches);
    };

    handleChange(); // initial check
    mq.addEventListener("change", handleChange);

    return () => mq.removeEventListener("change", handleChange);
  }, []);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 bg-white md:text-sm lg:text-md"
    >
      <div className="flex items-center justify-between px-4 ">
        {/* Left */}
        <div className="flex items-center gap-3">
          {isMemberRoute && (
            <button
              ref={mobileToggleRef}
              aria-label="Toggle navigation"
              aria-expanded={isMobileNavOpen}
              aria-controls="mobile-nav"
              onClick={() => setIsMobileNavOpen(v => !v)}
              className="xl:hidden p-2 rounded-md bg-primary/5 hover:bg-primary/10"
            >
              <Bars3Icon className="h-6"/>
            </button>
          )}

          {!isMemberRoute && (
            <button
              ref={mobileToggleRef}
              aria-label="Toggle navigation"
              aria-expanded={isMobileNavOpen}
              aria-controls="mobile-nav"
              onClick={handleShowNav}
              className="xl:hidden p-2 rounded-md bg-primary/5 hover:bg-primary/10"
            >
              <Squares2X2Icon className="h-6"/>
            </button>
          )}
          <ChurchLogo show={showLogoText} />

          
        </div>

        {/* Desktop Nav */}
        {isMemberRoute && (
          <nav className="hidden xl:flex items-center gap-2">
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
                ref={schoolButtonRef}
                aria-expanded={isSchoolMenuOpen}
                aria-haspopup="menu"
                onKeyDown={(e) => {
                  if (e.key === "Escape") setIsSchoolMenuOpen(false);
                  if (e.key === "Enter" || e.key === " ") setIsSchoolMenuOpen(v => !v);
                }}
                onClick={() => setIsSchoolMenuOpen(v => !v)}
                className={`px-4 py-2 rounded-md flex items-center gap-1 font-semibold ${
                  isSchoolRoute
                    ? "bg-primary text-white"
                    : "text-primary hover:bg-primary/10"
                }`}
              >
                School of Ministries
              </button>

              <AccessibleMenu
                isOpen={isSchoolMenuOpen}
                label="School of Ministries"
                onClose={() => setIsSchoolMenuOpen(false)}
                triggerRef={schoolButtonRef}
              >
                {schoolItems.map(item => (
                  <button
                    role="menuitem"
                    tabIndex={0}
                    key={item.label}
                    onClick={() => handleNavigate(item.path)}
                    className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-100 ${
                      isActive(item.path) ? "text-primary font-semibold" : ""
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </AccessibleMenu>
            </div>
          </nav>
        )}

        {/* Right */}
        <div ref={profileRef} className="flex items-center gap-3 relative">
          {isMemberRoute && <CartIcon />}

          <button
            ref={profileButtonRef}
            aria-haspopup="menu"
            aria-expanded={isProfileMenuOpen}
            onClick={() => setIsProfileMenuOpen(v => !v)}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100"
          >
            <ProfilePicture alt={name} src={profileImg} name={name} className="w-8 h-8" />
            <span className="hidden md:block font-semibold text-primary">
              {name}
            </span>
          </button>

          <AccessibleMenu
            isOpen={isProfileMenuOpen}
            label="Profile menu"
            onClose={() => setIsProfileMenuOpen(false)}
            triggerRef={profileButtonRef}
          >
            {isMinistryWorker && (
              <button
                role="menuitem"
                onClick={() =>
                  navigate(isMemberRoute ? "/home/dashboard" : "/member/dashboard")
                }
                className="w-full text-left px-4 py-3 hover:bg-gray-100"
              >
                {isMemberRoute ? "Go to admin portal" : "Go to member portal"}
              </button>
            )}
            <button
              role="menuitem"
              onClick={handleChangePassword}
              className="w-full text-left px-4 py-3 hover:bg-gray-100"
            >
              Change password
            </button>
            <button
              role="menuitem"
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 hover:bg-gray-100 text-red-600"
            >
              Log out
            </button>
          </AccessibleMenu>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMemberRoute && (
        <div
          ref={mobileNavRef}
          id="mobile-nav"
          aria-hidden={!isMobileNavOpen}
          style={{
            top: headerHeight,
          }}
          className={`xl:hidden fixed left-0 right-0 z-40 bg-white border-t
            transform transition-transform duration-300 ease-out shadow-lg
            ${isMobileNavOpen
              ? "translate-y-0 visible pointer-events-auto"
              : "-translate-y-full invisible pointer-events-none"
            }
          `}
        >
          <nav
            className="px-4 py-3 space-y-2 overflow-y-auto"
            style={{ maxHeight: `calc(100vh - ${headerHeight}px)` }}
          >
            {memberNavItems.map(item => (
              <button
                key={item.label}
                onClick={() => handleNavigate(item.path)}
                className="block w-full text-left px-4 py-3 rounded-md hover:bg-primary/10"
              >
                {item.label}
              </button>
            ))}

            {/* Mobile School of Ministries */}
            <div>
              <button
                onClick={() => setIsMobileSchoolOpen(v => !v)}
                aria-expanded={isMobileSchoolOpen}
                aria-controls="mobile-school-items"
                className="w-full flex justify-between items-center px-4 py-3 rounded-md hover:bg-primary/10 font-medium"
              >
                <span>School of Ministries</span>
                <svg
                  className={`h-4 w-4 transform transition-transform ${
                    isMobileSchoolOpen ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.06a.75.75 0 111.08 1.04l-4.25 4.65a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              <div
                id="mobile-school-items"
                className={`overflow-hidden transition-[max-height] duration-200 ${
                  isMobileSchoolOpen ? "max-h-96" : "max-h-0"
                }`}
              >
                {schoolItems.map(item => (
                  <button
                    key={item.label}
                    onClick={() => handleNavigate(item.path)}
                    className="block w-full text-left px-6 py-2 text-sm hover:bg-gray-100"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
