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
import { Button } from "@/components";
import AllTopics from "../Components/AllTopics";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import TopicBasicInfoForm from "../Components/TopicBasicInfoForm";

export const ViewProgram = () => {
  //api
  const { id: programId } = useParams();
  const { data, refetch } = useFetch(api.fetch.fetchProgramById, {
    id: programId!,
  });

  console.log(programId);
  

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

  const [selectedTab, setSelectedTab] = useState<"Cohorts" | "Topics">("Cohorts");

  const handleTabSelect = (tab: "Cohorts" | "Topics") => {
    setSelectedTab(tab);
  };

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



  return (
    <PageOutline className=" ">
      
      <div className="py-6 flex flex-col gap-6">
        <TabSelection
          tabs={["Cohorts", "Topics"]}
          selectedTab={selectedTab}
          onTabSelect={handleTabSelect}
        />

        {selectedTab === "Cohorts" && (
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
          </div>
        )}

        {selectedTab === "Topics" && (
          <AllTopics
            topics={program?.topics || []}
            refetchProgram={refetch}
            
          />
        )}
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
      <Modal open={isTopicModalOpen} onClose={() => setIsTopicModalOpen(false)} className="w-[80vw] h-full">
        <TopicBasicInfoForm
          onClose={() => setIsTopicModalOpen(false)}
        />
      </Modal>
    </PageOutline>
  );
};

export default ViewProgram;
