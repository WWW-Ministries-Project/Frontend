import { FC } from "react";
import Assignmentmanager from "../Component/AssignmentManager";
import { useParams } from "react-router-dom";
import { useFetch } from "@/CustomHooks/useFetch";
import { api, CohortAssignment } from "@/utils";
import { ApiResponse } from "@/utils/interfaces";

interface AssignmentRow {
  id: string;
  title: string;
  topicId: string;
  isActive: boolean;
  dueDate?: string;
  submissionsCount: number;
  pendingCount: number;
}

interface AssignmentGroup {
  topicName: string;
  assignments: AssignmentRow[];
}

const InstructorAssMan: FC = () => {
  const { cohortId } = useParams<{ cohortId: string }>();
  const { data, loading, refetch } = useFetch<ApiResponse<CohortAssignment[]>>(
    api.fetch.fetchCohortAssignments,
    { cohortId: cohortId ?? "" }
  );

  const groupedAssignments = (data?.data ?? [])
    .slice()
    .sort((a, b) => a.topic.order - b.topic.order)
    .reduce<Record<string, AssignmentGroup>>((acc, item) => {
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
        submissionsCount: Number(item.activation.submissions ?? 0),
        pendingCount: Number(item.activation.pending ?? 0),
      });

      return acc;
    }, {});

  return (
    <div>
      <div className="text-xl font-semibold">Assignment</div>

      <main className="mx-auto py-8">
        <div className="flex flex-col gap-6">
          {loading && <div className="text-sm text-primaryGray">Loading assignments...</div>}

          {!loading && data?.data?.length === 0 && (
            <div className="rounded-lg border border-dashed border-lightGray p-6 text-center text-primaryGray">
              No assignments have been created for this cohort yet.
            </div>
          )}

          {Object.values(groupedAssignments).map((group) => (
            <div key={group.topicName} className="flex flex-col space-y-2">
              <h3 className="text-sm font-semibold text-primary">{group.topicName}</h3>

              <Assignmentmanager
                assignments={group.assignments}
                setSelectedAssignment={() => {}}
                cohortId={cohortId!}
                refetch={refetch}
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default InstructorAssMan;
