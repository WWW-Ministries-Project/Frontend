interface TabSelectionProps<T extends string = string> {
  tabs: T[];
  selectedTab: T;
  onTabSelect: (tab: T) => void;
}

const TabSelection = <T extends string = string>({ 
  tabs, 
  selectedTab, 
  onTabSelect 
}: TabSelectionProps<T>) => {
  return (
    <div className="border border-lightGray flex gap-2 rounded-lg p-1">
      {tabs.map((tab) => (
        <div
          className={`rounded-lg text-center text-primary p-2 flex items-center justify-center cursor-pointer min-w-40 
            ${selectedTab === tab ? "bg-lightGray font-semibold" : ""}
          `}
          onClick={() => onTabSelect(tab)}
          key={tab}
        >
          <div className="capitalize">
            {tab.toLowerCase()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TabSelection;