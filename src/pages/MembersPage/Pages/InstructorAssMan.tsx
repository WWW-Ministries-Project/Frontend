import { Banner } from "@/pages/HomePage/pages/Members/Components/Banner";
import BannerWrapper from "../layouts/BannerWrapper";
import { Button } from "@/components";
import CourseSidebar from "../Component/CourseSidebar";
import { FC, useState } from "react";
import { Badge } from "@/components/Badge";
import GradingPanel from "./GradingPanel";
import Assignmentmanager from "../Component/AssignmentManager";

export type Topic = {
  id: string;
  name: string;
  assignments: Assignment[];
};

export type Assignment = {
  id: string;
  title: string;
  topicId: string;
  isActive: boolean;
  dueDate: string | undefined;
  submissions: Submission[];
};

export type Submission = {
  id: string;
  studentName: string;
  submittedAt: string;
  grade: number | null;
  status: "pending" | "graded";
};

const Topics: Topic[] = [
  {
    id: "1",
    name: "Introduction to Ministry",
    assignments: [
      {
        id: "a1",
        title: "Reflection on Calling",
        topicId: "1",
        isActive: true,
        dueDate: "2024-02-15",
        submissions: [
          { id: "s1", studentName: "John Doe", submittedAt: "2024-02-10", grade: null, status: "pending" },
          { id: "s2", studentName: "Jane Smith", submittedAt: "2024-02-11", grade: 85, status: "graded" },
        ],
      },
      {
        id: "a2",
        title: "Ministry Vision Statement",
        topicId: "1",
        isActive: false,
        dueDate: undefined,
        submissions: [],
      },
    ],
  },
  {
    id: "2",
    name: "Biblical Foundations",
    assignments: [
      {
        id: "a3",
        title: "Scripture Analysis",
        topicId: "2",
        isActive: true,
        dueDate: "2024-02-20",
        submissions: [
          { id: "s3", studentName: "Mike Johnson", submittedAt: "2024-02-18", grade: null, status: "pending" },
        ],
      },
    ],
  },
  {
    id: "3",
    name: "Leadership Principles",
    assignments: [
      {
        id: "a4",
        title: "Leadership Case Study",
        topicId: "3",
        isActive: false,
        dueDate: undefined,
        submissions: [],
      },
    ],
  },
];

const InstructorAssMan: FC = () => {

const [filter, setFilter] = useState<string | null>(null);
const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

const assignments = filter
    ? Topics.find((topic) => topic.id === filter)?.assignments || []
    : Topics.flatMap((topic) => topic.assignments);

    

    const handleStatusSelect = (id: string | number): void => {
        const selected = Topics.find((s) => s.id === id);
        if (selected) {
            setFilter(selected.id);
        }
    };



    return ( 
        <div>
            <div className="text-xl font-semibold">
              Assignment
            </div>

            {/* Section */}
            <main className="mx-auto py-8 ">
        <div className="flex flex-col gap-6 lg:flex-row">
          
          <Assignmentmanager 
            assignments={assignments} 
            setSelectedAssignment={(assignment) => setSelectedAssignment(assignment)} 
          />
            {/* {selectedAssignment && (
              <GradingPanel
                assignment={selectedAssignment}
                onGrade={(grade) => {
                  // Handle grade submission here
                  setSelectedAssignment(null);
                }}
                onBack={() => setSelectedAssignment(null)}
              />
            )} */}


          </div>
            </main>
            
        </div>
     );
}
 
 
export default InstructorAssMan;