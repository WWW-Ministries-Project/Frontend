import Badge from "@/components/Badge";
import ViewPageTemplate from "../Components/ViewPageTemplate";
import { useState } from "react";
import TopicAssessment from "../Components/TopicAssessment";

const student = {
    id: 1,
    title: "Sarah Wilson",
    name: "Sarah Wilson", // Added to match 'Data' interface
    description: "A dedicated student in the Biblical Leadership program", // Added to match 'Data' interface
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
    const[showTopic, setTopicShow] = useState(false);
    return ( 
        <div className="px-4">
           <ViewPageTemplate 
               Data={student}
               showTopic={showTopic}
               onEditClick={() => { /* Add edit click handler here */ }} 
               details={<div className="flex flex-wrap gap-x-12">
                <div className="space-y-1">
                  <div className="font-semibold ">Membership</div>
                  <div>{student.isMember? <div className="flex items-center gap-2  ">{student.membershipType}<Badge>Member</Badge> </div>:<Badge>Non-member</Badge>} </div>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold ">Email</div>
                  <div className="">{student.email} </div>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold">Phone number</div>
                  <div>{student.phone} </div>
                </div>
               </div>}
           >
               <div>
                <TopicAssessment/>
               </div>
           </ViewPageTemplate>
        </div>
     );
}
 
export default ViewStudent;