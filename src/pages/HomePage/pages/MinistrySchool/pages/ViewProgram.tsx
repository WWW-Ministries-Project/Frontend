import { Modal } from "@/components/Modal";
import { useFetch } from "@/CustomHooks/useFetch";
import { showDeleteDialog } from "@/pages/HomePage/utils";
import { api, Cohort } from "@/utils";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import AllCohortsPage from "../Components/AllCohort";
import CohortForm from "../Components/CohortForm";
import { useViewPage } from "../customHooks/ViewPageContext";

export const ViewProgram = () => {
  //api
  const { id: programId } = useParams(); // Get program ID from the route
  const { data, loading } = useFetch(api.fetch.fetchProgramById, {
    id: programId!,
  });
  const program = useMemo(() => data?.data, [data]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState<Cohort | undefined>(
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

  const fetchProgramData = async () => {};
  useEffect(() => {
    fetchProgramData();
  }, [programId]);

  const handleEdit = (cohort: Cohort): void => {
    setSelectedCohort(cohort);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setSelectedCohort(undefined);
    setIsModalOpen(false);
  };

  const deleteCohort = async (cohortId: number) => {
    showDeleteDialog({ name: "Cohort", id: cohortId }, async () => {});
  };

  return (
    <div className="">
      <AllCohortsPage
        loading={loading}
        cohorts={program?.cohorts || []}
        onCreate={() => setIsModalOpen(true)}
        onEdit={handleEdit}
        onDelete={(cohortId) => deleteCohort(cohortId)}
      />

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <CohortForm
          onClose={() => handleClose()}
          programId={
            programId && !isNaN(parseInt(programId, 10))
              ? parseInt(programId, 10)
              : 0
          } // Pass the programId to CohortForm
          fetchProgramData={fetchProgramData}
          cohort={
            selectedCohort
              ? {
                  ...selectedCohort,
                  startDate: new Date(selectedCohort.startDate),
                }
              : undefined
          }
        />
      </Modal>
    </div>
  );
};

