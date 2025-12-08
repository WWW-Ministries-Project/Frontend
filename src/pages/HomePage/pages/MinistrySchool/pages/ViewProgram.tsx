import { Modal } from "@/components/Modal";
import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import { showDeleteDialog } from "@/pages/HomePage/utils";
import type { CohortType } from "@/utils";
import { api } from "@/utils";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AllCohorts } from "../Components/AllCohort";
import { CohortForm, ICohortForm } from "../Components/CohortForm";
import { useViewPage } from "../customHooks/ViewPageContext";
import TopicForm, { TopicFormPayload } from "../Components/TopicForm";
import { Button } from "@/components";
import AllTopics from "../Components/AllTopics";

export const ViewProgram = () => {
  //api
  const { id: programId } = useParams();
  const { data, refetch } = useFetch(api.fetch.fetchProgramById, {
    id: programId!,
  });

  const { executeDelete, success } = useDelete(api.delete.deleteCohort);

  const program = useMemo(() => data?.data, [data]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState<ICohortForm | undefined>(
    undefined
  );

  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);

  const { setLoading, setData } = useViewPage();
  useEffect(() => {
    setData?.({
      title: program?.title || "",
      description: program?.description || "",
      showTopic: true,
      topics: program?.topics || [],
    });
  }, [setData, program]);

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

  const handleClose = () => {
    setSelectedCohort(undefined);
    setIsModalOpen(false);
  };

  const deleteCohort = async (cohortId: number) => {
    showDeleteDialog({ name: "Cohort", id: cohortId }, () =>
      executeDelete({ id: String(cohortId) })
    );
  };

  const handleSubmitTopic = (payload: TopicFormPayload) => {
    // TODO: hook this into the real API once available
    // eslint-disable-next-line no-console
    console.log("Topic payload", payload);
    // you can call refetch() here after a successful API call
  };

  return (
    <div >
      <div className="flex flex-row gap-8">
        
      <div className="w-4/6">
      <AllCohorts
        cohorts={program?.cohorts || []}
        onCreate={() => {
          setSelectedCohort(undefined);
          setIsModalOpen(true);
        }}
        onEdit={handleEdit}
        onDelete={(cohortId) => deleteCohort(cohortId)}
      />
      </div>

      <div className="border-l h-[100]"></div>
  
      <AllTopics
      topics={program?.topics || []}
      onDelete={() => {}}
      onCreateTopic={() => setIsTopicModalOpen(true)}
      onEditTopic={() => {}}
      />

      </div>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <CohortForm
          onClose={handleClose}
          cohort={selectedCohort}
          programId={programId ? Number(programId) : NaN}
          onSuccess={() => {
            refetch();
            handleClose();
          }}
        />
      </Modal>

      {/* Topic creation */}
      <Modal open={isTopicModalOpen} onClose={() => setIsTopicModalOpen(false)} className="w-[60vw]">
      <TopicForm
        open={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        onSubmit={handleSubmitTopic}
      />
      </Modal>
    </div>
  );
};

export default ViewProgram;
