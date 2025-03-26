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

const ViewCohort = () => {
  const apiCalls = new ApiCalls();
  const { id: cohortId } = useParams(); // Get cohort ID from the route
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cohort, setCohort] = useState<any>(null);
  // Mock data for cohort (You can replace this with real data from an API or database)
 
   const cohort1 =
      {
        id: 101,
        name: "Spring 2023",
        description: "First cohort of the Biblical Leadership cohort",
        startDate: "2023-06-01",
        duration: "12 weeks",
        applicationDeadline: "2023-05-15",
        status: "Active",
        classes: [
          {
            id: 1001,
            name: "Monday Evening Class",
            instructor: "Pastor James Wilson",
            capacity: 15,
            enrolled: 12,
            format: "in-person",
            location: "Main Campus - Room 201",
            schedule: "Mondays, 7:00 PM - 9:00 PM",
            meetingLink: "",
          },
          {
            id: 1002,
            name: "Wednesday Morning Class",
            instructor: "Elder Sarah Johnson",
            capacity: 15,
            enrolled: 8,
            format: "hybrid",
            location: "Main Campus - Fellowship Hall",
            meetingLink: "https://zoom.us/j/123456789",
            schedule: "Wednesdays, 10:00 AM - 12:00 PM",
          },
          {
            id: 1003,
            name: "Online Weekend Class",
            instructor: "Dr. Michael Brown",
            capacity: 20,
            enrolled: 4,
            format: "online",
            location: "",
            meetingLink: "https://zoom.us/j/987654321",
            schedule: "Saturdays, 9:00 AM - 11:00 AM",
          },
        ],
      }

    useEffect(() => {
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
    
        fetchCohortData(); // Call the function when programId changes
      }, [cohortId]); 
    


  return (
    <div className="px-4">
      <PageOutline className="p-0">
        <section className=" sticky top-0">
        <div className="bg-primary rounded-t-lg text-white">
                    <div className="lg:container mx-auto p-4 space-y-3">
                        <div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className=" text-white text-2xl font-bold">
                        {cohort?.name}
                        </div>
                        <Badge className="text-xs bg-primary text-white">{cohort?.status}</Badge>
                        </div>
                      <Button value="Edit Cohort" className="p-2 m-1 bg-white min-h-10 max-h-14 text-primary" />
                      
                    </div>
                    <div className="text-sm">
                      <p>{cohort?.description}</p>
                    </div>
                    </div>

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
                    </div>
                </div>
        
        </section>
        <section>
            {/* classes */}
            <div  className="container mx-auto rounded-lg p-4 space-y-2">
                {/* Classes */}
                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-lg">Classes</div>
                      <Button value="Add Class" className="p-2 m-1 text-white min-h-10 max-h-14 bg-primary" 
                      onClick={() => setIsModalOpen(true)}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 ">
                    {cohort?.courses.map((classItem) => (
                     <ClassCard classItem={{ ...classItem, id: classItem.id.toString() }} />
                    ))}
                    </div>
                  </div>
        </section>
      </PageOutline>
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ClassForm 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={(data) => console.log("ClassForm submitted", data)} 
        />
      </Modal>
    </div>
  );
};

export default ViewCohort;
