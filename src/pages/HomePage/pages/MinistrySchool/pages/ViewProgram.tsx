import Modal from "@/components/Modal";
import { useFetch } from "@/CustomHooks/useFetch";
import { api, Cohort } from "@/utils";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import AllCohortsPage from "../Components/AllCohort";
import CohortForm from "../Components/CohortForm";
import ViewPageTemplate from "../Components/ViewPageTemplate";
import { showDeleteDialog } from "@/pages/HomePage/utils";

const ViewProgram = () => {
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

  const fetchProgramData = async () => {};
  useEffect(() => {
    fetchProgramData(); // Call the function when programId changes
  }, [programId]); // Dependency on programId ensures this is called on mount and when programId changes

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
    //   <div>Loading...</div> // Show loading text while data is being fetched
    // ) : (
    <div className="">
      <ViewPageTemplate
        title="Program Details" // Add the title property
        description="View and manage program details" // Add the description property
        Data={program}
        showTopic={true}
        isGrid={true}
        details={""}
        loading={loading}
      >
        <AllCohortsPage
          loading={loading}
          cohorts={program?.cohorts || []}
          onCreate={() => setIsModalOpen(true)}
          onEdit={handleEdit}
          onDelete={(cohortId) => deleteCohort(cohortId)}
        />
      </ViewPageTemplate>

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

export default ViewProgram;
