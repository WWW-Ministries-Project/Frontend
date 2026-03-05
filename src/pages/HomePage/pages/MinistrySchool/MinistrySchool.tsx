import EmptyState from "@/components/EmptyState";
import { HeaderControls } from "@/components/HeaderControls";
import { Modal } from "@/components/Modal";
import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { api } from "@/utils";
import {
  COHORT_STATUS,
  CohortType,
  normalizeCohortStatus,
  ProgramResponse,
  ProgramsPayloadType,
} from "@/utils/api/ministrySchool/interfaces";
import { useMemo, useState } from "react";
import SkeletonLoader from "../../Components/reusable/SkeletonLoader";
import { showDeleteDialog, showNotification } from "../../utils";
import { ProgramsCard } from "./Components/ProgramCard";
import { IProgramForm, ProgramForm } from "./Components/ProgramForm";
import { createLmsActionTracker } from "./utils/lmsGuardrails";

export const MinistrySchool = () => {
  //api
  const { data, loading, refetch } = useFetch(api.fetch.fetchAllPrograms);
  const { postData: postProgram, loading: postLoading } = usePost(
    api.post.createProgram
  );
  const { updateData: updateProgram, loading: updateLoading } = usePut(
    api.put.updateProgram
  );
  const { executeDelete } = useDelete(api.delete.deleteProgram);

  const programsData = useMemo(() => data?.data || [], [data]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<
    ProgramResponse | undefined
  >(undefined);

  const getProgramsForDropdown = (
    data: ProgramResponse[]
  ): DropdownProgram[] => {
    return data.map((program) => ({
      value: String(program.id),
      label: program.title,
    }));
  };

  const deleteProgram = async (programId: number | string) => {
    const tracker = createLmsActionTracker("admin.program.delete", {
      programId: String(programId),
    });
    await executeDelete({
      id: String(programId),
    }).then(() => {
      tracker.success();
      showNotification("Program deleted successfully", "success");
      refetch();
    });
  };

  const handleEdit = (program: ProgramResponse): void => {
    setSelectedProgram(program);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setSelectedProgram(undefined);
    setIsModalOpen(false);
  };

  const getCohortToShow = (
    cohorts: CohortType[] = []
  ): CohortType[] | undefined => {
    const activeCohort = cohorts.find(
      (cohort) => normalizeCohortStatus(cohort.status) === COHORT_STATUS.ONGOING
    );
    if (activeCohort) return [activeCohort];

    const upcomingCohort = cohorts.find(
      (cohort) =>
        normalizeCohortStatus(cohort.status) === COHORT_STATUS.UPCOMING
    );
    if (upcomingCohort) return [upcomingCohort];

    return undefined;
  };

  const handleSubmit = (value: IProgramForm): void => {
    const payload: ProgramsPayloadType = {
      title: value.title,
      description: value.description,
      topics: value.topics,
      prerequisites: value.isPrerequisitesChecked ? value.prerequisites : [],
      member_required: value.member_required,
      leader_required: value.leader_required,
      ministry_required: value.ministry_required,
    };

    if (selectedProgram) {
      const tracker = createLmsActionTracker("admin.program.update", {
        programId: String(selectedProgram.id),
      });
      updateProgram(payload, { id: String(selectedProgram.id) });
      tracker.success({ message: "Update request submitted." });
    } else {
      const tracker = createLmsActionTracker("admin.program.create");
      postProgram(payload)
        .then(() => {
          return refetch();
        })
        .then(() => {
          tracker.success();
          setIsModalOpen(false);
          showNotification("Program Created Successfully");
        })
        .catch((error) => {
          tracker.failure({ error });
          showNotification(error.message, "error");
        });
    }
  };

  const renderContent = () => {
    if (loading) return <SkeletonLoader />;

    if (!programsData.length) {
      return <EmptyState scope="page" msg={"No programs found"} />;
    }

    return (
      
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {programsData.map((program) => (
            <ProgramsCard
              key={program.id}
              program={program}
              cohorts={getCohortToShow(program.cohorts)}
              onEdit={() => handleEdit(program)}
              onDelete={() =>
                showDeleteDialog(
                  { name: program.title, id: program.id },
                deleteProgram
              )
            }
          />
        ))}
      </section>
    );
  };

  return (
    <PageOutline>
      <HeaderControls
        title={`School of Ministry (${programsData.length})`}
        showSearch={false}
        showFilter={false}
        btnName="Create program"
        handleClick={() => setIsModalOpen(true)}
        screenWidth={typeof window !== "undefined" ? window.innerWidth : 1280}
        hasSearch={false}
        hasFilter={false}
      />

      {renderContent()}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="!max-w-[46rem]"
      >
        <ProgramForm
          onClose={handleClose}
          program={selectedProgram}
          prerequisitesDropdown={getProgramsForDropdown(programsData)}
          handleSubmit={handleSubmit}
          loading={loading || postLoading || updateLoading}
        />
      </Modal>
    </PageOutline>
  );
};

interface DropdownProgram {
  value: string;
  label: string;
}
