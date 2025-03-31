import Badge from "@/components/Badge";
import Button from "@/components/Button";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import AllCohortsPage from "../Components/AllCohort";
import Modal from "@/components/Modal";
import { useEffect, useState } from "react";
import CohortForm from "../Components/CohortForm";
import { ApiCalls } from "@/utils/apiFetch";
import { useParams } from "react-router-dom";
import { ApiDeletionCalls } from "@/utils/apiDelete";
import ViewPageTemplate from "../Components/ViewPageTemplate";
import Loading from "@/components/Loading";

// Define the Topic type
type Topic = {
  name: string;
};

const ViewProgram = () => {
  const { id: programId } = useParams(); // Get program ID from the route
  const apiCalls = new ApiCalls();
  const apiDelete = new ApiDeletionCalls() 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<any>(null); // Stores the program details
  const [selectedCohort, setSelectedCohort] = useState<Cohort | undefined>(undefined);

  const fetchProgramData = async () => {
    if (!programId) return; // Ensure we have the programId before making the API call

    try {
      setLoading(true);
      // Fetch program details by programId
      const programResponse = await apiCalls.fetchProgramById(programId);
      if (programResponse.status === 200) {
        setProgram(programResponse.data.data);
      } else {
        setError("Error fetching program details");
      }
    } catch (err) {
      setError("An error occurred while fetching program details.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    

    fetchProgramData(); // Call the function when programId changes
  }, [programId]); // Dependency on programId ensures this is called on mount and when programId changes

  const handleErrorDisplay = () => {
    if (error) {
      return <div className="text-red-600">{error}</div>;
    }
    return null;
  };

  interface Cohort {
    id: number;
    name: string;
    description: string;
    startDate: string;
    applicationDeadline: string;
    duration: string;
    status: string;
    [key: string]: any; // Add additional properties as needed
  }

  const handleEdit = (cohort: Cohort): void => {
    console.log("handleEdit");
    
    setSelectedCohort(cohort)
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setSelectedCohort(undefined);
    console.log("Program selected", selectedCohort);
    
    setIsModalOpen(false)
  };

  const deleteCohort = async (cohortId: number) => {
    try {
      setLoading(true);
      const response = await apiDelete.deleteCohort(cohortId);
      if (response.status === 200) {
        fetchProgramData();
        // setProgram((prevPrograms: any) =>
        //   prevPrograms.filter((program: any) => program.cohort.id !== cohortId)
        // );
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

  return  (
  //   <div>Loading...</div> // Show loading text while data is being fetched
  // ) : (
    <div className="px-4">
        <ViewPageTemplate
        Data={program}
        primaryButton=""
        secondaryButton="" 
        showTopic={true}
        isGrid={true} // Add the required isGrid property
        onPrimaryButtonClick={() => console.log("Primary button clicked")}
        onSecondaryButtonClick={() => console.log("Secondary button clicked")}
        details={""}
        loading={loading}
        >
          {/* Show cohorts for this program */}
          {handleErrorDisplay() || <AllCohortsPage loading={loading} cohorts={program?.cohorts} onCreate={() => setIsModalOpen(true)} onEdit={handleEdit} onDelete={(cohortId) => deleteCohort(cohortId)} />}

        </ViewPageTemplate>
        
      

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <CohortForm
          onClose={() => handleClose()}
          programId={programId && !isNaN(parseInt(programId, 10)) ? parseInt(programId, 10) : 0} // Pass the programId to CohortForm
          fetchProgramData = {fetchProgramData}
          cohort = {selectedCohort ? { ...selectedCohort, startDate: new Date(selectedCohort.startDate) } : undefined}
        />
      </Modal>
    </div>
  );
};

export default ViewProgram;
