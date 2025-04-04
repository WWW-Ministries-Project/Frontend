interface TabSelectionProps {
    tabs: string[];
    selectedTab: string;
    onTabSelect: (tab: string) => void;
  }
  
  const TabSelection: React.FC<TabSelectionProps> = ({ tabs, selectedTab, onTabSelect }) => {
    return (
      <div className="border border-lightGray flex gap-2 rounded-lg p-1">
        {tabs.map((tab) => (
          <div
            className={`rounded-lg text-center text-dark900 p-2 flex items-center justify-center cursor-pointer w-40 
              ${selectedTab === tab ? "bg-lightGray font-semibold" : ""}
            `}
            onClick={() => onTabSelect(tab)}
            key={tab}
          >
            {tab}
          </div>
        ))}
      </div>
    );
  };
  
  export default TabSelection;
  