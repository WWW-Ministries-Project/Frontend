import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Cog6ToothIcon } from "@heroicons/react/24/outline";

import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { ProductDetailsCard } from "../components/cards/ProductDetailsCard";
import GridComponent from "@/pages/HomePage/Components/reusable/GridComponent";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import { HeaderControls } from "@/components/HeaderControls";
import { decodeQuery, encodeQuery } from "@/pages/HomePage/utils";
import { MarketHeader } from "../components/MarketHeader";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import { ConfigurationsDrawer } from "../components/ConfigurationsDrawer";
import EmptyState from "@/components/EmptyState";

export function MarketDetails() {
  const [tab, setTab] = useState("Products");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navigate = useNavigate();
  const { id: marketId } = useParams();
  const id = decodeQuery(String(marketId));

  const { data: market, refetch } = useFetch(api.fetch.fetchMarketById, {
    id,
  });

  // TODO: replace this with the original data
  const [categories, setCategories] = useState([
    { id: "1", name: "Adult" },
    { id: "2", name: "Books" },
  ]);

  const [types, setTypes] = useState([
    { id: "a", name: "T-shirt" },
    { id: "b", name: "Hoodie" },
  ]);

  const editProduct = (id: string) => {
    navigate("update-product/" + encodeQuery(id));
  };
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
        data={[]}
        displayedCount={10}
        filter={""}
        setFilter={() => {}}
        renderRow={(row) => (
          <ProductDetailsCard
            product={row.original}
            key={row.original.id}
            handleDelete={() => {}}
            handleEdit={(id) => editProduct(id)}
            handleView={() => {}}
          />
        )}
      />

      <EmptyState msg="No products found" />

      <ConfigurationsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        categories={categories}
        types={types}
        onUpdateCategories={setCategories}
        onUpdateTypes={setTypes}
      />
    </PageOutline>
  );
}
