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


interface Submission {
  id: string;           // submission id
  studentId: string;    // USER id (who the grade is for)
  studentName: string;
  submittedAt: string;
  status: "pending" | "graded";
  grade: number | null;
}

interface Assignment {
  title: string;
  submissions: Submission[];
}

interface BackendAssignmentResult {
  submission: {
    id: number | string;
    submittedAt: string;
    score: number | null;
    status: string;
  };
  student: {
    id: number | string;
    name: string;
  };
}

const QUICK_GRADES = [100, 90, 80, 70, 60, 50];

/**
 * Submit a single grade to backend
 */
const submitGradeToBackend = (payload: {
  submissionId: string;
  studentId: string;
  grade: number;
}) => {
  void payload;
};

/**
 * Submit multiple grades (bulk grading) to backend
 */
const submitBulkGradesToBackend = (payload: {
  submissionIds: string[];
  studentIds: string[];
  grade: number;
}) => {
  void payload;
};

const mapBackendResultsToAssignment = (
  rawResults: unknown
): Assignment => {
  const results = Array.isArray(rawResults)
    ? (rawResults as BackendAssignmentResult[])
    : [];

  return {
    title: "Assignment Results",
    submissions: results
      .filter((item) => item?.submission && item?.student)
      .map((item) => ({
        id: String(item.submission.id),
        studentId: String(item.student.id),
        studentName: item.student.name,
        submittedAt: item.submission.submittedAt,
        grade: item.submission.score ?? null,
        status: item.submission.status === "GRADED" ? "graded" : "pending",
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
            ? { ...s, grade, status: "graded" }
            : s
        ),
      };
    });
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "graded">("all");
  const [_editingId, _setEditingId] = useState<string | null>(null);
  const [_editingGrade, _setEditingGrade] = useState("");

  const handleInlineGrade = useCallback((submissionId: string) => {
    if (_editingGrade) {
      const numGrade = Number(_editingGrade);
      if (Number.isNaN(numGrade)) return;
      const safeGrade = Math.min(100, Math.max(0, numGrade));

      const submission = assignment?.submissions.find(s => s.id === submissionId);
      if (!submission) return;

      submitGradeToBackend({
        submissionId,
        studentId: submission.studentId,
        grade: safeGrade,
      });

      // Note: onGrade is expected to mark the status as "graded" in parent state
      onGrade(submissionId, safeGrade);
    }
    _setEditingId(null);
    _setEditingGrade("");
  }, [_editingGrade, assignment, onGrade]);

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

        if (_editingId === submission.id) {
          return (
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="w-24 rounded-md border border-lightGray px-2 py-1"
                value={_editingGrade}
                onChange={(e) => _setEditingGrade(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleInlineGrade(submission.id);
                  if (e.key === "Escape") {
                    _setEditingId(null);
                    _setEditingGrade("");
                  }
                }}
              />
              <Button onClick={() => handleInlineGrade(submission.id)} value="✓" />
            </div>
          );
        }

        if (submission.grade !== null) {
          return (
            <div className="flex items-center gap-2">
              <span className="font-semibold">{submission.grade}%</span>
              <Button
                variant="ghost"
                onClick={() => startEditing(submission)}
                value="Edit"
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
                  submitGradeToBackend({
                    submissionId: submission.id,
                    studentId: submission.studentId,
                    grade,
                  });

                  // Note: onGrade is expected to mark the status as "graded" in parent state
                  onGrade(submission.id, grade);
                }}
                value={String(grade)}
              />
            ))}
            <Button
              variant="ghost"
              onClick={() => startEditing(submission)}
              value="Custom"
            />
          </div>
        );
      },
    },
  ], [_editingId, _editingGrade, handleInlineGrade, onGrade]);

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
            enableSelection={_editingId === null}
            bulkActions={_editingId === null ? QUICK_GRADES.map((g) => ({
              label: `${g}%`,
              value: String(g),
            })) : []}
            onBulkAction={(rows, action) => {
              const grade = Number(action);
              if (Number.isNaN(grade)) return;
              const submissionIds = rows.map((row) => row.id);

              submitBulkGradesToBackend({
                submissionIds,
                studentIds: rows.map((row) => row.studentId),
                grade,
              });

              // Note: onGrade is expected to mark the status as "graded" in parent state
              rows.forEach((row) => onGrade(row.id, grade));
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
