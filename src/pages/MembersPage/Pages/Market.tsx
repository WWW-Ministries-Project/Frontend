import { matchRoutes, Outlet, useLocation, useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const location = useLocation();
  const { setProducts, setLoading } = useStore();

  const handleSelectedTab = (tab: string) => {
    if (tab === "Products") {
      navigate("/member/market");
    } else {
      navigate(`${tab.toLowerCase()}`);
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

    
  }, [loading, products, setLoading, setProducts]);

  const matches = matchRoutes(routes, location);
  const routeName = matches?.[matches.length - 1]?.route.name;

  return (
    <MarketLayout title={routeName}>
      <div className="bg-white p-6 space-y-5 container mx-auto">
        <div className="p-6 space-y-5">
          <div className="w-fit">
          <TabSelection
            tabs={["Products", "Carts", "Orders"]}
            onTabSelect={handleSelectedTab}
            selectedTab={routeName || "Products"}
          />
        </div>

        <Outlet />
        </div>
      </div>
    </MarketLayout>
  );
};

export default Market;
