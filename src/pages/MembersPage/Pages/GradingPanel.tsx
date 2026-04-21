import SearchIcon from "@/assets/SearchIcon";
import { Button } from "@/components";
import EmptyState from "@/components/EmptyState";
import { ArrowLeftIcon, CheckIcon, ClockIcon, UsersIcon } from "@heroicons/react/24/outline";
import { useState, useMemo, useEffect, useCallback } from "react";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { ColumnDef } from "@tanstack/react-table";
import { useNavigate, useParams } from "react-router-dom";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import { ApiResponse } from "@/utils/interfaces";
import { showNotification } from "@/pages/HomePage/utils";


interface Submission {
  id: string;           // submission id
  studentId: string;    // USER id (who the grade is for)
  studentName: string;
  submittedAt: string;
  fileUrl?: string | null;
  status: "pending" | "graded";
  grade: number | null;
  gradeLabel?: string | null;
}

interface Assignment {
  title: string;
  submissions: Submission[];
}

interface BackendAssignmentResult {
  [key: string]: unknown;
}

const QUICK_GRADES = [100, 90, 80, 70, 60, 50];

type SafeRecord = Record<string, unknown>;

const asRecord = (value: unknown): SafeRecord =>
  value && typeof value === "object" ? (value as SafeRecord) : {};

const toSafeString = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const resolveGrade = (
  rawItem: SafeRecord,
  progress: SafeRecord,
  submission: SafeRecord
) => {
  const gradeCandidates = [
    progress.score,
    progress.grade,
    progress.mark,
    progress.marks,
    submission.grade,
    submission.mark,
    submission.marks,
    rawItem.score,
    rawItem.grade,
    rawItem.mark,
    rawItem.marks,
  ];

  for (const candidate of gradeCandidates) {
    const asNumber = toNumber(candidate);
    if (asNumber !== null) {
      const label = toSafeString(candidate) || String(asNumber);
      return { value: asNumber, label };
    }
  }

  return { value: null, label: null as string | null };
};

const resolveStatus = (rawItem: SafeRecord, submission: SafeRecord): Submission["status"] => {
  const rawStatus = (
    toSafeString(submission.status) ||
    toSafeString(rawItem.status)
  ).toUpperCase();

  if (!rawStatus) return "pending";
  if (rawStatus === "PENDING" || rawStatus === "SUBMITTED") return "pending";
  return "graded";
};

const resolveSubmittedAt = (rawItem: SafeRecord, submission: SafeRecord): string =>
  toSafeString(submission.submittedAt) ||
  toSafeString(submission.submitted_at) ||
  toSafeString(rawItem.submittedAt) ||
  toSafeString(rawItem.submitted_at);

const resolveFileUrl = (rawItem: SafeRecord, submission: SafeRecord): string =>
  toSafeString(submission.fileUrl) ||
  toSafeString(submission.file_url) ||
  toSafeString(rawItem.fileUrl) ||
  toSafeString(rawItem.file_url);

const resolveStudent = (rawItem: SafeRecord) => {
  const student = asRecord(rawItem.student);
  const fullName =
    toSafeString(student.name) ||
    [toSafeString(student.first_name), toSafeString(student.last_name)]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    [toSafeString(rawItem.first_name), toSafeString(rawItem.last_name)]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "Unknown student";

  const id =
    toSafeString(student.id) ||
    toSafeString(rawItem.studentId) ||
    toSafeString(rawItem.student_id) ||
    fullName;

  return { id, fullName };
};

const resolveSubmissionId = (rawItem: SafeRecord, submission: SafeRecord): string =>
  toSafeString(submission.id) ||
  toSafeString(rawItem.submissionId) ||
  toSafeString(rawItem.submission_id) ||
  toSafeString(rawItem.id) ||
  `${resolveStudent(rawItem).id}-${resolveSubmittedAt(rawItem, submission) || "submission"}`;

const normalizeResults = (rawResults: unknown): SafeRecord[] => {
  if (Array.isArray(rawResults)) return rawResults.map(asRecord);
  const record = asRecord(rawResults);
  if (Array.isArray(record.items)) return record.items.map(asRecord);
  if (Array.isArray(record.results)) return record.results.map(asRecord);
  if (Array.isArray(record.data)) return record.data.map(asRecord);
  return [];
};

const formatGradeLabel = (submission: Submission): string => {
  if (submission.gradeLabel && submission.gradeLabel.length > 0) return submission.gradeLabel;
  if (submission.grade === null) return "-";
  return String(submission.grade);
};

const mapBackendResultsToAssignment = (
  rawResults: unknown
): Assignment => {
  const results = normalizeResults(rawResults) as BackendAssignmentResult[];

  return {
    title: "Assignment Results",
    submissions: results
      .map((item) => ({
        ...(() => {
          const rawItem = asRecord(item);
          const submission = asRecord(rawItem.submission);
          const student = resolveStudent(rawItem);
          const progress = asRecord(rawItem.progress);
          const grade = resolveGrade(rawItem, progress, submission);

          return {
            id: resolveSubmissionId(rawItem, submission),
            studentId: student.id,
            studentName: student.fullName,
            submittedAt: resolveSubmittedAt(rawItem, submission),
            fileUrl: resolveFileUrl(rawItem, submission) || null,
            grade: grade.value,
            gradeLabel: grade.label,
            status: resolveStatus(rawItem, submission),
          };
        })(),
      })),
  };
};

