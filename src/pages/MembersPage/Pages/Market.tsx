import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import { ProductCard } from "@/pages/HomePage/pages/MarketPlace/components/cards/ProductCard";
import GridComponent from "@/pages/HomePage/Components/reusable/GridComponent";
import EmptyState from "@/components/EmptyState";

const Market = () => {
  const {
    data: products,
    refetch,
    loading,
  } = useFetch(api.fetch.fetchAllProducts);

  return (
    <div className="w-screen  text-white relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <div className=" bg-primary h-[10rem] flex items-center py-4 px-[1rem] lg:px-[4rem] xl:px-[8rem]">
        <div className="font-bold text-2xl">Marketplace</div>
      </div>

      <div className="w-full container mx-auto mb-10 pb-10 py-4 px-[1rem] lg:px-[4rem] xl:px-[8rem]">
        <GridComponent
          columns={10}
          data={products?.data || []}
          displayedCount={2}
          filter={""}
          setFilter={() => {}}
          renderRow={(row) => <ProductCard product={row.original} />}
        />

        {products?.data.length === 0 && <EmptyState msg="No products found" />}
      </div>
    </div>
  );
};

export default Market;
