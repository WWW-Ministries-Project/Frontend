import React, { useState } from "react";
import { Button } from "@/components";
import { Badge } from "@/components/Badge";
import { LearningUnitType } from "@/utils";



export interface LearningUnit {
  type: LearningUnitType;
  data: Record<string, any>;
}

interface Props {
  topicId: string | number;
  unit: LearningUnit;
}

const typeBadgeMap: Record<
  LearningUnitType,
  { label: string; className: string }
> = {
  "lesson-note": { label: "Lesson Note", className: "bg-gray-100 text-gray-700" },
  video: { label: "Video", className: "bg-blue-100 text-blue-700" },
  pdf: { label: "PDF", className: "bg-red-100 text-red-700" },
  ppt: { label: "Slides", className: "bg-yellow-100 text-yellow-700" },
  live: { label: "Live", className: "bg-green-100 text-green-700" },
  "in-person": {
    label: "In-person",
    className: "bg-purple-100 text-purple-700",
  },
  assignment: {
    label: "Assignment (MCQ)",
    className: "bg-orange-100 text-orange-700",
  },
  "assignment-essay": {
    label: "Assignment (Essay)",
    className: "bg-pink-100 text-pink-700",
  },
};

export const LearningUnit: React.FC<Props> = ({ unit, topicId }) => {
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState(0);

  const updateProgress = (value: number) => {
    setProgress(value);

    console.log("Learning unit progress:", {
      topicId,
      progress: value,
    });

    if (value === 100 && !completed) {
      setCompleted(true);
      console.log("Topic completed:", {
        topicId,
        completed: true,
      });
    }
  };

  const markCompleted = () => {
    updateProgress(100);
  };

  const badge = typeBadgeMap[unit.type];
  console.log("Unit", unit);

  return (
    <div className="border border-lightGray rounded-lg p-4 space-y-4 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <Badge className={`text-xs `}>{badge.label}</Badge>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{progress}%</span>
          <button
            type="button"
            onClick={completed ? undefined : markCompleted}
            className={`text-xs px-3 py-1 rounded-md border ${
              completed
                ? "bg-green-100 text-green-700 border-green-300"
                : "bg-white text-gray-600 border-gray-300"
            }`}
          >
            {completed ? "Completed" : "Mark as completed"}
          </button>
        </div>
      </div>

      {/* Lesson Note */}
      {unit.type === "lesson-note" && (
        <>
          <div
            className="prose max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: unit.data.content }}
          />
          <button
            className="text-xs underline text-primary"
            onClick={() => updateProgress(100)}
          >
            Mark lesson as read
          </button>
        </>
      )}

      {/* Video */}
      {unit.type === "video" && unit.data.value && (
        <>
          <div className="w-full aspect-video rounded overflow-hidden">
            <iframe
              src={unit.data.value}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <button
            className="text-xs underline text-primary mt-2"
            onClick={() => updateProgress(100)}
          >
            Mark video as watched
          </button>
        </>
      )}

      {/* PDF / PPT */}
      {(unit.type === "pdf" || unit.type === "ppt") && unit.data.link && (
        <div className="space-y-3">
          <Button
            value="Open in new tab"
            onClick={() => window.open(unit.data.link, "_blank")}
          />

          <div className="w-full h-[500px] border border-lightGray rounded-md overflow-hidden bg-gray-50">
            {unit.type === "pdf" && (
              <iframe
                src={`${unit.data.link}#toolbar=0&navpanes=0`}
                className="w-full h-full"
                title="PDF Viewer"
              />
            )}

            {unit.type === "ppt" && (
              <iframe
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                  unit.data.link
                )}`}
                className="w-full h-full"
                title="Slides Viewer"
              />
            )}
          </div>
        </div>
      )}

      {/* Live */}
      {unit.type === "live" && unit.data.value && (
        <Button
          value="Join live session"
          onClick={() => window.open(unit.data.value, "_blank")}
        />
      )}

      {/* In-person */}
      {unit.type === "in-person" && (
        <p className="text-sm text-gray-600">
          📍 {unit.data.value}
        </p>
      )}

      {/* Assignment (MCQ) */}
      {unit.type === "assignment" && (
        <div className="space-y-4">
          {(unit.data.questions || []).map((q: any, idx: number) => (
            <div key={q.id} className="space-y-2 border rounded-md p-3">
              <p className="font-medium text-sm">
                {idx + 1}. {q.question}
              </p>

              {q.options.map((opt: any) => (
                <label key={opt.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={q.id}
                    onChange={() => {
                      console.log("Answered:", {
                        questionId: q.id,
                        selectedOption: opt.id,
                      });
                      updateProgress(
                        Math.round(((idx + 1) / unit.data.questions.length) * 100)
                      );
                    }}
                  />
                  {opt.text}
                </label>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Assignment (Essay) */}
      {unit.type === "assignment-essay" && (
        <div className="space-y-4">
          <div
            className="prose max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: unit.data.question }}
          />

          <input
            type="file"
            className="block text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                console.log("Essay submitted:", file.name);
                updateProgress(100);
                setCompleted(true);
              }
            }}
          />

          <p className="text-xs text-gray-500">
            Upload your answer as a document (PDF or Word).
          </p>
        </div>
      )}
    </div>
  );
};

export default LearningUnit;