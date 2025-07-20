import { HeaderControls } from "@/components/HeaderControls";
import PageOutline from "../../Components/PageOutline";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import GridComponent from "../../Components/reusable/GridComponent";
import { MarketCard } from "./components/MarketCard";

export function MarketPlace() {
  const { data: markets } = useFetch(api.fetch.fetchMarkets);

  return (
    <PageOutline>
      <HeaderControls
        title="Marketplace Management"
        subtitle="Manage your market here"
        screenWidth={window.innerWidth}
        btnName="Create market"
        handleClick={() => {}}
      />

      <GridComponent
        columns={[]}
        data={markets?.data || []}
        displayedCount={6}
        filter={""}
        setFilter={() => {}}
        renderRow={(row) => (
          <MarketCard
            market={row.original}
            key={row.original.id}
            handleEdit={() => {}}
            handleDelete={() => {}}
            openMarket={() => {}}
          />
        )}
      />
    </PageOutline>
  );
}
