import { Actions } from "@/components/ui/form/Actions";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

export const TopicAssessment = ({
  topics,
  editMode,
  enrollmentId,
  onCancel,
  onUpdate,
  loading,
}: {
  topics: Topic[];
  editMode: boolean;
  enrollmentId: number;
  loading: boolean;
  onCancel: () => void;
  onUpdate: (data: {
    progressUpdates: {
      topicId: number;
      status: "PASS" | "FAIL" | "PENDING";
      score?: number;
      notes?: string;
      enrollmentId: number;
    }[];
  }) => void;
}) => {
  const [updatedTopics, setUpdatedTopics] = useState<Topic[]>(topics);
  const averageScore = updatedTopics.length
    ? updatedTopics.reduce((acc, topic) => acc + (topic.score || 0), 0) /
      updatedTopics.length
    : 0;
  const progress = updatedTopics.length
    ? (updatedTopics.filter((topic) => topic.status === "PASS").length /
        updatedTopics.length) *
      100
    : 0;

  const handleStatusChange = (
    id: number,
    newStatus: "PASS" | "FAIL" | "PENDING"
  ) => {
    setUpdatedTopics((prevTopics) =>
      prevTopics.map((topic) =>
        topic.id === id ? { ...topic, status: newStatus } : topic
      )
    );
  };

  const handleScoreChange = (id: number, newScore: number | undefined) => {
    setUpdatedTopics((prevTopics) =>
      prevTopics.map((topic) =>
        topic.id === id ? { ...topic, score: newScore } : topic
      )
    );
  };

  // Function to update the topics
  const updateTopics = async () => {
    const progressUpdates = updatedTopics.map((topic) => ({
      topicId: topic.id,
      enrollmentId: enrollmentId,
      score: topic.score,
      status: topic.status,
      notes: topic.notes,
    }));

    // Prepare the payload
    const payload = { progressUpdates };
    onUpdate(payload);
  };
  //TODO: Implement certificate generation WHEN BE IS READY
  // const handleGenerateCertificate = () => {
  //   if (isGenerateEnabled) {
  //     alert("Certificate Generated!");
  //     const student = { id: 123 }; // Replace 123 with the actual student ID
  //     navigate(`certificate?${student.id}`);
  //   }
  // };
  const columns: ColumnDef<Topic>[] = [
    {
      header: "Topic",
      accessorKey: "name",
    },
    {
      header: "Score",
      accessorKey: "score",
      cell: ({ row }) => {
        return (
          <>
            {editMode ? (
              <input
                type="number"
                className="px-4 py-2 border border-lightGray rounded-lg"
                value={
                  row.original.score !== undefined ? row.original.score : ""
                }
                onChange={(e) =>
                  handleScoreChange(row.original.id, Number(e.target.value))
                }
              />
            ) : (
              row.original.score || 0
            )}
          </>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        return (
          <>
            {editMode ? (
              <select
                className="px-4 py-2 border border-lightGray rounded-lg"
                value={row.original.status}
                onChange={(e) =>
                  handleStatusChange(
                    row.original.id,
                    e.target.value as "PASS" | "FAIL" | "PENDING"
                  )
                }
              >
                <option value="PENDING">Pending</option>
                <option value="PASS">Pass</option>
                <option value="FAIL">Fail</option>
              </select>
            ) : (
              <p className="capitalize">{row.original.status.toLowerCase()}</p>
            )}
          </>
        );
      },
    },
    {
      header: "Notes",
      accessorKey: "notes",
      cell: ({ row }) => {
        return (
          <>
            {editMode ? (
              <input
                type="text"
                className="px-4 py-2 border border-lightGray rounded-lg"
                placeholder="Enter notes"
                value={row.original.notes}
                onChange={(e) => {
                  setUpdatedTopics((prevTopics) =>
                    prevTopics.map((t) =>
                      t.id === row.original.id
                        ? { ...t, notes: e.target.value }
                        : t
                    )
                  );
                }}
              />
            ) : (
              <p>{row.original.notes}</p>
            )}
          </>
        );
      },
    },
  ];
  return (
    <div className="py-4">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Topic Assessment</h2>
        <p>Evaluate student performance for each topic in the program</p>
        <TableComponent columns={columns} data={updatedTopics} />

        {/* Overall Assessment */}
        <div className="flex items-center justify-between">
          <div className=" text-sm">
            <div>
              <span className="font-semibold">Overall Assessment</span>
            </div>
            <div>
              <span className="font-medium">Average Score: </span>
              <span>{averageScore.toFixed(2)}%</span>
            </div>
            <div>
              <span className="font-medium">Progress: </span>
              <span>{progress}% Complete</span>
            </div>
          </div>

          {/* Save Button */}
          <div className="">
            {editMode && (
              <Actions
                onCancel={onCancel}
                onSubmit={updateTopics}
                loading={loading}
              />
            )}
            {
              // <button
              //   className={`px-6 py-2 rounded-lg ${
              //     isGenerateEnabled
              //       ? "bg-primary text-white"
              //       : "bg-lightGray text-primary"
              //   }`}
              //   disabled={!isGenerateEnabled}
              //   onClick={handleGenerateCertificate}
              // >
              //   Generate Certificate
              // </button>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

interface Topic {
  id: number;
  name: string;
  score: number | undefined;
  status: "PASS" | "FAIL" | "PENDING";
  notes?: string;
}
