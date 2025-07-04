import { Modal } from "@/components/Modal";
import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { showDeleteDialog } from "@/pages/HomePage/utils";
import type { CohortType } from "@/utils";
import { api } from "@/utils";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AllCohorts } from "../Components/AllCohort";
import { CohortForm, ICohortForm } from "../Components/CohortForm";
import { useViewPage } from "../customHooks/ViewPageContext";

export const ViewProgram = () => {
  //api
  const { id: programId } = useParams();
  const { data, loading, refetch } = useFetch(api.fetch.fetchProgramById, {
    id: programId!,
  });
  //cohort api
  const {
    postData: postCohort,
    loading: postLoading,
    data: postedData,
  } = usePost(api.post.createCohort);
  const {
    updateData: updateCohort,
    loading: updateLoading,
    data: updatedData,
  } = usePut(api.put.updateCohort);

  const { executeDelete, success } = useDelete(api.delete.deleteCohort);

  const program = useMemo(() => data?.data, [data]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState<ICohortForm | undefined>(
    undefined
  );

  const { setLoading, setData } = useViewPage();
  useEffect(() => {
    setData?.({
      title: program?.title || "",
      description: program?.description || "",
      showTopic: true,
      topics: program?.topics || [],
    });
  }, [setData, program]);
  // useEffect(() => {
  //   setLoading(loading);
  //   console.log(loading,"loading")
  // }, [loading, setLoading]);

  // const fetchProgramData = async () => {};
  useEffect(() => {
    if (updatedData || postedData) {
      refetch();
      setIsModalOpen(false);
      setSelectedCohort(undefined);
    }
  }, [updatedData, postedData, refetch]);
  useEffect(() => {
    if (success) {
      refetch();
    }
  }, [success, refetch]);

  const handleEdit = (cohort: CohortType): void => {
    const formattedCohort: ICohortForm = {
      id: cohort.id,
      name: cohort.name,
      duration: cohort.duration,
      description: cohort.description,
      startDate: cohort.startDate,
      applicationDeadline: cohort.applicationDeadline,
      status: cohort.status,
    };
    setSelectedCohort(formattedCohort);
    setIsModalOpen(true);
  };

  const handleSubmit = (values: ICohortForm) => {
    if (!programId || isNaN(parseInt(programId, 10))) return;
    if (selectedCohort?.id) {
      updateCohort(
        {
          ...values,
          id: selectedCohort.id,
          programId: Number(programId),
        },
        { id: String(selectedCohort.id) }
      );
    } else {
      postCohort({ ...values, programId: Number(programId) });
    }
  };
  const handleClose = () => {
    setSelectedCohort(undefined);
    setIsModalOpen(false);
  };

  const deleteCohort = async (cohortId: number) => {
    showDeleteDialog({ name: "Cohort", id: cohortId }, () =>
      executeDelete({ id: String(cohortId) })
    );
  };

  return (
    <div className="">
      <AllCohorts
        cohorts={program?.cohorts || []}
        onCreate={() => {
          setSelectedCohort(undefined);
          setIsModalOpen(true);
        }}
        onEdit={handleEdit}
        onDelete={(cohortId) => deleteCohort(cohortId)}
      />

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <CohortForm
          onClose={() => handleClose()}
          onSubmit={handleSubmit}
          loading={postLoading || updateLoading}
          cohort={selectedCohort}
        />
      </Modal>
    </div>
  );
};
