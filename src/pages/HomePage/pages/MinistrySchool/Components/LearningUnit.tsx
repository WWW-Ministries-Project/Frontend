import React, { useState } from "react";
import { Button } from "@/components";
import { Badge } from "@/components/Badge";
import { api, LearningUnit, LearningUnitType } from "@/utils";
import { showNotification } from "@/pages/HomePage/utils";
import { usePut } from "@/CustomHooks/usePut";
import { usePost } from "@/CustomHooks/usePost";



interface Props {
  topicId?: string | number;
  unit: LearningUnit | null | undefined;

  // topic-level state (authoritative)
  topicCompleted?: boolean;
  topicStatus?: "PASS" | "FAIL" | "PENDING";
  topicScore?: number;
  topicCompletedAt?: string | null;
  activation?: {
    isActive: boolean;
    activatedAt?: string | null;
    dueDate?: string | null;
    closedAt?: string | null;
  };

  userId?: string | number;
  programId?: string | number;
  refetch: () => void;
}

const typeBadgeMap: Record<
  LearningUnitType,
  { label: string; className: string }
> = {
  "lesson-note": { label: "Lesson Note", className: "bg-lightGray/40 text-primaryGray" },
  video: { label: "Video", className: "bg-primary/10 text-primary" },
  pdf: { label: "PDF", className: "bg-red-100 text-red-700" },
  ppt: { label: "Slides", className: "bg-yellow-100 text-yellow-700" },
  live: { label: "Live", className: "bg-green-100 text-green-700" },
  "in-person": {
    label: "In-person",
    className: "bg-secondary/10 text-secondary",
  },
  assignment: {
    label: "Assignment (MCQ)",
    className: "bg-accent/10 text-accent",
  },
  "assignment-essay": {
    label: "Assignment (Essay)",
    className: "bg-lighter/10 text-lighter",
  },
};

