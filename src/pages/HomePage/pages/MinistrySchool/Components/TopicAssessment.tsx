import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Topic {
  id: number;
  name: string;
  score: number;
  status: "Pass" | "Fail" | "Pending";
}

const TopicAssessment = () => {
    const navigate = useNavigate()
  // Initialize state with mock topics
  const [topics, setTopics] = useState<Topic[]>([
    {
      id: 1,
      name: "Biblical Leadership Foundations",
      score: 92,
      status: "Pass",
    },
    {
      id: 2,
      name: "Character Development",
      score: 88,
      status: "Pass",
    },
    {
      id: 3,
      name: "Vision Casting",
      score: 0,
      status: "Pending",
    },
    {
      id: 4,
      name: "Team Building",
      score: 0,
      status: "Pending",
    },
  ]);

  const [isGenerateEnabled, setIsGenerateEnabled] = useState(false);

  useEffect(() => {
    // Check if all topics have passed
    const allPassed = topics.every((topic) => topic.status === "Pass");
    setIsGenerateEnabled(allPassed);
  }, [topics]);

  const handleStatusChange = (id: number, newStatus: "Pass" | "Fail" | "Pending") => {
    setTopics((prevTopics) =>
      prevTopics.map((topic) =>
        topic.id === id ? { ...topic, status: newStatus } : topic
      )
    );
  };

  const handleScoreChange = (id: number, newScore: number) => {
    setTopics((prevTopics) =>
      prevTopics.map((topic) =>
        topic.id === id ? { ...topic, score: newScore } : topic
      )
    );
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
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((topic) => (
                <tr key={topic.id} className="border-t border-lightGray">
                  <td className="px-4 py-2">{topic.name}</td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      className="px-4 py-2 border border-lightGray rounded-lg"
                      value={topic.score}
                      onChange={(e) => handleScoreChange(topic.id, Number(e.target.value))}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      className="px-4 py-2 border border-lightGray rounded-lg"
                      value={topic.status}
                      onChange={(e) => handleStatusChange(topic.id, e.target.value as "Pass" | "Fail" | "Pending")}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Pass">Pass</option>
                      <option value="Fail">Fail</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <button className="text-primaryViolet">Notes</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Overall Assessment */}
        <div className="mt-6 text-sm">
          <div>
            <span className="font-semibold">Overall Assessment</span>
          </div>
          <div>
            <span>Average Score: </span>
            <span>{(topics.reduce((acc, topic) => acc + topic.score, 0) / topics.length).toFixed(2)}%</span>
          </div>
          <div>
            <span>Progress: </span>
            <span>{(topics.filter((topic) => topic.status === "Pass").length / topics.length) * 100}% Complete</span>
          </div>
        </div>

        {/* Generate Certificate Button */}
        <div className="mt-4">
          <button
            className={`px-6 py-2 rounded-lg ${isGenerateEnabled ? "bg-primary text-white" : "bg-lightGray text-dark900"}`}
            disabled={!isGenerateEnabled}
            onClick={handleGenerateCertificate}
          >
            Generate Certificate
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopicAssessment;
