import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import Modal from "@/components/Modal";
import { HeaderControls } from "@/components/HeaderControls";
import { LifeCenterForm } from "./components/LifeCenterForm";
import { LifeCenterCard } from "./components/LifeCenterCard";
import GridComponent from "../../Components/reusable/GridComponent";

import { useLifeCenter } from "./hooks/useLifeCenter";

export function LifeCenter() {
  const {
    lifeCenters,
    selectedTab,
    showModal,
    toggleModal,
    handleTabSelect,
    addToList,
    handleDelete,
    handleEdit,
    addLifeCenter,
    initialValues,
    editItem,
    handleMutate,
    loading,
    isUpdating,
  } = useLifeCenter();

  return (
    <div className="bg-white rounded-xl flex flex-col gap-4 m-4 p-4 min-h-[100vh] h-fit">
      <div>
        <HeaderControls
          title="Life Center Management"
          subtitle="Manage your church's life centers and track souls won"
          screenWidth={window.innerWidth}
          btnName="Create Life Center"
          handleClick={addLifeCenter}
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
            handleDelete={handleDelete}
          />
        )}
      />
      <Modal
        open={showModal}
        onClose={toggleModal}
        persist={false}
        overFlowY={false}
      >
        <div className="w-full ">
          <LifeCenterForm
            closeModal={toggleModal}
            addToList={addToList}
            initialValues={initialValues}
            editItem={editItem}
            handleMutate={handleMutate}
            loading={loading}
            is_updating={isUpdating}
          />
        </div>
      </Modal>
    </div>
  );
}

export type LifeCenterType = {
  name: string;
  description: string;
  location: string;
  meeting_dates: string[];
  num_of_members: number;
  num_of_souls_won: number;
  id?: string;
};
