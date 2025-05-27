import EmptyState from "@/components/EmptyState";
import { HeaderControls } from "@/components/HeaderControls";
import Modal from "@/components/Modal";
import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { api } from "@/utils";
import {
  ProgramResponse,
  ProgramsPayloadType,
} from "@/utils/api/ministrySchool/interfaces";
import { useMemo, useState } from "react";
import SkeletonLoader from "../../Components/reusable/SkeletonLoader";
import { showDeleteDialog, showNotification } from "../../utils";
import ProgramForm from "./Components/ProgramForm";
import ProgramsCard from "./Components/ProgramsCard";

// Define the Cohort and Program types
interface Cohort {
  id: number;
  name: string;
  startDate: string;
  status: "Ongoing" | "Upcoming" | "Completed";
  classes: number;
  enrolledCount: number;
}

interface Program {
  id: number;
  title: string;
  description: string;
  eligibility: "Members" | "Non_Members" | "Both";
  topics: string[];
  cohorts: Cohort[];
}

const MinistrySchool = () => {
  //api
  const { data, loading, refetch } = useFetch(api.fetch.fetchAllPrograms);

  const { postData: postProgram } = usePost(api.post.createProgram);
  const { updateData: updateProgram } = usePut(api.put.updateProgram);
  const { executeDelete } = useDelete(api.delete.deleteProgram);

  const programsData = useMemo(() => data?.data || [], [data]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<
    ProgramResponse | undefined
  >(undefined);

  interface DropdownProgram {
    value: number;
    label: string;
  }

  const getProgramsForDropdown = (data: Program[]): DropdownProgram[] => {
    return data.map((program) => ({
      value: program.id,
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

  const handleEdit = (program): void => {
    setSelectedProgram(program);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setSelectedProgram(undefined);
    setIsModalOpen(false);
  };

  const getEligibilityBadge = (
    eligibility: Program["eligibility"]
  ): JSX.Element | null => {
    const badgeClasses = {
      Members: "bg-blue-50 text-blue-700 border-blue-200",
      Non_Members: "bg-red-50 text-red-700 border-red-200",
      Both: "bg-green-50 text-green-700 border-green-200",
    };

    const badgeText = {
      Members: "Members Only",
      Non_Members: "Non-Members Only",
      Both: "Open to All",
    };

    if (!eligibility || !badgeClasses[eligibility]) return null;

    return (
      <div
        className={`text-xs rounded-lg py-1 px-2 border ${badgeClasses[eligibility]}`}
      >
        {badgeText[eligibility]}
      </div>
    );
  };

  const getCohortToShow = (cohorts: Cohort[] = []): Cohort[] => {
    const activeCohort = cohorts.find((cohort) => cohort.status === "Ongoing");
    if (activeCohort) return [activeCohort];

    const upcomingCohort = cohorts.find(
      (cohort) => cohort.status === "Upcoming"
    );
    if (upcomingCohort) return [upcomingCohort];

    return [];
  };

  const handleSubmit = (value: ProgramsPayloadType): void => {
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
            toggleMenu={() => {}}
            isMenuOpen={null}
            cohorts={getCohortToShow(program.cohorts)}
            handleCopyLink={() => {}}
            onOpen={() => handleEdit(program)}
            onClose={handleClose}
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
          handleAlert={setShowFeedback}
        />
      </Modal>
    </PageOutline>
  );
};

export default MinistrySchool;
