import Badge from "@/components/Badge";
import Button from "@/components/Button";
import PageOutline from "@/pages/HomePage/Components/PageOutline";

import { ReactNode } from "react";
import ViewPageTemplate from "../Components/ViewPageTemplate";
import AllStudents from "../Components/AllStudents";

interface ViewClassProps {
  children: ReactNode;
}

const ViewClass: React.FC<ViewClassProps> = ({ children }) => {
    const Data = {
        id: 1,
        programId: 1,
        name: "Biblical Leadership - Monday Evening Class",
        instructor: "Pastor James Wilson",
        capacity: 15,
        enrolled: 12,
        format: "in-person",
        location: "Main Campus - Room 201",
        meetingLink: "https://zoom.us/j/987654321",
        schedule: "Mondays, 7:00 PM - 9:00 PM",
        startDate: "2023-06-05",
        endDate: "2023-08-28",
        cohortName: "Spring 2023",
        programName: "Biblical Leadership",
        topics: ["Biblical Leadership Foundations", "Character Development", "Vision Casting", "Team Building"],
        title: "Class Overview",
        status: "Active",
        description: "This is a detailed description of the class.",
        duration: "12 weeks",
        additionalField1: "Value1",
        additionalField2: "Value2",
        applicationDeadline: "2023-05-31",
        classesLength: 12
      }

      const mockStudents = [
        {
          id: 1,
          name: "John Smith",
          email: "john.smith@example.com",
          phone: "+1 555-123-4567",
          applicationDate: "2023-05-10",
          status: "Active",
          attendance: 85,
          progress: 75,
          isMember: true,
          memberType: "In-person Family",
          topics: [
            { name: "Biblical Leadership Foundations", score: 92, status: "Pass" },
            { name: "Character Development", score: 88, status: "Pass" },
            { name: "Vision Casting", score: 0, status: "Pending" },
            { name: "Team Building", score: 0, status: "Pending" },
          ],
        },
        {
          id: 2,
          name: "Emily Johnson",
          email: "emily.j@example.com",
          phone: "+1 555-987-6543",
          applicationDate: "2023-05-12",
          status: "Active",
          attendance: 92,
          progress: 50,
          isMember: true,
          memberType: "In-person Family",
          topics: [
            { name: "Biblical Leadership Foundations", score: 95, status: "Pass" },
            { name: "Character Development", score: 90, status: "Pass" },
            { name: "Vision Casting", score: 0, status: "Pending" },
            { name: "Team Building", score: 0, status: "Pending" },
          ],
        },
        {
          id: 3,
          name: "Michael Brown",
          email: "m.brown@example.com",
          phone: "+1 555-456-7890",
          applicationDate: "2023-05-15",
          status: "Inactive",
          attendance: 35,
          progress: 25,
          isMember: false,
          memberType: "N/A",
          topics: [
            { name: "Biblical Leadership Foundations", score: 78, status: "Pass" },
            { name: "Character Development", score: 65, status: "Fail" },
            { name: "Vision Casting", score: 0, status: "Pending" },
            { name: "Team Building", score: 0, status: "Pending" },
          ],
        },
        {
          id: 4,
          name: "Sarah Wilson",
          email: "sarah.w@example.com",
          phone: "+1 555-789-0123",
          applicationDate: "2023-05-08",
          status: "Active",
          attendance: 100,
          progress: 100,
          isMember: true,
          membershipType: "In-person Family",
          topics: [
            { name: "Biblical Leadership Foundations", score: 98, status: "Pass" },
            { name: "Character Development", score: 95, status: "Pass" },
            { name: "Vision Casting", score: 92, status: "Pass" },
            { name: "Team Building", score: 94, status: "Pass" },
          ],
        },
        {
          id: 5,
          name: "David Lee",
          email: "david.lee@example.com",
          phone: "+1 555-234-5678",
          applicationDate: "2023-05-09",
          status: "Active",
          attendance: 78,
          progress: 75,
          isMember: false,
          memberType: "N/A",
          topics: [
            { name: "Biblical Leadership Foundations", score: 85, status: "Pass" },
            { name: "Character Development", score: 82, status: "Pass" },
            { name: "Vision Casting", score: 88, status: "Pass" },
            { name: "Team Building", score: 0, status: "Pending" },
          ],
        },
      ]
    return ( 
        <div className="px-4">
            <ViewPageTemplate 
                Data={Data} 
                btnName="Edit Class"
                onEditClick={() => { /* Add appropriate edit click handler here */ }}
                showTopic={true}
                details = 
                    {<div className="flex  gap-x-12 gap-y-4 grid grid-cols-4">
                <div>
                  <div className="font-semibold text-small">Start Date</div>
                  <div>{Data.startDate}</div>
                </div>
                <div>
                  <div className="font-semibold text-small">Duration</div>
                  <div>{Data.duration}</div>
                </div>
                <div>
                  <div className="font-semibold text-small">Application Deadline</div>
                  <div>{Data.applicationDeadline}</div>
                </div>
                <div>
                  <div className="font-semibold text-small">Classes</div>
                  <div>{Data.classesLength} classes</div>
                </div>
                <div>
                  <div className="font-semibold text-small">Instructor</div>
                  <div>{Data.instructor}</div>
                </div>
                <div>
                  <div className="font-semibold text-small">Schedule</div>
                  <div>{Data.schedule}</div>
                </div>
                <div>
                  <div className="font-semibold text-small">Format</div>
                  <div>{Data.format}</div>
                </div>
                <div>
                  <div className="font-semibold text-small">Location</div>
                  <div>{Data.location} </div>
                </div>
                <div>
                  <div className="font-semibold text-small">MeetingLink</div>
                  <div>{Data.meetingLink} </div>
                </div>
                <div>
                  <div className="font-semibold text-small">Enrollment</div>
                  <div>{Data.enrolled}/ {Data.capacity} students</div>
                </div>
              </div>}
                
            >
                <div>
                    <AllStudents Data={mockStudents}/>
                </div>
            </ViewPageTemplate>
        </div>
     );
}
 
export default ViewClass;