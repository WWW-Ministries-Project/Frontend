import LogoutIcon from "@/assets/sidebar/Logout";
import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "@/context/AuthWrapper";
import { sidebarIcons } from "../utils";
import { resolveHomePath } from "../utils/navPaths";
import { useSideNavTabs } from "./useSideNavTabs";

interface IProps {
  className?: string;
}

/**
 * Icon-only rail of top level modules. Each entry links to its module index,
 * which redirects to the first page the user can open. The pages inside a
 * module are listed by `SubNav`, not here.
 */
export const SideBar = ({ className }: IProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { tabs, activeTabNames } = useSideNavTabs();
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const handleLogOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const updateScrollFades = useCallback(() => {
    const scrollEl = scrollContainerRef.current;
    if (!scrollEl) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollEl;
    const canScroll = scrollHeight - clientHeight > 1;

    if (!canScroll) {
      setShowTopFade(false);
      setShowBottomFade(false);
      return;
    }

    const threshold = 4;
    setShowTopFade(scrollTop > threshold);
    setShowBottomFade(scrollTop + clientHeight < scrollHeight - threshold);
  }, []);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(updateScrollFades);
    const handleResize = () => updateScrollFades();
    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
    };
  }, [tabs, updateScrollFades]);

  return (
    <div
      className={`flex w-16 flex-col ${className || ""}`}
      style={{ height: "calc(100dvh - var(--app-header-height))" }}
      aria-label="Main navigation sidebar"
      role="navigation"
    >
      <div
        className={`sidebar-scroll-shell flex-1 ${
          showTopFade ? "sidebar-scroll-shell--top" : ""
        } ${showBottomFade ? "sidebar-scroll-shell--bottom" : ""}`}
      >
        <div
          ref={scrollContainerRef}
          onScroll={updateScrollFades}
          className="sidebar-scroll h-full overflow-y-auto overflow-x-hidden"
        >
          <div className="flex flex-col gap-2 py-4">
            {tabs.map((item) => {
              const IconComponent = sidebarIcons[item.name];
              if (!IconComponent) return null;

              const isActive = activeTabNames[item.name] || false;

              return (
                <div key={`${item.name}-${item.path}`}>
                  {isActive && (
                    <div className="flex justify-end">
                      <div className="scrollable-shape-top" />
                    </div>
                  )}
                  <NavLink
                    to={resolveHomePath(item.path)}
                    title={item.name}
                    aria-label={item.name}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex h-14 w-full items-center justify-center rounded-s-xl rounded-e-xl text-primary transition-[background-color,color] duration-200 lg:rounded-e-none ${
                      isActive
                        ? "sidebar-active-surface"
                        : "hover:bg-lightGray/40"
                    }`}
                  >
                    <IconComponent className="h-6 w-6 text-gray-600" />
                  </NavLink>
                  {isActive && (
                    <div className="flex justify-end">
                      <div className="scrollable-shape-bottom" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Fixed logout section at bottom */}
      <div className="flex-shrink-0 border-t border-gray-200">
        <button
          type="button"
          onClick={handleLogOut}
          title="Logout"
          aria-label="Logout"
          className="flex h-14 w-full items-center justify-center rounded-s-xl transition-colors hover:bg-lightGray/40"
        >
          <LogoutIcon className="h-6 w-6 flex-shrink-0 text-gray-600" />
        </button>
      </div>
    </div>
  );
};
