import { HeaderControls } from "@/components/HeaderControls";
import PageOutline from "../../Components/PageOutline";
import GridComponent from "../../Components/reusable/GridComponent";
import { MarketCard } from "./components/cards/MarketCard";
import TabSelection from "../../Components/reusable/TabSelection";
import { useMemo, useState } from "react";
import { IMarket, MarketStatus } from "@/utils/api/marketPlace/interface";
import { getMarketStatus } from "@/utils/api/marketPlace/helpers";
import { Modal } from "@/components/Modal";
import { AddMarketForm } from "./components/forms/AddMarketForm";
import EmptyState from "@/components/EmptyState";
import { useNavigate } from "react-router-dom";
import { encodeQuery } from "@/pages/HomePage/utils";

export function MarketPlace() {
  const TABS: Record<MarketStatus, string> = {
    active: "Active",
    upcoming: "Upcoming",
    ended: "Ended",
  };
  const [tab, setTab] = useState<string>(TABS.active);
  const [openModal, setOpenModal] = useState(false);
  //TODO: replace with real data
  const [churchMarkets, setChurchMarket] = useState([
    {
      id: "1",
      name: "Faith Harvest",
      description: "Local vendors during the church's harvest celebration.",
      event_name: "Harvest Revival",
      start_date: "2025-07-10",
      end_date: "2025-07-14",
    },

    {
      id: "2",
      name: "Youth Empowerment",
      description: "Support youth ministry with books, shirts, and treats.",
      event_name: "Youth Empowerment",
      start_date: "2025-07-11",
      end_date: "2025-07-15",
    },

    {
      id: "3",
      name: "Mission Fundraiser",
      description: "All proceeds go toward the missions outreach program.",
      event_name: "Mission Outreach",
      start_date: "2025-06-20",
      end_date: "2025-06-22",
    },

    {
      id: "4",
      name: "Women's Fellowship",
      description: "Homemade crafts and baked goods by women’s ministry.",
      event_name: "Women of Grace",
      start_date: "2025-06-28",
      end_date: "2025-06-30",
    },

    {
      id: "5",
      name: "Gospel Music Fair",
      description: "CDs, gospel wear, and musical instruments.",
      event_name: "Praise Night",
      start_date: "2025-07-01",
      end_date: "2025-07-05",
    },

    {
      id: "6",
      name: "Back-to-School Blessing",
      description: "Selling uniforms, bags, and stationery.",
      event_name: "Back-to-School",
      start_date: "2025-07-20",
      end_date: "2025-07-20",
    },

    {
      id: "7",
      name: "Men's Conference",
      description: "Devotionals, T-shirts, and mentoring materials.",
      event_name: "Men of Faith",
      start_date: "2025-07-25",
      end_date: "2025-07-26",
    },

    {
      id: "8",
      name: "Children’s Day",
      description: "Toys and kids' clothes to support children's church.",
      event_name: "Children’s Celebration",
      start_date: "2025-08-01",
      end_date: "2025-08-01",
    },

    {
      id: "9",
      name: "Church Anniversary",
      description: "Souvenirs, food, and church memorabilia.",
      event_name: "40th Anniversary",
      start_date: "2025-08-10",
      end_date: "2025-08-11",
    },

    {
      id: "10",
      name: "Christmas Love",
      description: "Seasonal items and gift baskets for charity.",
      event_name: "Christmas Outreach",
      start_date: "2025-12-20",
      end_date: "2025-12-21",
    },
  ]);

  const [initialData, setInitialData] = useState<IMarket | null>(null);

  const handleTabSelection = (tab: string) => {
    setTab(tab);
  };

  const navigate = useNavigate();

  const openShop = (id: string) => {
    navigate(encodeQuery(id));
  };

  const filteredMarkets = useMemo(() => {
    return churchMarkets.filter(
      (market) =>
        getMarketStatus({
          start_date: market.start_date,
          end_date: market.end_date,
        }) === tab.toLowerCase()
    );
  }, [tab, churchMarkets]);

  const addMarket = (market: IMarket) => {
    if (market.id) {
      setChurchMarket((prev) =>
        prev.map((m) => (m.id === market.id ? market : m))
      );
    } else {
      setChurchMarket((prev) => [
        { ...market, id: `${churchMarkets.length + 1}` },
        ...prev,
      ]);

      const status = getMarketStatus({
        start_date: market.start_date,
        end_date: market.end_date,
      });

      setTab(String(status).charAt(0).toUpperCase() + String(status).slice(1));
    }

    setOpenModal(false);
  };

  const editMarket = (market: IMarket) => {
    setInitialData(market);
    setOpenModal(true);
  };

  const deleteMarket = (id: string, name: string) => {
    setChurchMarket((prev) => prev.filter((market) => market.id !== id));
    alert(name + " deleted");
  };

  const createMartket = () => {
    setInitialData(null);
    setOpenModal(true);
  };
  return (
    <PageOutline>
      <HeaderControls
        title="Marketplace Management"
        subtitle="Manage your market here"
        screenWidth={window.innerWidth}
        btnName="Create market"
        handleClick={createMartket}
      />
      <div className="w-fit">
        <TabSelection
          tabs={["Upcoming", "Active", "Ended"]}
          selectedTab={tab}
          onTabSelect={handleTabSelection}
        />
      </div>
      <GridComponent
        columns={[]}
        data={filteredMarkets}
        displayedCount={6}
        filter={""}
        setFilter={() => {}}
        renderRow={(row) => (
          <MarketCard
            market={row.original}
            key={row.original.id}
            handleEdit={editMarket}
            handleDelete={deleteMarket}
            openMarket={openShop}
          />
        )}
      />
      {filteredMarkets.length === 0 && (
        <EmptyState msg={`No ${tab} Markets Found`} />
      )}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <AddMarketForm
          onClose={() => setOpenModal(false)}
          editData={initialData}
          onSubmit={addMarket}
          loading={false}
        />
      </Modal>
    </PageOutline>
  );
}
