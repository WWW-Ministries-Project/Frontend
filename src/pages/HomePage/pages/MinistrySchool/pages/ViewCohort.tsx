import Badge from "@/components/Badge";
import Button from "@/components/Button";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import ClassForm from "../Components/ClassForm";
import Modal from "@/components/Modal"; // Adjust the path based on your project structure
import { useEffect, useState } from "react";
import ClassCard from "../Components/ClassCard";
import { ApiCalls } from "@/utils/apiFetch";
import { useParams } from "react-router-dom";
import { formatTime } from "@/utils/helperFunctions";
import ViewPageTemplate from "../Components/ViewPageTemplate";
import { ApiDeletionCalls } from "@/utils/apiDelete";

type ClassItem = {
  id: string;
  name: string;
  format: string;
  instructor: string;
  schedule: string;
  classFormat: string;
  enrolled: number;
  capacity: number;
  location?: string;
  meetingLink?: string;
}

type Cohort = {
  id: number;
  description: string;
  startDate: string;
  duration: string;
  applicationDeadline: string;
  courses: ClassItem[];
};


const ViewCohort = () => {
  const apiCalls = new ApiCalls();
  const apiDelete = new ApiDeletionCalls() 
  const { id: cohortId } = useParams(); // Get cohort ID from the route
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cohort, setCohort] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  // Mock data for cohort (You can replace this with real data from an API or database)


 

  const fetchCohortData = async () => {
          if (!cohortId) return; // Ensure we have the programId before making the API call
    
          try {
            setLoading(true);
            // Fetch cohort details by programId
            const programResponse = await apiCalls.fetchCohortById(cohortId);
            if (programResponse.status === 200) {
              setCohort(programResponse.data.data);
            } else {
              setError("Error fetching cohort details");
            }
          } catch (err) {
            setError("An error occurred while fetching cohort details.");
          } finally {
            setLoading(false);
          }
        };  
  
  useEffect(() => {
    fetchCohortData(); // Call the function when programId changes
  }, [cohortId]); 
  
  const handleEdit = (course: ClassItem): void => {
    setSelectedClass(course);
    setIsModalOpen(true);
  }

  const deleteClass = async (classId: string) => {
    try {
      setLoading(true);
      const response = await apiDelete.deleteCourse(classId);
      if (response.status === 200) {
        
        // setProgram((prevPrograms: any) =>
        //   prevPrograms.filter((class: any) => class.cohort.id !== cohortId)
        // );
        console.log("Class deleted successfully");
      } else {
        setError("Failed to delete the class.");
      }
    } catch (err) {
      setError("An error occurred while deleting the class.");
    } finally {
      setLoading(false);
      fetchCohortData();
    }
  };
  
    


  return (
    <div className="px-4">
      <ViewPageTemplate 
        Data={cohort} 
        title="Cohort Details" 
        description="View and manage cohort details here."
        primaryButton=""
        secondaryButton=""
        showTopic={true}
        isGrid={true}
        onPrimaryButtonClick={() => console.log("Primary button clicked")} 
        onSecondaryButtonClick={() => console.log("Secondary button clicked")} 
        loading={loading} 
        details={
          <div className="flex gap-8">
                      <div>
                        <div className="font-semibold text-small">Start date</div>
                        <div>{formatTime(cohort?.startDate)}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-small">Duration</div>
                        <div>{cohort?.duration}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-small">Application Deadline</div>
                        <div>{formatTime( cohort?.applicationDeadline)}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-small">Classes</div>
                        <div>{cohort?.courses.length} classes</div>
                      </div>
                    </div>
        }

        children={<section>
          {/* classes */}
          
          <div  className=" rounded-lg py-4 space-y-2">
              {/* Classes */}
                  <div className="flex justify-between items-center">
                  <div className="">
              <h1 className="text-dark900 text-2xl font-bold">Class</h1>
            </div>
                    <Button value="Add Class" className="p-2 m-1 text-white min-h-10 max-h-14 bg-primary" 
                    onClick={() => setIsModalOpen(true)}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 ">
                  {cohort?.courses.map((classItem: ClassItem) => (
                   <div key={classItem.id}>
                    <ClassCard 
                      classItem={classItem} 
                      onEdit={handleEdit} 
                      onDelete={() => deleteClass(classItem.id)} 
                    />
                   </div>
                  ))}
                  </div>
                </div>
      </section>} 
        
      />
      {/* <PageOutline className="p-0">
        <section className=" sticky top-0">
        <div className="bg-primary rounded-t-lg text-white">
                    <div className="container mx-auto p-4 space-y-3">
                        <div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className=" text-white text-2xl font-bold">
                        {cohort?.name}
                        </div>
                        <Badge className="text-xs bg-primary text-white">{cohort?.status}</Badge>
                        </div>
                      <Button value="Edit Cohort" className="p-2 m-1 bg-white min-h-10 max-h-14 text-dark900" />
                      
                    </div>
                    <div className="text-sm">
                      <p>{cohort?.description}</p>
                    </div>
                    </div>

                    
                    </div>
                </div>
        
        </section>
        
      </PageOutline> */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ClassForm 
          onClose={() => setIsModalOpen(false)} 
          fetchCohortData={()=>fetchCohortData()} 
          initialData={selectedClass}
          cohortId = {cohort?.id}
        />
      </Modal>
    </div>
  );
};

export default ViewCohort;
