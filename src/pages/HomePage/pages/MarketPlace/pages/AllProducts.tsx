import { useSearchParams } from "react-router-dom";

import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { ProductsPanel } from "../components/Products/ProductsPanel";
import { toProductTab } from "../components/Products/productTabs";

/** Admin products list across every market (route /home/market-place/products). */
export const AllProducts = () => {
  const [params] = useSearchParams();
  const initialTab = toProductTab(params.get("tab"));
  return (
    <PageOutline>
      <ProductsPanel
        key={initialTab}
        initialTab={initialTab}
        header={{
          title: "Products",
          subtitle: "Everything listed across your markets",
        }}
      />
    </PageOutline>
  );
};
