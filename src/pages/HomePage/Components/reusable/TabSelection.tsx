interface TabSelectionProps<T extends string = string> {
  tabs: T[];
  selectedTab: T;
  onTabSelect: (tab: T) => void;
}

const TabSelection = <T extends string = string>({
  tabs,
  selectedTab,
  onTabSelect,
}: TabSelectionProps<T>) => {
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
    <div className="w-full min-w-0"> {/* important for horizontal scrolling */}
      <div
        role="tablist"
        aria-label="Tabs"
        onKeyDown={onKeyDown}
        className="
          w-full min-w-0
          border border-lightGray rounded-lg p-1
          flex flex-nowrap sm:flex-wrap gap-1 sm:gap-2
          overflow-x-auto sm:overflow-visible
          snap-x snap-mandatory scroll-px-3
          no-scrollbar
        "
      >
        {tabs.map((tab) => {
          const active = selectedTab === tab;
          return (
            <button
              key={tab}
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onTabSelect(tab)}
              className={`
                shrink-0 whitespace-nowrap select-none
                rounded-lg px-3 sm:px-4 py-2 sm:py-2.5
                text-primary text-sm sm:text-base
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
                transition-colors snap-start
                ${active ? "bg-lightGray font-semibold" : "hover:bg-lightGray/60"}
                min-w-[7.5rem] sm:min-w-0
              `}
            >
              <span className="capitalize">{tab.toLowerCase()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabSelection;

/* Optional global CSS for clean mobile scrollbars:
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
*/
