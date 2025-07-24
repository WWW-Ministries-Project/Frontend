import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { ProductDetailsCard } from "../components/cards/ProductDetailsCard";
import GridComponent from "@/pages/HomePage/Components/reusable/GridComponent";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import { useState } from "react";
import { HeaderControls } from "@/components/HeaderControls";
import { useNavigate, useParams } from "react-router-dom";
import { decodeQuery, encodeQuery } from "@/pages/HomePage/utils";
import { MarketHeader } from "../components/MarketHeader";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { ConfigurationsDrawer } from "../components/ConfigurationsDrawer";

export function MarketDetails() {
  // TODO: replace this with the products
  const products = [
    {
      id: 1,
      imageUrl:
        "https://gh.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/71/7371252/1.jpg?9683",
      title: "Casual T-shirt",
      status: "published",
      type: "T-shirt",
      category: "Apparel",
      price: 19.99,
      stock: 120,
    },
    {
      id: 2,
      imageUrl:
        "https://gh.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/31/5843451/1.jpg?0292",
      title: "Smart Watch",
      status: "published",
      type: "Watch",
      category: "Electronics",
      price: 59.99,
      stock: 45,
    },
    {
      id: 3,
      imageUrl:
        "https://gh.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/68/7509672/1.jpg?6990",
      title: "Bluetooth Speaker",
      status: "draft",
      type: "Speaker",
      category: "Audio",
      price: 34.99,
      stock: 0,
    },
    {
      id: 4,
      imageUrl:
        "https://gh.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/52/7032332/1.jpg?4172",
      title: "Gaming Mouse",
      status: "published",
      type: "Mouse",
      category: "Accessories",
      price: 24.49,
      stock: 80,
    },
    {
      id: 5,
      imageUrl:
        "https://gh.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/56/554213/1.jpg?1625",
      title: "Leather Wallet",
      status: "published",
      type: "Wallet",
      category: "Fashion",
      price: 29.99,
      stock: 60,
    },
    {
      id: 6,
      imageUrl:
        "https://gh.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/37/2425352/1.jpg?3655",
      title: "Running Shoes",
      status: "draft",
      type: "Shoes",
      category: "Footwear",
      price: 49.99,
      stock: 100,
    },

    {
      id: 8,
      imageUrl: "https://images.unsplash.com/photo-1510771463146-e89e6e86560e",
      title: "Backpack",
      status: "published",
      type: "Bag",
      category: "Travel",
      price: 39.99,
      stock: 30,
    },
  ];

  const [tab, setTab] = useState(`Products (${products.length})`);
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
    { id: "2", name: "Kids" },
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
          tabs={[`Products (${products.length})`, "Orders"]}
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
            className="size-12 border rounded-lg flex items-center justify-center cursor-pointer hover:bg-lightGray"
          >
            <Cog6ToothIcon className="w-10" />
          </div>
        }
      />

      <GridComponent
        columns={[]}
        data={tab !== "Orders" ? products : []}
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
