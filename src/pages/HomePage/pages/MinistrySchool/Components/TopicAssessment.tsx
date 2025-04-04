import { ApiUpdateCalls } from "@/utils/apiPut";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Topic {
  id: number;
  name: string;
  score: number | undefined;
  status: "PASS" | "FAIL" | "PENDING";
  notes: string;
}

const TopicAssessment: React.FC<{ topics: Topic[]; editMode: boolean; enrollmentId: number; onCancel: ()=>void  }> = ({ topics, editMode, enrollmentId, onCancel }) => {
  const navigate = useNavigate();
  const apiPut = new ApiUpdateCalls()

  // Initialize state with topics, with score as undefined
  const [updatedTopics, setUpdatedTopics] = useState<Topic[]>(topics);
  const [isGenerateEnabled, setIsGenerateEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if all topics have passed
    const allPassed = updatedTopics.every((topic) => topic.status === "PASS");
    setIsGenerateEnabled(allPassed);
  }, [updatedTopics]);

  const handleStatusChange = (id: number, newStatus: "PASS" | "FAIL" | "PENDING") => {
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
    setLoading(true)
    const progressUpdates = updatedTopics.map((topic) => ({
      topicId: topic.id,
      enrollmentId: enrollmentId, // This should be dynamically fetched or passed to the function
      score: topic.score,
      status: topic.status,
      notes: topic.notes,
    }));

    // Prepare the payload
    const payload = { progressUpdates };

    try {
      
      console.log("Payload: ",  payload);
      
      
      const response = await apiPut.updateStudentProgress(payload)

      if (response.success) {
        console.log("Topics updated successfully!", response);
        // You can call navigate() here if you want to redirect to another page
        // navigate(`/some-path`);
      } else {
        console.log("Failed to update topics.");
      }
    } catch (error) {
      console.error("Error updating topics:", error);
      alert("An error occurred while updating the topics.");
    } finally {
      setLoading(false)
    }
  };

  const handleGenerateCertificate = () => {
    if (isGenerateEnabled) {
      alert("Certificate Generated!");
      const student = { id: 123 }; // Replace 123 with the actual student ID
      navigate(`certificate?${student.id}`);
    }
  };

  return (
    <div className="py-4">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Topic Assessment</h2>
        <p>Evaluate student performance for each topic in the program</p>

        {/* Table for Topic List */}
        <div className="overflow-x-auto bg-white border border-lightGray p-4 rounded-lg">
          <table className="min-w-full table-auto">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Topic</th>
                <th className="px-4 py-2 text-left">Score</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {updatedTopics.map((topic) => (
                <tr key={topic.id} className="border-t border-lightGray">
                  <td className="px-4 py-2">{topic.name}</td>
                  <td className="px-4 py-2">
                    {editMode ? (
                      <input
                        type="number"
                        className="px-4 py-2 border border-lightGray rounded-lg"
                        value={topic.score !== undefined ? topic.score : ""}
                        onChange={(e) => handleScoreChange(topic.id, Number(e.target.value))}
                      />
                    ) : (
                      topic.score
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editMode ? (
                      <select
                        className="px-4 py-2 border border-lightGray rounded-lg"
                        value={topic.status}
                        onChange={(e) => handleStatusChange(topic.id, e.target.value as "PASS" | "FAIL" | "PENDING")}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PASS">Pass</option>
                        <option value="FAIL">Fail</option>
                      </select>
                    ) : (
                      <p className="capitalize">{topic.status.toLowerCase()}</p>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={topic.notes}
                      onChange={(e) => {
                        setUpdatedTopics((prevTopics) =>
                          prevTopics.map((t) =>
                            t.id === topic.id ? { ...t, notes: e.target.value } : t
                          )
                        );
                      }}
                      disabled={!editMode}
                      className="px-4 py-2 border border-lightGray rounded-lg"
                      placeholder="Enter note"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Overall Assessment */}
        <div className="flex items-center justify-between">
          <div className=" text-sm">
            <div>
              <span className="font-semibold">Overall Assessment</span>
            </div>
            <div>
              <span className="font-medium">Average Score: </span>
              <span>
                {(
                  updatedTopics.reduce((acc, topic) => acc + (topic.score || 0), 0) /
                  updatedTopics.length
                ).toFixed(2)}
                %
              </span>
            </div>
            <div>
              <span className="font-medium">Progress: </span>
              <span>
                {((updatedTopics.filter((topic) => topic.status === "PASS").length / updatedTopics.length) *
                  100) ||
                  0}
                % Complete
              </span>
            </div>
          </div>

          {/* Save Button */}
          <div className="">
            {editMode ? (
             <div className="space-x-4">
              <button className={`px-6 py-2 rounded-lg border border-primary text-primary`} onClick={onCancel}>
                Cancel
              </button>
               <button className={`px-6 py-2 rounded-lg bg-primary text-white`} onClick={updateTopics}>
                Save
              </button>
             </div>
            ) : (
              <button
                className={`px-6 py-2 rounded-lg ${isGenerateEnabled ? "bg-primary text-white" : "bg-lightGray text-primary"}`}
                disabled={!isGenerateEnabled}
                onClick={handleGenerateCertificate}
              >
                Generate Certificate
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicAssessment;
