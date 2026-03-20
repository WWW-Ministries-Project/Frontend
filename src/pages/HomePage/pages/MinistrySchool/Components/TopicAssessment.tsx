import { Button } from "@/components";
import { Actions } from "@/components/ui/form/Actions";
import EmptyState from "@/components/EmptyState";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { showNotification } from "@/pages/HomePage/utils";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { EnrollmentDataType } from "@/utils";
import { createLmsActionTracker, isLmsFeatureEnabled } from "../utils/lmsGuardrails";

const SCORE_MIN = 0;
const SCORE_MAX = 100;

type TopicStatus = "PASS" | "FAIL" | "PENDING";

const normalizeScore = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
};

const serializeTopicState = (topics: Topic[]) =>
  JSON.stringify(
    topics.map((topic) => ({
      id: topic.id,
      score: normalizeScore(topic.score),
      status: topic.status ?? "PENDING",
      notes: topic.notes ?? "",
    }))
  );

const buildScoreError = (score: number | null): string | null => {
  if (score === null) return null;
  if (score < SCORE_MIN || score > SCORE_MAX) {
    return `Score must be between ${SCORE_MIN} and ${SCORE_MAX}.`;
  }
  return null;
};

export const TopicAssessment = ({
  topics,
  editMode,
  enrollmentId,
  onCancel,
  toggleEditMode,
  onUpdate,
  loading,
  studentData: _studentData
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
  const gradingGuardrailsEnabled = isLmsFeatureEnabled("grading_guardrails");
  const [updatedTopics, setUpdatedTopics] = useState<Topic[]>([]);
  const [initialSnapshot, setInitialSnapshot] = useState<string>("[]");
  const [scoreErrors, setScoreErrors] = useState<Record<string, string>>({});
  const [bulkScore, setBulkScore] = useState("");
  const [bulkStatus, setBulkStatus] = useState<TopicStatus>("PASS");

  useEffect(() => {
    const nextTopics = topics ?? [];
    setUpdatedTopics(nextTopics);
    setInitialSnapshot(serializeTopicState(nextTopics));
    setScoreErrors({});
  }, [topics]);

  const averageScore = updatedTopics.length
    ? updatedTopics.reduce((acc, topic) => acc + (normalizeScore(topic.score) ?? 0), 0) /
      updatedTopics.length
    : 0;
  const progress = updatedTopics.length
    ? (updatedTopics.filter((topic) => topic.status === "PASS").length /
        updatedTopics.length) *
      100
    : 0;

  const hasUnsavedChanges = useMemo(() => {
    return serializeTopicState(updatedTopics) !== initialSnapshot;
  }, [initialSnapshot, updatedTopics]);

  useEffect(() => {
    if (!gradingGuardrailsEnabled || !editMode || !hasUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [editMode, gradingGuardrailsEnabled, hasUnsavedChanges]);

  const handleStatusChange = (id: number | string, newStatus: TopicStatus) => {
    setUpdatedTopics((prevTopics) =>
      prevTopics.map((topic) =>
        topic.id === id ? { ...topic, status: newStatus } : topic
      )
    );
  };

  const handleScoreChange = (id: number | string, value: string) => {
    const trimmed = value.trim();
    const parsedScore = trimmed === "" ? null : Number(trimmed);
    const isNumeric = parsedScore === null || Number.isFinite(parsedScore);
    const boundedError =
      parsedScore !== null && Number.isFinite(parsedScore)
        ? buildScoreError(parsedScore)
        : null;
    const errorMessage =
      trimmed !== "" && (!isNumeric || boundedError !== null)
        ? `Score must be between ${SCORE_MIN} and ${SCORE_MAX}.`
        : "";

    setUpdatedTopics((prevTopics) =>
      prevTopics.map((topic) =>
        topic.id === id
          ? {
              ...topic,
              score:
                trimmed === "" || !isNumeric
                  ? null
                  : parsedScore,
            }
          : topic
      )
    );

    setScoreErrors((prev) => {
      const next = { ...prev };
      if (errorMessage) {
        next[String(id)] = errorMessage;
      } else {
        delete next[String(id)];
      }
      return next;
    });
  };

  const applyBulkScore = () => {
    const parsed = Number(bulkScore);
    if (!Number.isFinite(parsed) || buildScoreError(parsed)) {
      showNotification(`Bulk score must be between ${SCORE_MIN} and ${SCORE_MAX}.`, "error");
      return;
    }

    setUpdatedTopics((prevTopics) =>
      prevTopics.map((topic) => ({
        ...topic,
        score: parsed,
      }))
    );
    setScoreErrors({});
    showNotification("Bulk score applied.", "success");
  };

  const applyBulkStatus = () => {
    setUpdatedTopics((prevTopics) =>
      prevTopics.map((topic) => ({
        ...topic,
        status: bulkStatus,
      }))
    );
    showNotification(`Status set to ${bulkStatus.toLowerCase()} for all topics.`, "success");
  };

  const validateTopics = () => {
    const validationErrors: Record<string, string> = {};

    updatedTopics.forEach((topic) => {
      const score = normalizeScore(topic.score);
      const scoreError = buildScoreError(score);

      if (scoreError) {
        validationErrors[String(topic.id)] = scoreError;
      }

      if ((topic.status === "PASS" || topic.status === "FAIL") && score === null) {
        validationErrors[String(topic.id)] =
          "Set a score before marking this topic as pass or fail.";
      }
    });

    setScoreErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      showNotification("Fix score validation issues before saving.", "error");
      return false;
    }

    return true;
  };

  const updateTopics = () => {
    if (gradingGuardrailsEnabled && !hasUnsavedChanges) {
      showNotification("No changes to save.", "success");
      return;
    }

    if (gradingGuardrailsEnabled && !validateTopics()) {
      return;
    }

    const progressUpdates = updatedTopics.map((topic) => {
      const normalizedScore = normalizeScore(topic.score);
      return {
        topicId: Number(topic.id),
        enrollmentId,
        score: normalizedScore === null ? undefined : normalizedScore,
        status: topic.status ?? "PENDING",
        notes: topic.notes ?? undefined,
      };
    });

    createLmsActionTracker("admin.student.progress_update", {
      enrollmentId,
      updates: progressUpdates.length,
    }).success();
    onUpdate({ progressUpdates });
  };

  const handleCancel = () => {
    if (gradingGuardrailsEnabled && hasUnsavedChanges) {
      const shouldDiscard = window.confirm(
        "You have unsaved changes. Do you want to discard them?"
      );
      if (!shouldDiscard) {
        return;
      }
    }

    setUpdatedTopics(topics ?? []);
    setScoreErrors({});
    setBulkScore("");
    onCancel();
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
        const scoreError = scoreErrors[String(row.original.id)];
        return (
          <div className="space-y-1 min-w-[110px]">
            {editMode ? (
              <input
                type="number"
                min={SCORE_MIN}
                max={SCORE_MAX}
                className={`px-3 py-2 border rounded-lg w-full ${
                  gradingGuardrailsEnabled && scoreError ? "border-red-400" : "border-lightGray"
                }`}
                value={row.original.score ?? ""}
                onChange={(e) => handleScoreChange(row.original.id, e.target.value)}
              />
            ) : (
              row.original.score ?? "-"
            )}
            {editMode && gradingGuardrailsEnabled && scoreError && (
              <p className="text-xs text-red-600">{scoreError}</p>
            )}
          </div>
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
                value={row.original.status ?? "PENDING"}
                onChange={(e) =>
                  handleStatusChange(
                    row.original.id,
                    e.target.value as TopicStatus
                  )
                }
              >
                <option value="PENDING">Pending</option>
                <option value="PASS">Pass</option>
                <option value="FAIL">Fail</option>
              </select>
            ) : (
              <p className="capitalize">
                {(row.original.status ?? "PENDING").toLowerCase()}
              </p>
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
                value={row.original.notes ?? ""}
                onChange={(e) => {
                  setUpdatedTopics((prevTopics) =>
                    prevTopics.map((topic) =>
                      topic.id === row.original.id
                        ? { ...topic, notes: e.target.value }
                        : topic
                    )
                  );
                }}
              />
            ) : (
              <p>{row.original.notes || "-"}</p>
            )}
          </>
        );
      },
    },
  ];

  return (
    <div className="py-4">
      <div className="space-y-6">
        <div className="flex justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Topic Assessment</h2>
            <p>Evaluate student performance for each topic in the program</p>
          </div>
          {!editMode && toggleEditMode && (
            <Button variant="primary" value="Edit" onClick={toggleEditMode} />
          )}
        </div>

        <div className="border px-4 p-2 rounded-xl space-y-2">
          <div>
            <h2 className="text-lg font-medium">Overall Assessment</h2>
            <p className="text-sm">Summary across all topics</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2">
            <div>
              <p className="font-medium text-lg">Average Score:</p>
              <p>{averageScore.toFixed(2)}%</p>
            </div>
            <div>
              <p className="font-medium text-lg">Progress:</p>
              <p>{progress.toFixed(2)}% Complete</p>
            </div>
          </div>
        </div>

        {editMode && gradingGuardrailsEnabled && (
          <div className="rounded-xl border border-lightGray bg-white p-4 space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-primaryGray">Bulk Score</label>
                  <input
                    type="number"
                    min={SCORE_MIN}
                    max={SCORE_MAX}
                    value={bulkScore}
                    onChange={(event) => setBulkScore(event.target.value)}
                    className="h-10 rounded-lg border border-lightGray px-3 text-sm"
                    placeholder="0-100"
                  />
                </div>
                <Button
                  value="Apply Score"
                  variant="secondary"
                  onClick={applyBulkScore}
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-primaryGray">Bulk Status</label>
                  <select
                    value={bulkStatus}
                    onChange={(event) => setBulkStatus(event.target.value as TopicStatus)}
                    className="h-10 rounded-lg border border-lightGray px-3 text-sm"
                  >
                    <option value="PASS">Pass</option>
                    <option value="FAIL">Fail</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>
                <Button
                  value="Apply Status"
                  variant="secondary"
                  onClick={applyBulkStatus}
                />
              </div>
            </div>

            {hasUnsavedChanges && (
              <p className="text-xs text-amber-700">
                You have unsaved grading changes.
              </p>
            )}
          </div>
        )}

        {updatedTopics.length === 0 ? (
          <EmptyState
            scope="section"
            msg="No topics found"
            description="No topics are available for assessment in this program."
          />
        ) : (
          <TableComponent columns={columns} data={updatedTopics ?? []} />
        )}

        {editMode && (
          <Actions
            onCancel={handleCancel}
            onSubmit={updateTopics}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

interface Topic {
  id: number | string;
  name: string;
  score?: number | null;
  status?: TopicStatus;
  notes?: string | null;
  completedAt?: string | null;
  progressId?: number;
}
