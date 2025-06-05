import { useEffect, useState, useCallback } from "react";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils/api/apiCalls";
import { showNotification } from "@/pages/HomePage/utils/helperFunctions";
import { LifeCenterType } from "@/utils/api/lifeCenter/interface";



export const useLifeCenter = () => {
  const [showModal, setShowModal] = useState(false);
  const [lifeCenters, setLifeCenters] = useState<LifeCenterType[]>([]);
  const [selectedTab, setSelectedTab] = useState("Life Center");
  const [initialValues, setInitialValues] =
    useState<LifeCenterType>(emptyLifeCenter);

  const { data: lcData } = useFetch(api.fetch.fetchAllLifeCenters);

  useEffect(() => {
    if (lcData?.data?.length) {
      setLifeCenters([...lcData.data]);
    }
  }, [lcData]);

  const { postData, data, loading, setData } = usePost(
    api.post.createLifeCenter
  );
  const {
    updateData,
    data: updatedData,
    loading: isUpdating,
    setData:setUpdateData
  } = usePut(api.put.updateLifeCenter);

  const toggleModal = () => setShowModal((prev) => !prev);

  const handleTabSelect = (tab: string) => setSelectedTab(tab);

  const addLifeCenter = () => {
    setInitialValues(emptyLifeCenter);
    setShowModal(true);
  };

  const addToList = (item: LifeCenterType) => {
    setLifeCenters((prev) => [item, ...prev]);
    setShowModal(false);
  };

  const handleEdit = (lifeCenter: LifeCenterType) => {
    setInitialValues(lifeCenter);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setLifeCenters((prev) => prev.filter((item) => item.id !== id));
  };

  const editItem = useCallback((item: LifeCenterType) => {
    setLifeCenters((prev) => prev.map((lc) => (lc.id === item.id ? item : lc)));
    setShowModal(false);
  }, []);

  const handleMutate = async (value: LifeCenterType) => {
    if (value.id) {
      await updateData(value, { id: String(value.id) });
    } else {
      await postData(value);
    }
  };

  useEffect(() => {
    if (data?.data) {
      addToList(data?.data as LifeCenterType);
      showNotification("Life center created successfully", "success");
      setData(null);
    }
  }, [data?.data, setData]);

  useEffect(() => {
    if (updatedData?.data && initialValues.id) {
      editItem({
        ...(updatedData.data as LifeCenterType),
        id: initialValues.id,
      });
      showNotification("Life center updated successfully", "success");
      setUpdateData(null)
    }
  }, [editItem, initialValues.id, setUpdateData, updatedData?.data]);

  return {
    lifeCenters,
    setLifeCenters,
    selectedTab,
    showModal,
    toggleModal,
    handleTabSelect,
    addToList,
    handleEdit,
    handleDelete,
    addLifeCenter,
    initialValues,
    editItem,
    handleMutate,
    loading,
    isUpdating,
  };
};

const emptyLifeCenter: LifeCenterType = {
  description: "",
  location: "",
  meeting_dates: [],
  name: "",
  num_of_members: 0,
  num_of_souls_won: 0,
  id: "",
};