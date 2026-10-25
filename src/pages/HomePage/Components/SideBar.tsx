import LogoutIcon from "@/assets/sidebar/Logout";
import {
  type FocusEvent,
  Fragment,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "@/context/AuthWrapper";
import { sidebarIcons } from "../utils";
import { resolveHomePath } from "../utils/navPaths";
import { useSideNavTabs } from "./useSideNavTabs";

// Keep in sync with the list's `pt-8`, `h-14` items, `gap-2` and the
// divider's `h-px my-1`.
const NAV_PADDING_TOP = 32;
const NAV_ITEM_STRIDE = 56 + 8;
const NAV_DIVIDER_STRIDE = 1 + 4 * 2 + 8;

interface IProps {
  className?: string;
}

interface TooltipState {
  label: string;
  top: number;
  left: number;
}

/**
 * Name label shown beside a rail icon. Portalled to <body> with fixed
 * positioning because the rail's scroll container clips horizontal overflow.
 */
const RailTooltip = ({ label, top, left }: TooltipState) =>
  createPortal(
    <div
      aria-hidden="true"
      className="sidebar-tooltip pointer-events-none fixed z-[300] whitespace-nowrap rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-[#fff] shadow-lg"
      style={{ top, left }}
    >
      <span className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-primary" />
      {label}
    </div>,
    document.body
  );

/**
 * Icon-only rail of top level modules. Each entry links to its module index,
 * which redirects to the first page the user can open. The pages inside a
 * module are listed by `SubNav`, not here.
 */
export const SideBar = ({ className }: IProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { groups, tabs, activeTabNames } = useSideNavTabs();
  const [showBottomFade, setShowBottomFade] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const hideTooltip = useCallback(() => setTooltip(null), []);

  const tooltipHandlers = (label: string) => {
    const show = (event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltip({ label, top: rect.top + rect.height / 2, left: rect.right + 8 });
    };
    return {
      onMouseEnter: show,
      onFocus: show,
      onMouseLeave: hideTooltip,
      onBlur: hideTooltip,
    };
  };

  const navTabs = useMemo(
    () =>
      groups
        .map((group) =>
          group.flatMap((item) => {
            const IconComponent = sidebarIcons[item.name];
            return IconComponent ? [{ item, IconComponent }] : [];
          })
        )
        .filter((group) => group.length > 0)
        .flatMap((group, groupIndex) =>
          group.map((tab, indexInGroup) => ({
            ...tab,
            groupIndex,
            startsGroup: groupIndex > 0 && indexInGroup === 0,
          }))
        ),
    [groups]
  );
  const activeIndex = navTabs.findIndex(
    ({ item }) => activeTabNames[item.name]
  );
  const activeDividers = activeIndex < 0 ? 0 : navTabs[activeIndex].groupIndex;

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
      setShowBottomFade(false);
      return;
    }

    const threshold = 4;
    setShowBottomFade(scrollTop + clientHeight < scrollHeight - threshold);
  }, []);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(updateScrollFades);
    const handleResize = () => {
      updateScrollFades();
      hideTooltip();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
    };
  }, [tabs, updateScrollFades, hideTooltip]);

  return (
    <div
      className={`flex w-16 flex-col ${className || ""}`}
      style={{ height: "calc(100dvh - var(--app-header-height))" }}
      aria-label="Main navigation sidebar"
      role="navigation"
    >
      {/* Fixed, invisible top edge: icons scroll under it rather than fading
          out. Offset by the content panel's corner radius so the clip starts
          below its rounded corner. */}
      <div
        className={`sidebar-scroll-shell mt-[var(--radius-lg)] flex-1 border-t border-transparent ${
          showBottomFade ? "sidebar-scroll-shell--bottom" : ""
        }`}
      >
        <div
          ref={scrollContainerRef}
          onScroll={() => {
            updateScrollFades();
            hideTooltip();
          }}
          className="sidebar-scroll no-scrollbar h-full overflow-y-auto overflow-x-hidden"
        >
          <div className="relative flex flex-col gap-2 pb-4 pt-8">
            <div
              aria-hidden="true"
              className="sidebar-tab-indicator"
              style={{
                top:
                  NAV_PADDING_TOP +
                  Math.max(activeIndex, 0) * NAV_ITEM_STRIDE +
                  activeDividers * NAV_DIVIDER_STRIDE,
                opacity: activeIndex < 0 ? 0 : 1,
              }}
            />
            {navTabs.map(({ item, IconComponent, startsGroup }, index) => {
              const isActive = index === activeIndex;

              return (
                <Fragment key={`${item.name}-${item.path}`}>
                  {startsGroup && (
                    <div
                      aria-hidden="true"
                      className="mx-3.5 my-1 h-px flex-shrink-0 bg-lightGray"
                    />
                  )}
                  <NavLink
                    to={resolveHomePath(item.path)}
                    aria-label={item.name}
                    {...tooltipHandlers(item.name)}
                    aria-current={isActive ? "page" : undefined}
                    className="group relative z-[3] flex h-14 w-full items-center justify-center text-primary"
                  >
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-xl transition-[background-color,transform] motion-reduce:transition-none ${
                        isActive
                          ? "scale-[1.06]"
                          : "scale-100 group-hover:bg-lightGray/40"
                      }`}
                      style={{
                        transitionDuration: "200ms, 300ms",
                        transitionTimingFunction:
                          "ease, cubic-bezier(0.34, 1.4, 0.64, 1)",
                      }}
                    >
                      <IconComponent
                        className={`h-6 w-6 text-gray-600 transition-opacity duration-200 ${
                          isActive ? "opacity-100" : "opacity-[0.72]"
                        }`}
                      />
                    </span>
                  </NavLink>
                </Fragment>
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
          aria-label="Logout"
          {...tooltipHandlers("Logout")}
          className="flex h-14 w-full items-center justify-center rounded-s-xl transition-colors hover:bg-lightGray/40"
        >
          <LogoutIcon className="h-6 w-6 flex-shrink-0 text-gray-600" />
        </button>
      </div>

      {tooltip && <RailTooltip {...tooltip} />}
    </div>
  );
};
