import { useEffect, useState } from "react";
// import PageOutline from "../../Components/PageOutline";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import { Button } from "@/components";
import Modal from "@/components/Modal";
import { HeaderControls } from "@/components/HeaderControls";
import LifeCenterForm from "./components/LifeCenterForm";
import LifeCenterCard from "./components/LifeCenterCard";
import useWindowSize from "@/CustomHooks/useWindowSize";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils/api/apiCalls";
import GridComponent from "../../Components/reusable/GridComponent";

export type LifeCenterType = {
  name: string;
  description: string;
  location: string;
  meeting_dates: string[];
  num_of_members: number;
  num_of_souls_won: number;
  id?: string;
};

export default function LifeCenter() {
  const [selectedTab, setSelectedTab] = useState("Life Center");
  const [showModal, setShowModal] = useState(false);
  const windowSize = useWindowSize();
  const { data } = useFetch(api.fetch.fetchAllLifeCenters);

  const handleTabSelect = (tab: string) => {
    setSelectedTab(tab);
  };

  const [lifeCenters, setLifcenters] = useState<LifeCenterType[]>([]);
  useEffect(() => {
    if (data?.data.length) {
      setLifcenters([...data.data]);
    }
  }, [data]);

  const toggleModal = () => {
    setShowModal((prev) => !prev);
  };

  const [initialValues, setInitialValues] = useState<LifeCenterType>({
    description: "",
    location: "",
    meeting_dates: [],
    name: "",
    num_of_members: 0,
    num_of_souls_won: 0,
    id: "",
  });

  const addToList = (item: LifeCenterType) => {
    setLifcenters((prev) => [item, ...prev]);
    toggleModal();
  };

  const handleEdit = (lifeCenter: LifeCenterType) => {
    setInitialValues(lifeCenter);
    toggleModal();
  };
  const handleDelete = (id: string) => {
    setLifcenters((prev) => prev.filter((item) => item.id !== id));
  };

  const addLifeCenter = () => {
    setInitialValues({
      description: "",
      location: "",
      meeting_dates: [],
      name: "",
      num_of_members: 0,
      num_of_souls_won: 0,
      id: "",
    });
    toggleModal();
  };

  const editItem = (item: LifeCenterType) => {
    const updateLC = lifeCenters.find((lc) => lc.id === item.id);

    const updateAllLCs = lifeCenters.map((lc) =>
      lc.id === updateLC?.id ? item : lc
    );

    setLifcenters(updateAllLCs);

    toggleModal();
  };
  return (
    <div className="bg-white rounded-xl flex flex-col gap-4 m-4 p-4 min-h-[100vh] h-fit">
      <div>
        <HeaderControls
          title="Life Center Management"
          subtitle="Manage your church's life centers and track souls won"
          screenWidth={window.innerWidth}
        />
        <div className="flex items-center justify-between gap-3 mt-7">
          <TabSelection
            tabs={["Life Center", "Analytics"]}
            selectedTab={selectedTab}
            onTabSelect={handleTabSelect}
          />
          <Button
            value={windowSize.screenWidth < 630 ? "+" : "Create life center"}
            className="text-white px-5 min-h-12 max-h-14 p-3 bg-primary whitespace-nowrap"
            onClick={addLifeCenter}
          />
        </div>
      </div>

      <GridComponent
        columns={[]}
        data={lifeCenters}
        displayedCount={20}
        filter={""}
        setFilter={()=>{}}
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
          />
        </div>
      </Modal>
    </div>
  );
}
