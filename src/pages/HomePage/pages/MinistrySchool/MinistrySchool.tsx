import EmptyState from "@/components/EmptyState";
import { HeaderControls } from "@/components/HeaderControls";
import { Modal } from "@/components/Modal";
import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { api } from "@/utils";
import { Cohort, ProgramResponse } from "@/utils/api/ministrySchool/interfaces";
import { useMemo, useState } from "react";
import SkeletonLoader from "../../Components/reusable/SkeletonLoader";
import { showDeleteDialog, showNotification } from "../../utils";
import { ProgramsCard } from "./Components/ProgramCard";
import { IProgramForm, ProgramForm } from "./Components/ProgramForm";

export const MinistrySchool = () => {
  //api
  const { data, loading, refetch } = useFetch(api.fetch.fetchAllPrograms);
  const { postData: postProgram, loading: postLoading } = usePost(api.post.createProgram);
  const { updateData: updateProgram, loading: updateLoading } = usePut(api.put.updateProgram);
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
    await executeDelete({
      id: String(programId),
    }).then(() => {
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

  const getCohortToShow = (cohorts: Cohort[] = []): Cohort[] | undefined => {
    const activeCohort = cohorts.find((cohort) => cohort.status === "Ongoing");
    if (activeCohort) return [activeCohort];

    const upcomingCohort = cohorts.find(
      (cohort) => cohort.status === "Upcoming"
    );
    if (upcomingCohort) return [upcomingCohort];

    return undefined;
  };

  const handleSubmit = (value: IProgramForm): void => {
    if (selectedProgram) {
      updateProgram(value, { id: String(selectedProgram.id) });
    } else {
      postProgram(value)
        .then(() => {
          return refetch();
        })
        .then(() => {
          setIsModalOpen(false);
          showNotification("Program Created Successfully");
        })
        .catch((error) => {
          showNotification(error.message, "error");
        });
    }
  };

  const renderContent = () => {
    if (loading) return <SkeletonLoader />;

    if (!programsData.length)
      return (
        <div className="text-center py-8 w-1/4 mx-auto">
          <EmptyState msg={"No programs found"} />
        </div>
      );

    return (
      <section className="grid gap-4 xl:grid-cols-3 md:grid-cols-2">
        {programsData.map((program) => (
          <ProgramsCard
            key={program.id}
            program={program}
            cohorts={getCohortToShow(program.cohorts)}
            onEdit={() => handleEdit(program)}
            handleCopyLink={() => {}}
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
        title="School of Ministry"
        showSearch={false}
        showFilter={false}
        totalMembers={programsData.length}
        btnName="Create program"
        handleClick={() => setIsModalOpen(true)}
        screenWidth={window.innerWidth}
        hasSearch={false}
        hasFilter={false}
      />

      {renderContent()}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
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
