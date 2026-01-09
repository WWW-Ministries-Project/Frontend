import React, { useEffect, useRef } from "react";
import {
  UserIcon,
  PhoneIcon,
  BuildingLibraryIcon,
  BriefcaseIcon,
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

interface TabSelectionProps<T extends string = string> {
  tabs: T[];
  selectedTab: T;
  onTabSelect: (tab: T) => void;
  tabIcons?: Partial<Record<T, React.ReactNode>>;
}

const TabSelection = <T extends string = string>({
  tabs,
  selectedTab,
  onTabSelect,
  tabIcons,
}: TabSelectionProps<T>) => {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const listRef = useRef<HTMLDivElement | null>(null);
  const [isOverflowing, setIsOverflowing] = React.useState(false);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const i = tabs.indexOf(selectedTab);
    if (e.key === "ArrowRight") {
      e.preventDefault();
      onTabSelect(tabs[(i + 1) % tabs.length]);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      onTabSelect(tabs[(i - 1 + tabs.length) % tabs.length]);
    }
  };

  useEffect(() => {
    const el = tabRefs.current[selectedTab];
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [selectedTab]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const checkOverflow = () => {
      setIsOverflowing(el.scrollWidth > el.clientWidth);
    };

    checkOverflow();

    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [tabs]);

  return (
    <div className="relative w-full flex items-center gap-2">
      {/* Left Arrow (desktop only) */}
      {isOverflowing && (
        <button
          type="button"
          aria-label="Previous tab"
          onClick={() => {
            const i = tabs.indexOf(selectedTab);
            onTabSelect(tabs[(i - 1 + tabs.length) % tabs.length]);
          }}
          className="
            hidden md:flex
            p-4 items-center justify-center
            rounded-lg border border-lightGray
            text-primary hover:bg-lightGray/50
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
          "
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
      )}
      <div
        ref={listRef}
        role="tablist"
        aria-label="Tabs"
        onKeyDown={onKeyDown}
        className="
          w-full
          border border-lightGray rounded-lg p-1
          flex flex-col md:flex-row
          gap-1 md:gap-2
          md:overflow-x-auto
        "
      >
        {tabs.map((tab) => {
          const active = selectedTab === tab;
          return (
            <button
              ref={(el) => (tabRefs.current[tab] = el)}
              key={tab}
              id={`tab-${tab}`}
              role="tab"
              aria-controls={`panel-${tab}`}
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onTabSelect(tab)}
              aria-label={tab}
              className={`
                w-full md:w-auto
                text-left md:text-center
                rounded-lg px-4 py-3 sm:px-4 sm:py-2.5
                select-none
                text-primary text-sm sm:text-base
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
                transition-colors snap-start
                ${active ? "bg-lightGray font-semibold" : "hover:bg-lightGray/60"}
                
              `}
            >
              <span className="flex items-center gap-2 text-xs lg:text-sm">
                {tabIcons?.[tab] && (
                  <span className="text-primary/70">{tabIcons[tab]}</span>
                )}
                <span className="capitalize">
                  {tab.toLowerCase()}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {/* Right Arrow (desktop only) */}
      {isOverflowing && (
        <button
          type="button"
          aria-label="Next tab"
          onClick={() => {
            const i = tabs.indexOf(selectedTab);
            onTabSelect(tabs[(i + 1) % tabs.length]);
          }}
          className="
            hidden md:flex
            p-4 items-center justify-center
            rounded-lg border border-lightGray
            text-primary hover:bg-lightGray/50
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
          "
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default TabSelection;

/* Optional global CSS for clean mobile scrollbars:
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
*/