export const LearningUnits: React.FC<Props> = ({
  unit,
  topicId,
  userId,
  programId,
  topicCompleted,
  topicStatus,
  topicScore,
  topicCompletedAt,
  activation,
  refetch,
}) => {

  const {
    postData,
  } = usePost(api.post.submitMCQAssignment);

  const { updateData: markTopicAsCompleted } = usePut(
    api.put.markTopicAsCompleted);

  // MCQ state
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // Removed: const [submitted, setSubmitted] = useState(false);

  const [attempt, setAttempt] = useState(0);
  const maxAttempt =
    unit?.type === "assignment" ? unit.data.maxAttempt ?? 2 : 2;

  // Added topic-driven derived state
  const isAssignment = unit?.type === "assignment";
  const isSubmitted = isAssignment && topicCompleted === true;
  const assignmentStatus = topicStatus;

  const markCompleted = async () => {
    try {
      const payload = {
        topicId,
        userId,
      };
      await markTopicAsCompleted(payload);
      await refetch();
    } catch {
      showNotification("Could not update topic completion. Please try again.", "error");
    }
  };

  const badge = unit ? typeBadgeMap[unit.type] : undefined;

  return (
    <div className="border border-lightGray rounded-lg p-4 space-y-4 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <Badge className={`text-xs ${badge?.className ?? ""}`}>{badge?.label}</Badge>

        <div className="flex items-center gap-3">
          {unit?.type !== "assignment" && (
          <button
            type="button"
            onClick={topicCompleted ? undefined : markCompleted}
            className={`text-xs px-3 py-1 rounded-md border ${
              topicCompleted
                ? "bg-green-100 text-green-700 border-green-300"
                : "bg-white text-primaryGray border-lightGray"
            }`}
          >
            {topicCompleted ? "Completed" : "Mark as completed"}
          </button>
          )}
        </div>
      </div>

      {/* Lesson Note */}
      {unit?.type === "lesson-note" && (
        <>
          <div
            className="prose max-w-none text-primaryGray"
            dangerouslySetInnerHTML={{ __html: unit.data.content }}
          />
          
        </>
      )}

      {/* Video */}
      {unit?.type === "video" && unit.data.value && (
        <>
          <div className="w-full aspect-video rounded overflow-hidden">
            <iframe
              src={unit.data.value}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          
        </>
      )}

      {/* PDF / PPT */}
      {(unit?.type === "pdf" || unit?.type === "ppt") && unit.data.link && (
        <div className="space-y-3">
          <Button
            value="Open in new tab"
            onClick={() => window.open(unit.data.link, "_blank")}
          />

          <div className="w-full h-[500px] border border-lightGray rounded-md overflow-hidden bg-lightGray/20">
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
      {unit?.type === "live" && unit.data.value && (
        <Button
          value="Join live session"
          onClick={() => window.open(unit.data.value, "_blank")}
        />
      )}

      {/* In-person */}
      {unit?.type === "in-person" && (
        <p className="text-sm text-primaryGray">
          📍 {unit.data.value}
        </p>
      )}

      {/* Assignment (MCQ) */}
      {unit?.type === "assignment" && (
        <div className="relative">
          {!activation?.isActive && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-md text-center px-6">
              <p className="text-sm text-primaryGray">
                This assignment is not yet active.<br />
                You will be notified once it becomes available.
                {activation?.isActive}
              </p>
            </div>
          )}

          <div className={`${!activation?.isActive ? "pointer-events-none blur-sm opacity-60" : ""} space-y-4`}>
            {!isSubmitted && (
              <>
                {(unit.data.questions || []).map((q, idx) => (
                  <div key={q.id} className="space-y-2 border rounded-md p-3">
                    <p className="font-medium text-sm">
                      {idx + 1}. {q.question}
                    </p>

                    {q.options.map((opt) => (
                      <label key={opt.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name={q.id}
                          disabled={isSubmitted}
                          checked={answers[q.id] === opt.id}
                          onChange={() =>
                            setAnswers((prev) => ({
                              ...prev,
                              [q.id]: opt.id,
                            }))
                          }
                        />
                        {opt.text}
                      </label>
                    ))}
                  </div>
                ))}

                <button
                  type="button"
                  disabled={
                    isSubmitted ||
                    Object.keys(answers).length !== unit.data.questions.length
                  }
                  className="mt-2 px-4 py-2 text-sm rounded-md bg-primary text-white disabled:opacity-50"
                  onClick={async () => {
                    const payload = {
                      userId,
                      programId,
                      topicId,
                      answers,
                    };

                    try {
                      await postData(payload);
                      setAttempt((prev) => prev + 1);
                      await refetch(); // backend updates completed, status, score
                    } catch {
                      showNotification("Could not submit assignment. Please try again.", "error");
                    }
                  }}
                >
                  Submit Assignment
                </button>
              </>
            )}

            {isSubmitted && (
              <div className="space-y-4 text-center">
                <p className="text-lg font-semibold">
                  Score: {topicScore ?? 0}%
                </p>

                <Badge
                  className={
                    assignmentStatus === "PASS"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }
                >
                  {assignmentStatus}
                </Badge>

                <p className="text-xs text-primaryGray">
                  Completed on {topicCompletedAt
                    ? new Date(topicCompletedAt).toLocaleString()
                    : ""}
                </p>

                {assignmentStatus === "FAIL" && attempt < maxAttempt && (
                  <button
                    type="button"
                    className="mt-4 rounded-md bg-lightGray/30 px-4 py-2 text-sm hover:bg-lightGray/50"
                    onClick={() => {
                      setAnswers({});
                    }}
                  >
                    Retake Assignment
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assignment (Essay) */}
      {unit?.type === "assignment-essay" && (
        <div className="space-y-4">
          <div
            className="prose max-w-none text-primaryGray"
            dangerouslySetInnerHTML={{ __html: unit.data.question }}
          />

          <input
            type="file"
            className="block text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                showNotification(`Selected file: ${file.name}`, "success");
              }
            }}
          />

          <p className="text-xs text-primaryGray">
            Upload your answer as a document (PDF or Word).
          </p>
        </div>
      )}
    </div>
  );
};

export default LearningUnits;