const GradingPanel = () => {
  const navigate = useNavigate();
  const onBack = () => navigate(-1);
  const { programId } = useParams<{ programId: string }>();
  const { cohortId } = useParams<{ cohortId: string }>();
  const { topicId } = useParams<{ topicId: string }>();

  const { data, loading } = useFetch<ApiResponse<BackendAssignmentResult[]>>(
    api.fetch.fetchAssignmentResults as (
      query?: Record<string, string | number>
    ) => Promise<ApiResponse<BackendAssignmentResult[]>>,
    {
      programId: programId!,
      cohortId: cohortId!,
      topicId: topicId!,
    }
  );

  const [assignment, setAssignment] = useState<Assignment | null>(null);

  useEffect(() => {
    if (!data) return;
    setAssignment(mapBackendResultsToAssignment(data.data));
  }, [data]);

  const onGrade = useCallback((submissionId: string, grade: number) => {
    setAssignment(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        submissions: prev.submissions.map(s =>
          s.id === submissionId
            ? { ...s, grade, gradeLabel: String(grade), status: "graded" }
            : s
        ),
      };
    });
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "graded">("all");
  const [_editingId, _setEditingId] = useState<string | null>(null);
  const [_editingGrade, _setEditingGrade] = useState("");
  const [gradingSubmissionIds, setGradingSubmissionIds] = useState<string[]>([]);
  const [isBulkGrading, setIsBulkGrading] = useState(false);

  const setSubmissionGradingState = useCallback((submissionId: string, isGrading: boolean) => {
    setGradingSubmissionIds((current) => {
      if (isGrading) {
        return current.includes(submissionId) ? current : [...current, submissionId];
      }

      return current.filter((id) => id !== submissionId);
    });
  }, []);

  const gradeSubmission = useCallback(
    async (submission: Submission, grade: number) => {
      setSubmissionGradingState(submission.id, true);

      try {
        await api.put.gradeAssignmentSubmission({
          submissionId: submission.id,
          grade,
        });

        onGrade(submission.id, grade);
        showNotification(`Grade saved for ${submission.studentName}.`, "success");
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        showNotification(
          err.response?.data?.message || "Could not save grade. Please try again.",
          "error",
        );
      } finally {
        setSubmissionGradingState(submission.id, false);
      }
    },
    [onGrade, setSubmissionGradingState],
  );

  const gradeSubmissionsBulk = useCallback(
    async (submissions: Submission[], grade: number) => {
      if (!submissions.length) return;

      setIsBulkGrading(true);
      setGradingSubmissionIds((current) => [
        ...new Set([...current, ...submissions.map((submission) => submission.id)]),
      ]);

      try {
        await api.put.gradeAssignmentSubmissions({
          submissionIds: submissions.map((submission) => submission.id),
          grade,
        });

        submissions.forEach((submission) => onGrade(submission.id, grade));
        showNotification(`Saved ${submissions.length} grade${submissions.length === 1 ? "" : "s"}.`, "success");
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        showNotification(
          err.response?.data?.message || "Could not save selected grades. Please try again.",
          "error",
        );
      } finally {
        setIsBulkGrading(false);
        setGradingSubmissionIds((current) =>
          current.filter((id) => !submissions.some((submission) => submission.id === id)),
        );
      }
    },
    [onGrade],
  );

  const handleInlineGrade = useCallback(async (submissionId: string) => {
    if (_editingGrade) {
      const numGrade = Number(_editingGrade);
      if (Number.isNaN(numGrade)) return;
      const safeGrade = Math.min(100, Math.max(0, numGrade));

      const submission = assignment?.submissions.find(s => s.id === submissionId);
      if (!submission) return;

      await gradeSubmission(submission, safeGrade);
    }
    _setEditingId(null);
    _setEditingGrade("");
  }, [_editingGrade, assignment, gradeSubmission]);

  const startEditing = (submission: Submission) => {
    _setEditingId(submission.id);
    _setEditingGrade(submission.grade?.toString() || "");
  };

  const columns = useMemo<ColumnDef<Submission>[]>(() => [
    {
      accessorKey: "studentName",
      header: "Student",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.studentName}</span>
      ),
    },
    {
      accessorKey: "submittedAt",
      header: "Submitted",
      cell: ({ row }) => {
        const date = new Date(row.original.submittedAt);
        return isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
      },
    },
    {
      accessorKey: "fileUrl",
      header: "File",
      cell: ({ row }) =>
        row.original.fileUrl ? (
          <a
            href={row.original.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Open file
          </a>
        ) : (
          "—"
        ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) =>
        row.original.status === "pending" ? (
          <span className="inline-flex rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
            Pending
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
            Graded
          </span>
        ),
    },
    {
      id: "grade",
      header: "Grade",
      cell: ({ row }) => {
        const submission = row.original;
        const isSaving = gradingSubmissionIds.includes(submission.id);

        if (_editingId === submission.id) {
          return (
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="w-24 rounded-md border border-lightGray px-2 py-1"
                value={_editingGrade}
                disabled={isSaving}
                onChange={(e) => _setEditingGrade(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleInlineGrade(submission.id);
                  if (e.key === "Escape") {
                    _setEditingId(null);
                    _setEditingGrade("");
                  }
                }}
              />
              <Button
                onClick={() => {
                  void handleInlineGrade(submission.id);
                }}
                value={isSaving ? "..." : "✓"}
                disabled={isSaving}
              />
            </div>
          );
        }

        if (submission.grade !== null) {
          return (
            <div className="flex items-center gap-2">
              <span className="font-semibold">{formatGradeLabel(submission)}</span>
              <Button
                variant="ghost"
                onClick={() => startEditing(submission)}
                value="Edit"
                disabled={isSaving}
              />
            </div>
          );
        }

        return (
          <div className="flex items-center gap-1">
            {QUICK_GRADES.slice(0, 4).map((grade) => (
              <Button
                key={grade}
                variant="secondary"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  void gradeSubmission(submission, grade);
                }}
                value={String(grade)}
                disabled={isSaving}
              />
            ))}
            <Button
              variant="ghost"
              onClick={() => startEditing(submission)}
              value="Custom"
              disabled={isSaving}
            />
          </div>
        );
      },
    },
  ], [_editingId, _editingGrade, gradingSubmissionIds, gradeSubmission, handleInlineGrade]);

  const filteredSubmissions = useMemo(() => {
    if (!assignment) return [];
    return assignment.submissions.filter((s) => {
      const matchesSearch = s.studentName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "pending" && s.status === "pending") ||
        (filterStatus === "graded" && s.status === "graded");
      return matchesSearch && matchesStatus;
    });
  }, [assignment, searchQuery, filterStatus]);

  const pendingCount = assignment?.submissions.filter(s => s.status === "pending").length || 0;
  const gradedCount = assignment?.submissions.filter(s => s.status === "graded").length || 0;
  const totalCount = assignment?.submissions.length || 0;

  const progress =
    totalCount === 0 ? 0 : Math.round((gradedCount / totalCount) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        Loading assignment results...
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
        <p className="mb-4 text-muted-foreground">Select an assignment to grade</p>
        <Button variant="secondary" value="Back to Assignment" onClick={onBack}/>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border w-full">
      {/* Header */}
      <div className="border-b border-border p-6">
        <button
          onClick={onBack}
          className="mb-3 flex items-center gap-1  text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to assignments
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{assignment.title}</h2>
            <div className="mt-2 flex items-center gap-4  text-muted-foreground">
              <span className="flex items-center gap-1">
                <UsersIcon className="h-4 w-4" />
                {totalCount} submissions
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4 text-amber-600" />
                {pendingCount} pending
              </span>
              <span className="flex items-center gap-1">
                <CheckIcon className="h-4 w-4 text-green-600" />
                {gradedCount} graded
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="text-right">
            <p className=" font-medium text-foreground">
              {progress}% complete
            </p>
            <div className="mt-1 h-2 w-32 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            id="search-students"
            name="search"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-lightGray py-2 pl-9 pr-3"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={filterStatus === "all" ? "primary" : "secondary"}
            value="All"
            onClick={() => setFilterStatus("all")}
          />
          <Button
            variant={filterStatus === "pending" ? "primary" : "secondary"}
            value="Pending"
            onClick={() => setFilterStatus("pending")}
          />
          <Button
            variant={filterStatus === "graded" ? "primary" : "secondary"}
            value="Graded"
            onClick={() => setFilterStatus("graded")}
          />
        </div>
      </div>
      {/* Table */}
      {filteredSubmissions.length > 0 ? (
        <div className="overflow-x-auto p-6">
          <TableComponent
            data={filteredSubmissions}
            columns={columns}
            enableSelection={_editingId === null && !isBulkGrading}
            bulkActions={_editingId === null ? QUICK_GRADES.map((g) => ({
              label: `${g}%`,
              value: String(g),
            })) : []}
            onBulkAction={(rows, action) => {
              const grade = Number(action);
              if (Number.isNaN(grade)) return;
              void gradeSubmissionsBulk(rows, grade);
            }}
          />
        </div>
      ) : (
        <EmptyState
          scope="section"
          msg={
            assignment.submissions.length === 0
              ? "No submissions yet"
              : "No submissions match your filters"
          }
          description={
            assignment.submissions.length === 0
              ? "Student submissions for this assignment will appear here."
              : "Try changing your filters or search term."
          }
        />
      )}
    </div>
  );
};

export default GradingPanel;
