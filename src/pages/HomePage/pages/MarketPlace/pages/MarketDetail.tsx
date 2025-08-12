import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Cog6ToothIcon } from "@heroicons/react/24/outline";

import EmptyState from "@/components/EmptyState";
import { HeaderControls } from "@/components/HeaderControls";
import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import GridComponent from "@/pages/HomePage/Components/reusable/GridComponent";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import {
  decodeQuery,
  encodeQuery,
  showDeleteDialog,
  showNotification,
} from "@/pages/HomePage/utils";
import { api, IProductType } from "@/utils";
import { ProductDetailsCard } from "../components/cards/ProductDetailsCard";
import { ConfigurationsDrawer } from "../components/ConfigurationsDrawer";
import { MarketHeader } from "../components/MarketHeader";

export function MarketDetails() {
  const [tab, setTab] = useState("Products");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navigate = useNavigate();
  const { id: marketId } = useParams();
  const id = decodeQuery(String(marketId));

  const { data: market } = useFetch(api.fetch.fetchMarketById, {
    id,
  });

  const { data: producttypes, refetch: refetchProductTypes } = useFetch(
    api.fetch.fetchProductTypes
  );

  const { data: productCategories, refetch: refetchProductCategories } =
    useFetch(api.fetch.fetchProductCategories);

  const { data: products , refetch} = useFetch(api.fetch.fetchProductsByMarket, {
    market_id: id,
  });

  const { executeDelete, success } = useDelete(api.delete.deleteProduct);

  const [categories, setCategories] = useState<IProductType[]>([]);
  const [types, setTypes] = useState<IProductType[]>([]);

  useEffect(() => {
    if (productCategories?.data) {
      setCategories(productCategories.data);
    }

    if (producttypes?.data) {
      setTypes(producttypes?.data);
    }

    if (success) {
      showNotification("Product deleted successfully", "success");
      refetch();
    }
  }, [productCategories?.data, producttypes?.data, success]);

  const editProduct = (id: string) => {
    navigate("edit-product/" + encodeQuery(id));
  };

  const handleRefetch = useCallback((section: "type" | "category") => {
    if (section === "type") {
      refetchProductTypes();
    } else {
      refetchProductCategories();
    }
  }, []);

  const handleDelete = useCallback(async (id: string, name: string) => {
    showDeleteDialog({ id, name }, async () => {
      await executeDelete({ product_id: id });
    });
  }, []);

  return (
    <PageOutline>
      <MarketHeader market={market?.data} />
      <div className="w-fit">
        <TabSelection
          tabs={[`Products`, "Orders"]}
          selectedTab={tab}
          onTabSelect={(tab) => setTab(tab)}
        />
      </div>
      <div className="flex items-end justify-end"></div>
      <HeaderControls
        title={tab}
        btnName={tab !== "Orders" ? "Add product" : ""}
        screenWidth={window.innerWidth}
        handleClick={() => navigate("create-product")}
        customIcon={
          <div
            onClick={() => setDrawerOpen(true)}
            className="size-12 border rounded-lg flex items-center justify-center cursor-pointer hover:shadow-sm"
          >
            <Cog6ToothIcon className="w-10" />
          </div>
        }
      />

      <GridComponent
        columns={[]}
        data={products?.data || []}
        displayedCount={100}
        filter={""}
        setFilter={() => {}}
        renderRow={(row) => (
          <ProductDetailsCard
            product={row.original}
            key={row.original.id}
            handleDelete={handleDelete}
            handleEdit={(id) => editProduct(id)}
            handleView={() => {}}
          />
        )}
      />

      {products?.data.length === 0 && <EmptyState msg="No products found" />}

      <ConfigurationsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        categories={categories}
        types={types}
        refetch={handleRefetch}
      />
    </PageOutline>
  );
}
