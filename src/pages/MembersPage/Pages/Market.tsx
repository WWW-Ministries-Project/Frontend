import { matchRoutes, Outlet, useNavigate } from "react-router-dom";

import { useFetch } from "@/CustomHooks/useFetch";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import { routes } from "@/routes/appRoutes";
import { api } from "@/utils";
import { MarketLayout } from "../layouts/MarketLayout";
import { useStore } from "@/store/useStore";
import { useEffect } from "react";

const Market = () => {
  const {
    data: products,
    loading,
  } = useFetch(api.fetch.fetchAllProducts);
  const naviggate = useNavigate();
  const { setProducts, setLoading } = useStore();

  const handleSelectedTab = (tab: string) => {
    if (tab === "Products") {
      naviggate("/member/market");
    } else {
      naviggate(`${tab.toLowerCase()}`);
    }
  };

  useEffect(() => {
    if (loading) {
      setLoading(true);
    } else {
      setLoading(false);
    }
    if (products) {
      setProducts(products.data);
    }

    
  }, [loading, products]);

  const matches = matchRoutes(routes, location);
  const routeName = matches?.[matches.length - 1]?.route.name;

  return (
    <MarketLayout title={routeName}>
      <div className="bg-white p-6 space-y-5 container mx-auto">
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
