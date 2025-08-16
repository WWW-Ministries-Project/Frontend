import { matchRoutes, Outlet, useNavigate } from "react-router-dom";

import { MarketLayout } from "../layouts/MarketLayout";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import { routes } from "@/routes/appRoutes";

const Market = () => {
  const naviggate = useNavigate();

  const handleSelectedTab = (tab: string) => {
    if (tab === "Products") {
      naviggate("/member/market");
    } else {
      naviggate(`${tab.toLowerCase()}`);
    }
  };

  const matches = matchRoutes(routes, location);
  const routeName = matches?.[matches.length - 1]?.route.name;

  return (
    <MarketLayout title={routeName}>
      <div className="bg-white p-4 space-y-5 container mx-auto">
        <div className="w-fit">
          <TabSelection
            tabs={["Products", "Carts", "Orders"]}
            onTabSelect={handleSelectedTab}
            selectedTab={routeName || "Products"}
          />
        </div>

        <Outlet />
      </div>
    </MarketLayout>
  );
};

export default Market;
