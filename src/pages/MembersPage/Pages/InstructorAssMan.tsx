import { Banner } from "@/pages/HomePage/pages/Members/Components/Banner";
import BannerWrapper from "../layouts/BannerWrapper";
import { Button } from "@/components";
import CourseSidebar from "../Component/CourseSidebar";
import { FC, useState } from "react";
import { Badge } from "@/components/Badge";
import GradingPanel from "./GradingPanel";
import Assignmentmanager from "../Component/AssignmentManager";
import { useParams } from "react-router-dom";
import { useFetch } from "@/CustomHooks/useFetch";
import { api, CohortAssignment } from "@/utils";



const InstructorAssMan: FC = () => {
  const { cohortId } = useParams<{ cohortId: string }>();
  console.log("cohortId from route:", cohortId);

  const { data, loading, refetch } = useFetch<{
    data: CohortAssignment[];
    meta: unknown;
    status: number;
    success: boolean;
    error: string;
  }>(
    api.fetch.fetchCohortAssignments,
    { cohortId:cohortId }
  );

  console.log("Cohort Assignment", data);

  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  const groupedAssignments = (data?.data ?? [])
    .slice()
    .sort((a, b) => a.topic.order - b.topic.order)
    .reduce<Record<string, { topicName: string; assignments: any[] }>>(
      (acc, item) => {
        const topicId = String(item.topic.id);
        if (!acc[topicId]) {
          acc[topicId] = {
            topicName: item.topic.name,
            assignments: [],
          };
        }

        acc[topicId].assignments.push({
          id: String(item.learningUnitId),
          title: item.topic.name,
          topicId,
          isActive: item.activation.isActive,
          dueDate: item.activation.dueDate ?? undefined,
          submissions: [],
        });

        return acc;
      },
      {}
    );

  return ( 
      <div>
          <div className="text-xl font-semibold">
            Assignment
          </div>

          {/* Section */}
          <main className="mx-auto py-8 ">
      <div className="flex flex-col gap-6 ">
        {loading && <div className="text-sm text-gray-500">Loading assignments...</div>}

        {!loading && data?.data?.length === 0 && (
          <div className="rounded-lg border border-dashed p-6 text-center text-gray-500">
            No assignments have been created for this cohort yet.
          </div>
        )}

        {Object.values(groupedAssignments).map((group) => (
          <div key={group.topicName} className="flex flex-col space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">
              {group.topicName}
            </h3>

            <Assignmentmanager
              assignments={group.assignments}
              setSelectedAssignment={(assignment) => setSelectedAssignment(assignment)}
              cohortId={cohortId!}
              refetch = {refetch}
              // topicId={}
            />
          </div>
        ))}

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