import { Button } from "@/components";
import { Modal } from "@/components/Modal";
import { Actions } from "@/components/ui/form/Actions";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { DivideIcon } from "@heroicons/react/24/outline";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { CertificateTemplate } from "./CertificateTemplate";
import { EnrollmentDataType } from "@/utils";

export const TopicAssessment = ({
  topics,
  editMode,
  enrollmentId,
  onCancel,
  toggleEditMode,
  onUpdate,
  loading,
  studentData
}: {
  topics: Topic[];
  editMode: boolean;
  enrollmentId: number;
  loading: boolean;
  onCancel: () => void;
  toggleEditMode?: () => void;
  onUpdate: (data: {
    progressUpdates: {
      topicId: number;
      status: "PASS" | "FAIL" | "PENDING";
      score?: number;
      notes?: string;
      enrollmentId: number;
    }[];
  }) => void;
  studentData?: EnrollmentDataType | null;
}) => {
  console.log("topic", topics);
  const [certificateData, setCertificateData] = useState({
    recipientName: studentData?.user?.name || "-",
    achievement: studentData?.course?.cohort?.program?.title || "-",
    description: "",
    date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    issuer: "Worldwide Word Ministries",
    signatory: "Prof. John Anokye",
    signatoryTitle: "Prelate of the Worldwide Word Ministries",
  });
  
  const [updatedTopics, setUpdatedTopics] = useState<Topic[]>(topics);
  const [showCertificate, setShowCertificate] = useState(false);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);

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

  // Enable certificate generation if all topics are passed and there is at least one topic
  const isGenerateEnabled = updatedTopics.length > 0 && updatedTopics.every(topic => topic.status === "PASS");

  // Certificate generation with loading state
  const handleGenerateCertificate = async () => {
    if (isGenerateEnabled && !generatingCertificate) {
      setGeneratingCertificate(true);
      
      // Simulate 2 seconds loading time
      setTimeout(() => {
        setGeneratingCertificate(false);
        setShowCertificate(true);
      }, 2000);
    }
  };

  const handleCloseCertificate = () => {
    setShowCertificate(false);
  };

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
                className="px-4 py-2 border border-lightGray rounded-lg w-full"
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
        <div className="flex justify-between">
          <div>
            <h2 className="text-xl font-semibold">Topic Assessment</h2>
            <p>Evaluate student performance for each topic in the program</p>
          </div>
          {!editMode && toggleEditMode && (
            <div className="space-x-2">
              <Button
                variant="primary"
                value="Edit"
                onClick={toggleEditMode}
              />
            </div>
          )}
        </div>

        <div className="border px-4 p-2 rounded-xl space-y-2">
          <div>
            <h2 className="text-lg font-medium"> Overall Assessment</h2>
            <p className="text-sm">Summary across all topics</p>
          </div>

          <div>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div>
                <p className="font-medium text-lg">Average Score: </p>
                <p>{averageScore.toFixed(2)}%</p>
              </div>
              <div>
                <p className="font-medium text-lg">Progress: </p>
                <p>{progress}% Complete</p>
              </div>
            </div>
          </div>
        </div>

        <TableComponent columns={columns} data={updatedTopics} />

        <div className="flex ">
          <div className="w-full">
            {editMode && (
              <Actions
                onCancel={onCancel}
                onSubmit={updateTopics}
                loading={loading}
              />
            )}
            {!editMode && (
              <div className="flex justify-end">
                <button
                  className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
                    isGenerateEnabled && !generatingCertificate
                      ? "bg-primary text-white hover:bg-primary-dark"
                      : "bg-lightGray text-primary cursor-not-allowed"
                  }`}
                  disabled={!isGenerateEnabled || generatingCertificate}
                  onClick={handleGenerateCertificate}
                >
                  {generatingCertificate && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {generatingCertificate ? "Generating..." : "Generate Certificate"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      {showCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-5xl max-h-[95vh] overflow-auto bg-white rounded-lg shadow-2xl">
            {/* Close button */}
            {/* <button
              onClick={handleCloseCertificate}
              className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button> */}
            
            {/* Certificate Content */}
            <div className="p-4 sm:p-6 md:p-8">
              <CertificateTemplate data={certificateData} closeModal={()=>setShowCertificate(false)}/>
            </div>
          </div>
        </div>
      )}
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