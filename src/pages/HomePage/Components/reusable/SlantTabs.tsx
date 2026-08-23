import React, { useRef } from "react";

interface SlantTabsProps<T extends string = string> {
  tabs: T[];
  selectedTab: T;
  onTabSelect: (tab: T) => void;
  /** Optional icon per tab, rendered beside the label inside the trapezoid. */
  tabIcons?: Partial<Record<T, React.ReactNode>>;
  /** Optional short display text per tab; falls back to the tab id itself.
   * Useful when the tab id is a long canonical string (e.g. state keys
   * shared with existing conditional-render checks) but the slant shape
   * needs a shorter label to stay legible. */
  tabLabels?: Partial<Record<T, string>>;
  /** Extra classes on the outer wrapper, e.g. spacing overrides per page. */
  className?: string;
}

// Isosceles-trapezoid tab shape: wide bottom, narrower rounded top, sharp
// bottom corners so it sits flush against the baseline rule. Drawn in a
// 100x48 viewBox with preserveAspectRatio="none" so it stretches to fit
// whatever width the label needs.
const TAB_PATH =
  "M 0 48 L 11.2 9.6 Q 14 0 24 0 L 76 0 Q 86 0 88.8 9.6 L 100 48 Z";

const getTabDomId = (tab: string) =>
  tab
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Angled/slanted tab bar (see design mock: black active tab, white inactive
 * tabs, thick baseline rule). Each tab overlaps the next — z-index is
 * position-based (leftmost always frontmost), not selection-based, so this
 * fits row-of-short-tabs use cases, not every `TabSelection` use case (no
 * overflow-chevron/mobile-stack handling). See
 * docs/superpowers/specs/2026-08-22-slant-tabs-design.md.
 */
const SlantTabs = <T extends string = string>({
  tabs,
  selectedTab,
  onTabSelect,
  tabIcons,
  tabLabels,
  className = "",
}: SlantTabsProps<T>) => {
  const listRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <div className={`w-full border-b-[3px] border-black ${className}`}>
      <div
        ref={listRef}
        role="tablist"
        aria-label="Tabs"
        onKeyDown={onKeyDown}
        className="flex overflow-x-auto"
      >
        {tabs.map((tab, idx) => {
          const active = selectedTab === tab;
          const tabDomId = getTabDomId(tab);

          return (
            <button
              key={tab}
              id={`tab-${tabDomId}`}
              role="tab"
              type="button"
              aria-controls={`panel-${tabDomId}`}
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onTabSelect(tab)}
              aria-label={tab}
              style={{
                zIndex: tabs.length - idx,
                marginLeft: idx === 0 ? 0 : "-14px",
              }}
              className="group relative flex h-11 min-w-[120px] shrink-0 items-center justify-center px-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
            >
              <svg
                className={`pointer-events-none absolute inset-0 h-full w-full stroke-borderGray ${
                  active ? "fill-black" : "fill-white"
                }`}
                viewBox="0 0 100 48"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d={TAB_PATH}
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <span
                className={`relative z-10 flex select-none items-center gap-1.5 whitespace-nowrap text-xs font-semibold uppercase tracking-wide transition-colors sm:text-sm ${
                  active ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                }`}
              >
                {tabIcons?.[tab] && <span aria-hidden="true">{tabIcons[tab]}</span>}
                {tabLabels?.[tab] ?? tab}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SlantTabs;
