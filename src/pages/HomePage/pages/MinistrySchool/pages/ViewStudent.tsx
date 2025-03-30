import Badge from "@/components/Badge";
import ViewPageTemplate from "../Components/ViewPageTemplate";
import { useEffect, useState } from "react";
import TopicAssessment from "../Components/TopicAssessment";
import { useParams } from "react-router-dom";
import { ApiCalls } from "@/utils/apiFetch";

const student = {
    id: 1,
    title: "Sarah Wilson",
    name: "Sarah Wilson", // Added to match 'Data' interface
    description: "A dedicated selectedStudent in the Biblical Leadership program", // Added to match 'Data' interface
    email: "sarah.w@example.com",
    phone: "+1 555-789-0123",
    applicationDate: "2023-05-08",
    status: "Active",
    attendance: 100,
    progress: 100,
    isMember: true,
    membershipType: "In-person Family",
    completionDate: "2023-08-28",
    startDate: "2023-06-05", // Added to match 'Data' interface
    duration: "3 months", // Added to match 'Data' interface
    topics: [
      { name: "Biblical Leadership Foundations", score: 98, status: "Pass" },
      { name: "Character Development", score: 95, status: "Pass" },
      { name: "Vision Casting", score: 92, status: "Pass" },
      { name: "Team Building", score: 94, status: "Pass" },
    ],
  }

  const mockClass = {
    id: 1,
    programId: 1,
    name: "Biblical Leadership - Monday Evening Class",
    instructor: "Pastor James Wilson",
    capacity: 15,
    enrolled: 12,
    format: "in-person",
    location: "Main Campus - Room 201",
    schedule: "Mondays, 7:00 PM - 9:00 PM",
    startDate: "2023-06-05",
    endDate: "2023-08-28",
    cohortName: "Spring 2023",
    programName: "Biblical Leadership",
  }

const ViewStudent = () => {
  const apiCalls = new ApiCalls();
  const { id: studentId } = useParams()
    const[showTopic, setTopicShow] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);

    const fetchStudentData = async () => {
      if (!studentId) return; // Ensure we have the programId before making the API call

      try {
        setLoading(true);
        // Fetch cohort details by programId
        const programResponse = await apiCalls.fetchStudentById(studentId);
        if (programResponse.status === 200) {
          setSelectedStudent(programResponse.data.data);
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
                
            
      fetchStudentData(); // Call the function when programId changes
              }, [studentId]); 
    

    return ( 
        <div className="px-4">
           <ViewPageTemplate 
               Data={selectedStudent}
               showTopic={showTopic}
               primaryButton="Edit" 
               onPrimaryButtonClick={() => { /* Add edit click handler here */ }} 
               loading={loading}
               isGrid={false}
               details={<div className="flex flex-wrap gap-x-12">
                <div className="space-y-1">
                  <div className="font-semibold ">Membership</div>
                  <div>{selectedStudent?.userId? <div className="flex items-center gap-2  ">{selectedStudent?.membershipType}<Badge>Member</Badge> </div>:<Badge>Non-member</Badge>} </div>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold ">Email</div>
                  <div className="">{selectedStudent?.email} </div>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold">Phone number</div>
                  <div>{selectedStudent?.phone} </div>
                </div>
               </div>}
           >
               <div>
                <TopicAssessment topics={selectedStudent?.course?.cohort?.program?.topics}/>
               </div>
           </ViewPageTemplate>
        </div>
     );
}
 
export default ViewStudent;