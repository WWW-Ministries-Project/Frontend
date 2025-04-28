import EmptyState from "@/components/EmptyState";
import { HeaderControls } from "@/components/HeaderControls";
import Modal from "@/components/Modal";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { ApiDeletionCalls } from "@/utils/api/apiDelete";
import { ApiCalls } from "@/utils/api/apiFetch";
import { useEffect, useState } from "react";
import AlertComp from "../../Components/reusable/AlertComponent";
import SkeletonLoader from "../../Components/reusable/SkeletonLoader";
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
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | undefined>(
    undefined
  );

  const apiCalls = new ApiCalls();
  const apiDelete = new ApiDeletionCalls();

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

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCalls.fetchAllPrograms();

      if (response.data && Array.isArray(response.data)) {
        setPrograms(response.data as Program[]);
      } else {
        setError("Invalid data format received.");
      }
    } catch (err) {
      setError("Failed to fetch programs. Please try again later.");
      console.error("Fetch programs error:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteProgram = async (programId: number) => {
    try {
      setLoading(true);
      const response = await apiDelete.deleteProgram(programId);
      if (response.status === 200) {
        setPrograms((prevPrograms) =>
          prevPrograms.filter((program) => program.id !== programId)
        );
        setFeedback("Program deleted successfully");
        setType("success");
      } else {
        setError("Failed to delete the program.");
      }
    } catch (err) {
      setError("An error occurred while deleting the program.");
      console.error("Delete program error:", err);
    } finally {
      setLoading(false);
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 5000);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleEdit = (program: Program): void => {
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

  const handleFeedback = (message: string, type: string): void => {
    setFeedback(message);
    setType(type);
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 5000);
  };

  const renderContent = () => {
    if (loading) return <SkeletonLoader />;

    if (error)
      return (
        <div className="p-4 text-red-600 bg-red-50 rounded-lg">
          {error}
          <button
            onClick={fetchPrograms}
            className="ml-2 text-blue-600 hover:text-blue-800"
          >
            Retry
          </button>
        </div>
      );

    if (programs.length === 0)
      return (
        <div className="text-center py-8 w-1/4 mx-auto">
          <EmptyState msg={"No programs found"} />
        </div>
      );

    return (
      <section className="grid gap-4 xl:grid-cols-3 md:grid-cols-2">
        {programs.map((program) => (
          <ProgramsCard
            key={program.id}
            program={program}
            toggleMenu={() => {}}
            isMenuOpen={null}
            cohorts={getCohortToShow(program.cohorts)}
            handleCopyLink={() => {}}
            onOpen={() => handleEdit(program)}
            onClose={handleClose}
            onDelete={() => deleteProgram(program.id)}
          />
        ))}
      </section>
    );
  };

  return (
      <PageOutline>
        {showFeedback && (
          <AlertComp
            message={feedback || ""}
            type={type || "success"}
            onClose={() => setShowFeedback(false)}
          />
        )}
        <HeaderControls
          title="School of Ministry"
          showSearch={false}
          showFilter={false}
          totalMembers={programs.length}
          btnName="Create program"
          handleClick={() => setIsModalOpen(true)}
          tableView={false}
          handleViewMode={() => {}}
          setShowFilter={() => {}}
          setShowSearch={() => {}}
          screenWidth={window.innerWidth}
          hasSearch={false}
          hasFilter={false}
        />

        {renderContent()}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ProgramForm
          onClose={handleClose}
          program={
            selectedProgram || {
              title: "",
              description: "",
              eligibility: "",
              topics: [],
              prerequisites: [],
            }
          }
          prerequisitesDropdown={getProgramsForDropdown(programs)}
          fetchPrograms={fetchPrograms}
          handleFeedback={handleFeedback}
          handleAlert={setShowFeedback}
        />
      </Modal>
      </PageOutline>

  );
};

export default MinistrySchool;
