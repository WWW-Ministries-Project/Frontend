import Badge from "@/components/Badge";
import Button from "@/components/Button";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import AllCohortsPage from "../Components/AllCohort";
import Modal from "@/components/Modal";
import { useEffect, useState } from "react";
import CohortForm from "../Components/CohortForm";
import { ApiCalls } from "@/utils/apiFetch";
import { useParams } from "react-router-dom";

// Define the Topic type
type Topic = {
  name: string;
};

const ViewProgram = () => {
  const { id:programId } = useParams();
  const query = location.search;
  const params = new URLSearchParams(query);
  // const programId = params.get('program');
  const apiCalls = new ApiCalls();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [program, setProgram] = useState<any>(null); // Stores the program details

  useEffect(() => {
  const fetchProgramData = async () => {
    try {
      setLoading(true);
      
      // Fetch program details
      const programResponse = await apiCalls.fetchProgramById(programId as string); // Fetch program details by ID
      console.log("fetching", programResponse);
      if (programResponse.status === 200) {
        setProgram(programResponse.data.data);
      } else {
        setError("Error fetching program details");
      }

      // Fetch cohorts for the program
      // const cohortResponse = await apiCalls.fetchCohortsByProgramId(programId!); // Fetch cohorts by programId
      // if (cohortResponse.success) {
      //   setCohorts(cohortResponse.data);
      // } else {
      //   setError("Error fetching cohorts");
      // }
    } catch (err) {
      setError("An error occurred while fetching program or cohorts data.");
    } finally {
      setLoading(false);
    }
  };

  if (programId) {
    fetchProgramData();
  }
}, [programId]);

  useEffect(() => {
    console.log("this is a test", programId);
    console.log("fetching", program);
    
    
  }, [])
  

  
 
  return (
    <div className="px-4">
      <PageOutline className="p-0">
        <section className="bg-primary p-4 space-y-3 rounded-t-lg sticky top-0">
          <div className="container mx-auto flex justify-between">
            <div className="space-y-3">
              <div>
              <div className="flex gap-4 items-center">
                <h1 className="text-white  md:text-2xl font-bold">{program?.title}</h1>
                <Badge className="bg-green/80 border-green/30 font-medium text-xs text-dark900">{program?.eligibility}</Badge>
              </div>
              <p className="text-white text-sm">{program?.description}</p>
              </div>

              <div className="space-y-1">
                <p className="text-white text-lg font-semibold">Topics</p>
                <div className="flex flex-wrap gap-2">
                    {program?.topics.map((topic: Topic, index: number) => (
                    <Badge key={index} className="bg-lightGray border-lightGray font-medium text-sm text-dark900">
                      {topic.name}
                    </Badge>
                    ))}
                </div>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="flex items-center gap-2">
                <Button value="Edit Program" className="p-2 m-1 text-primary min-h-10 max-h-14 bg-white" />
                <Button value="View Application Page" className="p-2 m-1 text-white min-h-10 max-h-14 border border-white" />
              </div>
            </div>
          </div>
        </section>

        <section>
            <AllCohortsPage cohorts={program?.cohorts} onCreate={() => setIsModalOpen(true)}/>
        </section>

       
      </PageOutline>
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <CohortForm 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={(data) => console.log("Form submitted:", data)} 
        />
      </Modal>
    </div>
  );
};

export default ViewProgram;
