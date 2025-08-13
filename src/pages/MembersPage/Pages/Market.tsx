import { useNavigate } from "react-router-dom";

import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import { ProductCard } from "@/pages/HomePage/pages/MarketPlace/components/cards/ProductCard";
import GridComponent from "@/pages/HomePage/Components/reusable/GridComponent";
import EmptyState from "@/components/EmptyState";
import { MarketLayout } from "../layouts/MarketLayout";
import { encodeQuery } from "@/pages/HomePage/utils";

const Market = () => {
  const { data: products } = useFetch(api.fetch.fetchAllProducts);

  const navigate = useNavigate();

  const handleViewProduct = (productId: string) => {
    navigate(`/member/product/${encodeQuery(productId)}`);
  };

  return (
    <MarketLayout>
      <GridComponent
        columns={10}
        data={products?.data || []}
        displayedCount={2}
        filter={""}
        setFilter={() => {}}
        renderRow={(row) => (
          <ProductCard
            product={row.original}
            handleViewProduct={handleViewProduct}
          />
        )}
      />

      {products?.data.length === 0 && <EmptyState msg="No products found" />}
    </MarketLayout>
  );
};

export default Market;
