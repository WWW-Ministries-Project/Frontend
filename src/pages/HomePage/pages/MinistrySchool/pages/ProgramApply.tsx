import ChurchLogo from "@/components/ChurchLogo";
import ProgramsCard from "../Components/ProgramsCard";
import { ApiCalls } from "@/utils/api/apiFetch";
import { useEffect, useState } from "react";
import { useProgramsStore } from '../store/programsStore';

// Sample data for programs


// Define the Cohort type
interface Cohort {
    id: number;
    name: string;
    startDate: string;
    status: string;
    classes: number;
    enrolledCount: number;
}

interface Program {
    id: number;
    title: string;
    description: string;
    eligibility: "Members" | "Non_Members" | "Both";
    topics: { name: string; id: string }[];
    cohorts: Cohort[];
  }

const ProgramApply = () => {
    const apiCalls = new ApiCalls();
    const [programs, setPrograms] = useState<Program[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const { clearSelection } = useProgramsStore();

    const fetchPrograms = async () => {
        clearSelection(); // Clear any previous selections
        try {
          const response = await apiCalls.fetchAllPrograms();
          console.log(response.data)
      
          if (response.data && Array.isArray(response.data)) {
            setPrograms(response.data as Program[]);
            response.data.forEach((program: any) => {
                console.log("Showing cohorts", program.cohorts);
            });
            
          } else {
            setError("Invalid data format received.");
          }
        } catch (err) {
          setError("An error occurred while fetching programs.");
        } finally {
          setLoading(false);
        }
      };

    const getCohortToShow = (cohorts: Cohort[]): Cohort[] => {
        const activeCohort = cohorts.find((cohort) => cohort.status === "Ongoing");
        if (activeCohort) {
            return [activeCohort]; // Return the Active cohort
        }

        const upcomingCohort = cohorts.find((cohort) => cohort.status === "Upcoming");
        if (upcomingCohort) {
            return [upcomingCohort]; // Return the Upcoming cohort if no Active cohort
        }

        return []; // Return an empty array if neither Active nor Upcoming cohort exists
    };

    useEffect(() => {
        fetchPrograms();
      }, []);

    return (
    
                <div className=" w-full  flex flex-col items-center  mx-auto  overflow-auto">
                <div className="flex flex-col items-center mb-8">
                <h2 className="text-6xl font-bold mb-4 text-white">School of Ministry</h2>
                <p className="text-2xl mb-4 text-white text-center line-clamp-3">
                Equipping believers with biblical knowledge and practical skills for <br/> effective ministry
                </p>
                </div>
                {programs.length>0?<div className="grid grid-cols-3 gap-8 w-full max-w-6xl">
                    {programs
                        .filter((program) => program.cohorts.length > 0) // Only programs with cohorts
                        .map((program) => {
                            const cohortsToShow = getCohortToShow(program.cohorts);
                            return (
                                cohortsToShow.length > 0 && (
                                    <ProgramsCard
                                        key={program.id}
                                        program={program}
                                        cohorts={cohortsToShow}
                                        handleCopyLink={() => {}}
                                        applyCard = {true}
                                    />
                                )
                            );
                        })}
                    
                </div>:
                <div className="text-center text-white mt-8 bg-primary/80 p-4 rounded-lg shadow-md w-full max-w-2xl ">
                    <h2 className="text-2xl font-bold mb-4">No Programs Available</h2>
                    We will be adding more programs soon.
                </div>
                }
                </div>
 
    );
};

export default ProgramApply;
