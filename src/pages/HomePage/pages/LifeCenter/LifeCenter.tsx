import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import { HeaderControls } from "@/components/HeaderControls";
import { LifeCenterCard } from "./components/LifeCenterCard";
import GridComponent from "../../Components/reusable/GridComponent";
import { useEffect, useState } from "react";
import { LifeCenterType } from "@/utils/api/lifeCenter/interface";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import { useDelete } from "@/CustomHooks/useDelete";
import { showDeleteDialog } from "../../utils";
import PageOutline from "../../Components/PageOutline";

export function LifeCenter() {
  const [selectedTab, setSelectedTab] = useState("Life Center");

  const [lifeCenters, setLifeCenters] = useState<LifeCenterType[]>([]);
  const { data: lcData } = useFetch(api.fetch.fetchAllLifeCenters);
  const { executeDelete } = useDelete(api.delete.deleteLifeCenter);

  useEffect(() => {
    if (lcData?.data?.length) {
      setLifeCenters([...lcData.data]);
    }
  }, [lcData]);

  const handleTabSelect = (tab: string) => setSelectedTab(tab);
  const handleDelete = (id: string) => {
    setLifeCenters((prev) => prev.filter((item) => item.id !== id));
  };
  const deleteLifeCenter = (id: string, name: string) => {
    showDeleteDialog({ id, name }, async () => {
      await executeDelete({ id: id });
      handleDelete(id);
    });
  };

  return (
    <PageOutline>
      <div>
        <HeaderControls
          title="Life Center Management"
          subtitle="Manage your church's life centers and track souls won"
          screenWidth={window.innerWidth}
          btnName="Create Life Center"
          handleClick={() => {}}
        />
        <div className="flex items-center justify-between gap-3 mt-7">
          <TabSelection
            tabs={["Life Center", "Analytics"]}
            selectedTab={selectedTab}
            onTabSelect={handleTabSelect}
          />
        </div>
      </div>

      <GridComponent
        columns={[]}
        data={lifeCenters}
        displayedCount={20}
        filter={""}
        setFilter={() => {}}
        renderRow={(row) => (
          <LifeCenterCard
            item={row.original}
            key={row.original.id}
            handleEdit={() => {}}
            deleteLifeCenter={deleteLifeCenter}
          />
        )}
      />
    </PageOutline>
  );
}
