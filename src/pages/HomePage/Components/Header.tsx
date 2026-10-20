import { Fragment, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import ChurchLogo from "@/components/ChurchLogo";
import { ProfilePicture } from "@/components";
import { ThemeModeSelector } from "@/components/ThemeModeSelector";
import { CartIcon } from "../pages/MarketPlace/components/cart/CartIcon";
import { HeaderNotificationMenu } from "@/features/notifications/HeaderNotificationMenu";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { ALL_BRANCHES, useBranchStore } from "@/store/useBranchStore";

import { useAuth } from "../../../context/AuthWrapper";
import { decodeToken } from "../../../utils/helperFunctions";
import { relativePath } from "@/utils";
import { activeMenuPath, learnerMenu } from "@/pages/MembersPage/Pages/school/learnerPaths";
import { Bars3Icon, ChevronDownIcon, Squares2X2Icon } from "@heroicons/react/24/outline";

interface AccessibleMenuProps {
  isOpen: boolean;
  label: string;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  align?: "left" | "right";
  children: React.ReactNode;
}

const AccessibleMenu = ({
  isOpen,
  label,
  onClose,
  triggerRef,
  align = "left",
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

  const alignmentClass = align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left";

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`absolute top-full mt-2 z-50 w-56 max-w-[calc(100vw-1rem)] bg-white border rounded-md shadow-lg ${alignmentClass}`}
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
  const { canView } = useAccessControl();
  const branches = useBranchStore((state) => state.branches);
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  const setActiveBranchId = useBranchStore((state) => state.setActiveBranchId);

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMobileSchoolOpen, setIsMobileSchoolOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSchoolMenuOpen, setIsSchoolMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isMarketMenuOpen, setIsMarketMenuOpen] = useState(false);
  const [isMobileMarketOpen, setIsMobileMarketOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const schoolRef = useRef<HTMLDivElement>(null);
  const schoolButtonRef = useRef<HTMLButtonElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const marketRef = useRef<HTMLDivElement>(null);
  const marketButtonRef = useRef<HTMLButtonElement>(null);
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
  // Community is members-only; guests never see the entry.
  const isGuest = token?.is_guest === true;
  const isMemberRoute = location.pathname.startsWith("/member");
  const isSchoolRoute = location.pathname.includes("school-of-ministries");
  const isMoreRoute =
    location.pathname.startsWith(relativePath.member.giving) ||
    location.pathname.startsWith(relativePath.member.pledges) ||
    location.pathname.startsWith(relativePath.member.rides) ||
    location.pathname.startsWith(relativePath.member.lifeCenter) ||
    location.pathname.startsWith(relativePath.member.appointments);
  const adminAIPath = `${relativePath.home.main}/${relativePath.home.ai}`;
  const showAdminAiEntry = !isMemberRoute && canView("AI");

  const isActive = (path: string) => location.pathname.startsWith(path);

  // Marketplace sub-sections live in a header dropdown (no in-page tabs).
  const marketBasePath = relativePath.member.market.replace(/\/$/, "");
  const isMarketRoute = location.pathname.startsWith(marketBasePath);
  const isMarketOrdersRoute = location.pathname.startsWith(relativePath.member.orders);
  const marketItems = [
    { label: "Shop", path: relativePath.member.market, active: isMarketRoute && !isMarketOrdersRoute },
    { label: "My orders", path: relativePath.member.orders, active: isMarketOrdersRoute },
  ];

  type MemberNavItem = { label: string; path: string; dropdown?: "market" };
  const memberNavItems: MemberNavItem[] = [
    { label: "Home", path: relativePath.member.dashboard },
    ...(!isGuest
      ? [{ label: "Community", path: relativePath.member.community }]
      : []),
    { label: "Marketplace", path: relativePath.member.market, dropdown: "market" as const },
  ];

  const schoolItems = learnerMenu(Boolean(isInstructor));
  const activeSchoolPath = activeMenuPath(
    location.pathname,
    schoolItems.map((item) => item.path)
  );

  // Everything a member can reach that is not one of the top-level tabs. Kept
  // as a list so the desktop dropdown and the mobile accordion cannot drift.
  type MoreItem = { label: string; path: string; group?: string; exact?: boolean };
  const lcPath = relativePath.member.lifeCenter;
  const moreItems: MoreItem[] = [
    { label: "Giving", path: relativePath.member.giving },
    { label: "Pledges", path: relativePath.member.pledges },
    { label: "Appointments", path: relativePath.member.appointments },
    // Ride to church is members-only, like Community.
    ...(!isGuest
      ? [{ label: "Ride to church", path: relativePath.member.rides }]
      : []),
    // Life center leaders get their center's sections, as a group.
    ...(isLifeCenterLeader
      ? [
          { label: "Overview", path: lcPath, group: "My life center", exact: true },
          { label: "Meetings", path: `${lcPath}/meetings`, group: "My life center" },
          { label: "Souls won", path: `${lcPath}/souls-won`, group: "My life center" },
          { label: "Members", path: `${lcPath}/members`, group: "My life center" },
          { label: "Analytics", path: `${lcPath}/analytics`, group: "My life center" },
        ]
      : []),
  ];
  const isMoreItemActive = (item: MoreItem) =>
    item.exact ? location.pathname.replace(/\/$/, "") === item.path : isActive(item.path);
  /** Group heading to show before this item, if it starts a group. */
  const groupStart = (index: number) => {
    const group = moreItems[index].group;
    return group && moreItems[index - 1]?.group !== group ? group : null;
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMobileNavOpen(false);
    setIsMobileSchoolOpen(false);
    setIsMobileMoreOpen(false);
    setIsMobileMarketOpen(false);
    setIsSchoolMenuOpen(false);
    setIsMoreMenuOpen(false);
    setIsMarketMenuOpen(false);
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

      if (moreRef.current && !moreRef.current.contains(target)) {
        setIsMoreMenuOpen(false);
      }

      if (marketRef.current && !marketRef.current.contains(target)) {
        setIsMarketMenuOpen(false);
      }

      if (
        isMobileNavOpen &&
        mobileNavRef.current &&
        !mobileNavRef.current.contains(target) &&
        !mobileToggleRef.current?.contains(target)
      ) {
        setIsMobileNavOpen(false);
        setIsMobileSchoolOpen(false);
        setIsMobileMoreOpen(false);
        setIsMobileMarketOpen(false);
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
        setIsMobileMoreOpen(false);
        setIsMobileMarketOpen(false);
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
      className="sticky top-0 z-[120] md:text-sm lg:text-md"
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
            {memberNavItems.map(item =>
              item.dropdown === "market" ? (
                <div key={item.label} ref={marketRef} className="relative">
                  <button
                    ref={marketButtonRef}
                    aria-expanded={isMarketMenuOpen}
                    aria-haspopup="menu"
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setIsMarketMenuOpen(false);
                      if (e.key === "Enter" || e.key === " ") setIsMarketMenuOpen(v => !v);
                    }}
                    onClick={() => setIsMarketMenuOpen(v => !v)}
                    className={`px-4 py-2 rounded-md flex items-center gap-1 font-semibold ${
                      isMarketRoute
                        ? "bg-primary text-white"
                        : "text-primary hover:bg-primary/10"
                    }`}
                  >
                    {item.label}
                    <ChevronDownIcon
                      className={`h-4 w-4 transition-transform ${isMarketMenuOpen ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>

                  <AccessibleMenu
                    isOpen={isMarketMenuOpen}
                    label="Marketplace"
                    onClose={() => setIsMarketMenuOpen(false)}
                    triggerRef={marketButtonRef}
                  >
                    {marketItems.map(sub => (
                      <button
                        role="menuitem"
                        tabIndex={0}
                        key={sub.label}
                        onClick={() => handleNavigate(sub.path)}
                        aria-current={sub.active ? "page" : undefined}
                        className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-100 ${
                          sub.active ? "text-primary font-semibold" : ""
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </AccessibleMenu>
                </div>
              ) : (
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
              )
            )}

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
                    aria-current={activeSchoolPath === item.path ? "page" : undefined}
                    className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-100 ${
                      activeSchoolPath === item.path ? "text-primary font-semibold" : ""
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </AccessibleMenu>
            </div>

            <div ref={moreRef} className="relative">
              <button
                ref={moreButtonRef}
                aria-expanded={isMoreMenuOpen}
                aria-haspopup="menu"
                onKeyDown={(e) => {
                  if (e.key === "Escape") setIsMoreMenuOpen(false);
                  if (e.key === "Enter" || e.key === " ") setIsMoreMenuOpen(v => !v);
                }}
                onClick={() => setIsMoreMenuOpen(v => !v)}
                className={`px-4 py-2 rounded-md flex items-center gap-1 font-semibold ${
                  isMoreRoute
                    ? "bg-primary text-white"
                    : "text-primary hover:bg-primary/10"
                }`}
              >
                More
              </button>

              <AccessibleMenu
                isOpen={isMoreMenuOpen}
                label="More"
                onClose={() => setIsMoreMenuOpen(false)}
                triggerRef={moreButtonRef}
              >
                {moreItems.map((item, index) => (
                  <Fragment key={item.path}>
                    {groupStart(index) && (
                      <p
                        role="presentation"
                        className="mt-1 border-t border-[#E5E7EB] px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]"
                      >
                        {groupStart(index)}
                      </p>
                    )}
                    <button
                      role="menuitem"
                      tabIndex={0}
                      onClick={() => handleNavigate(item.path)}
                      className={`block w-full text-left py-3 text-sm hover:bg-gray-100 ${item.group ? "pl-6 pr-4" : "px-4"} ${
                        isMoreItemActive(item) ? "text-primary font-semibold" : ""
                      }`}
                    >
                      {item.label}
                    </button>
                  </Fragment>
                ))}
              </AccessibleMenu>
            </div>
          </nav>
        )}
        {showAdminAiEntry && (
          <nav className="flex items-center">
            <button
              onClick={() => handleNavigate(adminAIPath)}
              className={`px-4 py-2 rounded-md font-semibold transition ${
                isActive(adminAIPath)
                  ? "bg-primary text-white"
                  : "text-primary hover:bg-primary/10"
              }`}
            >
              AI
            </button>
          </nav>
        )}

        {/* Right */}
        <div ref={profileRef} className="flex items-center gap-3 relative">
          {!isMemberRoute && branches.length > 1 && (
            <label className="hidden items-center gap-2 text-xs font-semibold text-primaryGray md:flex">
              <span className="sr-only">Branch</span>
              <select
                className="max-w-[12rem] rounded-md border border-lightGray bg-white px-3 py-2 text-sm font-semibold text-primary outline-none focus:border-primary"
                value={
                  activeBranchId === ALL_BRANCHES
                    ? ALL_BRANCHES
                    : String(activeBranchId)
                }
                onChange={(event) => {
                  const value = event.target.value;
                  setActiveBranchId(
                    value === ALL_BRANCHES ? ALL_BRANCHES : Number(value)
                  );
                }}
                aria-label="Filter by branch"
              >
                <option value={ALL_BRANCHES}>All branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {isMemberRoute && <CartIcon />}
          <HeaderNotificationMenu isMemberRoute={isMemberRoute} />

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
            align="right"
          >
            <div className="border-b border-lightGray px-4 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primaryGray">
                Appearance
              </p>
              <ThemeModeSelector className="w-full min-w-[140px]" />
            </div>
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
            {memberNavItems.map(item =>
              item.dropdown === "market" ? (
                <div key={item.label}>
                  <button
                    onClick={() => setIsMobileMarketOpen(v => !v)}
                    aria-expanded={isMobileMarketOpen}
                    aria-controls="mobile-market-items"
                    className="w-full flex justify-between items-center px-4 py-3 rounded-md hover:bg-primary/10 font-medium"
                  >
                    <span>{item.label}</span>
                    <svg
                      className={`h-4 w-4 transform transition-transform ${
                        isMobileMarketOpen ? "rotate-180" : ""
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
                    id="mobile-market-items"
                    className={`overflow-hidden transition-[max-height] duration-200 ${
                      isMobileMarketOpen ? "max-h-96" : "max-h-0"
                    }`}
                  >
                    {marketItems.map(sub => (
                      <button
                        key={sub.label}
                        onClick={() => handleNavigate(sub.path)}
                        aria-current={sub.active ? "page" : undefined}
                        className={`block w-full text-left px-6 py-2 text-sm hover:bg-gray-100 ${
                          sub.active ? "text-primary font-semibold" : ""
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  key={item.label}
                  onClick={() => handleNavigate(item.path)}
                  className="block w-full text-left px-4 py-3 rounded-md hover:bg-primary/10"
                >
                  {item.label}
                </button>
              )
            )}

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
                    aria-current={activeSchoolPath === item.path ? "page" : undefined}
                    className={`block w-full text-left px-6 py-2 text-sm hover:bg-gray-100 ${
                      activeSchoolPath === item.path ? "text-primary font-semibold" : ""
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile More */}
            <div>
              <button
                onClick={() => setIsMobileMoreOpen(v => !v)}
                aria-expanded={isMobileMoreOpen}
                aria-controls="mobile-more-items"
                className="w-full flex justify-between items-center px-4 py-3 rounded-md hover:bg-primary/10 font-medium"
              >
                <span>More</span>
                <svg
                  className={`h-4 w-4 transform transition-transform ${
                    isMobileMoreOpen ? "rotate-180" : ""
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
                id="mobile-more-items"
                className={`overflow-hidden transition-[max-height] duration-200 ${
                  isMobileMoreOpen ? "max-h-[640px]" : "max-h-0"
                }`}
              >
                {moreItems.map((item, index) => (
                  <Fragment key={item.path}>
                    {groupStart(index) && (
                      <p className="px-6 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                        {groupStart(index)}
                      </p>
                    )}
                    <button
                      onClick={() => handleNavigate(item.path)}
                      className={`block w-full text-left py-2 text-sm hover:bg-gray-100 ${item.group ? "pl-8 pr-6" : "px-6"} ${
                        isMoreItemActive(item) ? "font-semibold text-primary" : ""
                      }`}
                    >
                      {item.label}
                    </button>
                  </Fragment>
                ))}
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
