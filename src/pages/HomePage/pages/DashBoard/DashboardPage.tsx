import { useState } from "react";
import HeaderControls from "@/components/HeaderControls";
import PageOutline from "../../Components/PageOutline";
import TabSelection from "../../Components/reusable/TabSelection";
import Overview from "./pages/Overview";
import Analytics from "./pages/Analytics";
import Events from "./pages/Events";

const DashBoardPage = () => {
  const [selectedTab, setSelectedTab] = useState("Overview");

  // Handle the tab selection
  const handleTabSelect = (tab: string) => {
    setSelectedTab(tab);  // Set the selected tab to display the corresponding component
  };

  return (
    <div className="p-4">
        <PageOutline className="">
      <div>
        <HeaderControls
          title="Dashboard"
          tableView={false}
          handleViewMode={() => {}}
          showFilter={false}
          showSubtitle={true}
          subtitle="Welcome back, Pastor Adam"
        />
        

        <section>
          <div className="flex mt-2 mb-6">
            <TabSelection
              tabs={["Overview", "Analytics", "Events"]}
              selectedTab={selectedTab}
              onTabSelect={handleTabSelect}  // Use the handleTabSelect function to update the selected tab
            />
          </div>
        </section>

        <section>
          {/* Dynamically render the content based on the selected tab */}
          {selectedTab === "Overview" && <Overview />}
          {selectedTab === "Analytics" && <Analytics />}
          {selectedTab === "Events" && <Events />}
        </section>
      </div>
    </PageOutline>
    </div>
  );
};

export default DashBoardPage;
