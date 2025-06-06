import { HeaderControls } from "@/components/HeaderControls";
import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import { api } from "@/utils";
import { LifeCenterType } from "@/utils/api/lifeCenter/interfaces";
import { useEffect, useState } from "react";
import PageOutline from "../../Components/PageOutline";
import GridComponent from "../../Components/reusable/GridComponent";
import { showDeleteDialog } from "../../utils";
import { LifeCenterCard } from "./components/LifeCenterCard";
import Modal from "@/components/Modal";
import { LifeCenterForm } from "./components/LifeCenterForm";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { showNotification } from "@/pages/HomePage/utils/helperFunctions";

export function LifeCenter() {
  const [selectedTab, setSelectedTab] = useState("Life Center");

  const [lifeCenters, setLifeCenters] = useState<LifeCenterType[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [currentData, setCurrentData] = useState<LifeCenterType | null>(null);

  const { data: lcData } = useFetch(api.fetch.fetchAllLifeCenters);
  const { executeDelete } = useDelete(api.delete.deleteLifeCenter);
  const { postData, data, loading } = usePost(api.post.createLifeCenter);
  const {
    updateData,
    data: update_value,
    loading: isUpdating,
  } = usePut(api.put.updateLifeCenter);

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
      showNotification("Life center deleted successfully", "success");
    });
  };

  const handleEdit = (value: LifeCenterType) => {
    setCurrentData(value);
    setOpenModal(true);
  };

  const editItem = (item: LifeCenterType) => {
    setLifeCenters((prev) => prev.map((lc) => (lc.id === item.id ? item : lc)));
    setOpenModal(false);
  };

  const handleMutate = async (data: LifeCenterType) => {
    if (currentData) {
      await updateData(data, { id: currentData.id });
      setCurrentData(data);
    } else {
      await postData(data);
    }
  };

  const addToList = (item: LifeCenterType) => {
    setLifeCenters((prev) => [item, ...prev]);
    setOpenModal(false);
  };

  useEffect(() => {
    if (data?.data) {
      addToList(data?.data);
      showNotification("Life center created successfully", "success");
      setCurrentData(null);
    }
  }, [data?.data]);

  useEffect(() => {
    if (update_value?.data && currentData?.id) {
      editItem({
        ...update_value.data,
        id: currentData?.id,
      });
      showNotification("Life center updated successfully", "success");
      setCurrentData(null);
    }
  }, [update_value?.data, editItem]);

  const closeModal = () => {
    setOpenModal(false);
    setCurrentData(null);
  };

  const handleModalOpenForCreate = () => {
  setCurrentData(null);
  setOpenModal(true);
};

  return (
    <PageOutline>
      <div>
        <HeaderControls
          title="Life Center Management"
          subtitle="Manage your church's life centers and track souls won"
          screenWidth={window.innerWidth}
          btnName="Create Life Center"
          handleClick={handleModalOpenForCreate}
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
            handleEdit={handleEdit}
            deleteLifeCenter={deleteLifeCenter}
          />
        )}
      />
      <Modal open={openModal} onClose={closeModal}>
        <LifeCenterForm
          closeModal={closeModal}
          editData={currentData}
          handleMutate={handleMutate}
          loading={isUpdating || loading}
        />
      </Modal>
    </PageOutline>
  );
}
