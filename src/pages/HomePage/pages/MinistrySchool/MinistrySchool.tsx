import { useState, useEffect } from "react";
import HeaderControls from "@/components/HeaderControls";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import CardWrappers from "@/Wrappers/CardWrapper";
import { useNavigate } from "react-router-dom";
import ProgramsCard from "./Components/ProgramsCard";
import Modal from "@/components/Modal";
import ProgramForm from "./Components/ProgramForm";
import { ApiCalls } from "@/utils/apiFetch";
import { ApiDeletionCalls } from "@/utils/apiDelete";

// Define the Cohort and Program types
interface Cohort {
  id: number;
  name: string;
  startDate: string;
  status: "active" | "upcoming" | "Completed";
  classes: number;
  enrolledCount: number;
}

interface Program {
  id: number;
  title: string;
  description: string;
  eligibility: "members" | "non-members" | "both";
  topics: string[];
  cohorts: Cohort[];
}

const MinistrySchool = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | undefined>(undefined);

  const apiCalls = new ApiCalls();
  const apiDelete = new ApiDeletionCalls() 

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
      if (response.data && Array.isArray(response.data.data)) {
        setPrograms(response.data.data as Program[]);
        getProgramsForDropdown(response.data.data); 

        console.log(getProgramsForDropdown(response.data.data));
        
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
      } else {
        setError("Failed to delete the program.");
      }
    } catch (err) {
      setError("An error occurred while deleting the program.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    

    fetchPrograms();
  }, []);

  const handleEdit = (program: Program): void => {
    setSelectedProgram(program);
    console.log("Program selected", program);
    
    setIsModalOpen(true)
  };

  const handleClose = () => {
    setSelectedProgram(undefined);
    console.log("Program selected", selectedProgram);
    
    setIsModalOpen(false)
  };

  const getEligibilityBadge = (eligibility: Program["eligibility"]): JSX.Element | null => {
    switch (eligibility) {
      case "members":
        return (
          <div className="bg-blue-50 text-xs text-blue-700 rounded-lg py-1 px-2 border border-blue-200">
            Members Only
          </div>
        );
      case "non-members":
        return (
          <div className="bg-red/50 text-xs text-red-700 rounded-lg py-1 px-2 border border-red-200">
            Non-Members Only
          </div>
        );
      case "both":
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
    const activeCohort = cohorts.find((cohort) => cohort.status === "active");
    if (activeCohort) {
      return [activeCohort]; // Return the active cohort
    }

    const upcomingCohort = cohorts.find((cohort) => cohort.status === "upcoming");
    if (upcomingCohort) {
      return [upcomingCohort]; // Return the upcoming cohort if no active cohort
    }

    return []; // Return an empty array if neither active nor upcoming cohort exists
  };

  return (
    <div className="p-4">
      <PageOutline>
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
        />

        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div>{error}</div>
        ) : (
          <section className="grid gap-4 xl:grid-cols-3 md:grid-cols-2">
            {programs.map((program) => {
              const cohortsToShow = getCohortToShow(program.cohorts);
              console.log(getCohortToShow(program.cohorts));
              

              return (
                <ProgramsCard
                  key={program.id}
                  program={program}
                  toggleMenu={() => {}}
                  isMenuOpen={null}
                  cohorts={getCohortToShow(program.cohorts)}
                  handleCopyLink={() => {}}
                  onOpen = {() => handleEdit(program)}
                  onClose={() => handleClose()}
                  onDelete={()=>deleteProgram(program.id)}
                  
                />
              );
            })}
          </section>
        )}
      </PageOutline>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ProgramForm 
        onClose={() => handleClose()} 
        program={selectedProgram || { 
          title: '', 
          description: '', 
          eligibility: '', 
          topics: [], 
          prerequisites: [] 
        }}  
        prerequisitesDropdown = {getProgramsForDropdown(programs)}
        fetchPrograms = {fetchPrograms}
        />
      </Modal>
    </div>
  );
};

export default MinistrySchool;
