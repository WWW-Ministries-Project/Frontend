import HeaderControls from "@/components/HeaderControls";
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
      const response = await apiCalls.fetchAllPrograms();
      console.log(response.data)
  
      if (response.data && Array.isArray(response.data)) {
        setPrograms(response.data as Program[]);
        getProgramsForDropdown(response.data);
        console.log(getProgramsForDropdown(response.data));
      } else {
        setError("Invalid data format received.");
      }
    } catch (err) {
      setError("An error occurred while fetching programs.");
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

        console.log("Program deleted successfully");
        setFeedback("Program deleted successfully");
        setType("success");
      } else {
        setError("Failed to delete the program.");
      }
    } catch (err) {
      setError("An error occurred while deleting the program.");
    } finally {
      setLoading(false);
      setShowFeedback(true);
      setInterval(() => {
        setShowFeedback(false);
      }, 5000);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleEdit = (program: Program): void => {
    setSelectedProgram(program);
    console.log("Program selected", program);

    setIsModalOpen(true);
  };

  const handleClose = () => {
    setSelectedProgram(undefined);
    console.log("Program selected", selectedProgram);

    setIsModalOpen(false);
  };

  const getEligibilityBadge = (
    eligibility: Program["eligibility"]
  ): JSX.Element | null => {
    switch (eligibility) {
      case "Members":
        return (
          <div className="bg-blue-50 text-xs text-blue-700 rounded-lg py-1 px-2 border border-blue-200">
            Members Only
          </div>
        );
      case "Non_Members":
        return (
          <div className="bg-red/50 text-xs text-red-700 rounded-lg py-1 px-2 border border-red-200">
            Non-Members Only
          </div>
        );
      case "Both":
        return (
          <div className="bg-green/50 text-xs text-green-700 rounded-lg py-1 px-2 border border-green/50">
            Open to All
          </div>
        );
      default:
        return null;
    }
  };

  // Ensure that cohorts is always an array, even when it is empty or undefined.
  const getCohortToShow = (cohorts: Cohort[]): Cohort[] => {
    const activeCohort = cohorts.find((cohort) => cohort.status === "Ongoing");
    if (activeCohort) {
      return [activeCohort]; // Return the Ongoing cohort
    }

    const upcomingCohort = cohorts.find(
      (cohort) => cohort.status === "Upcoming"
    );
    if (upcomingCohort) {
      return [upcomingCohort]; // Return the Upcoming cohort if no Ongoing cohort
    }

    return []; // Return an empty array if neither Ongoing nor Upcoming cohort exists
  };

  const handleFeedback = (message: string, type: string): void => {
    setFeedback(message);
    setType(type);
  };

  return (
    <div className="p-4">
      <PageOutline>
        {showFeedback && (
          <AlertComp
            message={feedback || ""}
            type={"success"}
            onClose={() => setShowFeedback(false)}
          />
        )}
        <HeaderControls
          title="School of Ministry"
          showSearch={false}
          showFilter={false}
          totalMembers={programs.length}
          btnName="Create program"
          handleNavigation={() => setIsModalOpen(true)}
          tableView={false}
          handleViewMode={() => {}}
          setShowFilter={() => {}}
          setShowSearch={() => {}}
          screenWidth={window.innerWidth}
          Search={false}
          Filter={false}
          Grid={false}
        />

        {loading ? (
          <SkeletonLoader />
        ) : error ? (
          <div>{error}</div>
        ) : (
          <section className="grid gap-4 xl:grid-cols-3 md:grid-cols-2">
            {programs.map((program) => {
              const cohortsToShow = getCohortToShow(program.cohorts);
              console.log(
                "program cohortsToShow",
                getCohortToShow(program.cohorts)
              );

              return (
                <ProgramsCard
                  key={program.id}
                  program={program}
                  toggleMenu={() => {}}
                  isMenuOpen={null}
                  cohorts={cohortsToShow}
                  handleCopyLink={() => {}}
                  onOpen={() => handleEdit(program)}
                  onClose={() => handleClose()}
                  onDelete={() => deleteProgram(program.id)}
                />
              );
            })}
          </section>
        )}
      </PageOutline>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ProgramForm
          onClose={() => handleClose()}
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
    </div>
  );
};

export default MinistrySchool;
