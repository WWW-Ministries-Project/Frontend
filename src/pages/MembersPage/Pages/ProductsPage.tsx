import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import { ProductCard } from "@/pages/HomePage/pages/MarketPlace/components/cards/ProductCard";
import GridComponent from "@/pages/HomePage/Components/reusable/GridComponent";
import EmptyState from "@/components/EmptyState";
import { encodeQuery } from "@/pages/HomePage/utils";
import { useNavigate } from "react-router-dom";

export default function ProductsPage() {
  const { data: products } = useFetch(api.fetch.fetchAllProducts);

  const navigate = useNavigate();

  const handleViewProduct = (productId: string) => {
    navigate(`/member/market/product/${encodeQuery(productId)}`);
  };
  return (
    <>
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
            key={row.original.id}
          />
        )}
      />

      {(products?.data || []).length === 0 && (
        <EmptyState msg="No products found" />
      )}
    </>
  );
}
