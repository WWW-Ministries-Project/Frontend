import SearchIcon from "@/assets/SearchIcon";
import { Button } from "@/components";
import Input from "@/components/Input";
import { ArrowLeftIcon, CheckIcon, ClockIcon, UsersIcon } from "@heroicons/react/24/outline";
import { useState, useMemo } from "react";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { ColumnDef } from "@tanstack/react-table";


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

interface GradingPanelProps {
  assignment: Assignment | null;
  onGrade: (submissionId: string, grade: number) => void;
  onBack: () => void;
}

type FilterStatus = "all" | "pending" | "graded";

const QUICK_GRADES = [100, 90, 80, 70, 60, 50];

/**
 * Submit a single grade to backend
 */
const submitGradeToBackend = (payload: {
  submissionId: string;
  studentId: string;
  grade: number;
}) => {
  console.log("Submitting single grade to backend:", payload);
};

/**
 * Submit multiple grades (bulk grading) to backend
 */
const submitBulkGradesToBackend = (payload: {
  submissionIds: string[];
  studentIds: string[];
  grade: number;
}) => {
  console.log("Submitting bulk grades to backend:", payload);
};

// Column definitions for TableComponent
let editingId: string | null;
let editingGrade: string;
let setEditingId: (id: string | null) => void;
let setEditingGrade: (grade: string) => void;
let handleInlineGrade: (id: string) => void;
let startEditing: (submission: Submission) => void;
let onGrade: (id: string, grade: number) => void;

const columns: ColumnDef<Submission>[] = [
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
    cell: ({ row }) =>
      new Date(row.original.submittedAt).toLocaleDateString(),
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

      if (editingId === submission.id) {
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={editingGrade}
              onChange={(e) => setEditingGrade(e.target.value)}
              // className="h-8 w-20 p-0"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleInlineGrade(submission.id);
                if (e.key === "Escape") {
                  setEditingId(null);
                  setEditingGrade("");
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
];

const GradingPanel = ({ assignment, onGrade: _onGrade, onBack }: GradingPanelProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [_editingId, _setEditingId] = useState<string | null>(null);
  const [_editingGrade, _setEditingGrade] = useState("");

  // Bindings for columns
  editingId = _editingId;
  setEditingId = _setEditingId;
  editingGrade = _editingGrade;
  setEditingGrade = _setEditingGrade;
  onGrade = _onGrade;

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

  handleInlineGrade = (submissionId: string) => {
    if (_editingGrade) {
      const numGrade = Math.min(100, Math.max(0, parseInt(_editingGrade)));

      submitGradeToBackend({
        submissionId,
        studentId: assignment.submissions.find(s => s.id === submissionId)!.studentId,
        grade: numGrade,
      });

      _onGrade(submissionId, numGrade);
    }
    _setEditingId(null);
    _setEditingGrade("");
  };

  startEditing = (submission: Submission) => {
    _setEditingId(submission.id);
    _setEditingGrade(submission.grade?.toString() || "");
  };

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
              {Math.round((gradedCount / totalCount) * 100) || 0}% complete
            </p>
            <div className="mt-1 h-2 w-32 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(gradedCount / totalCount) * 100 || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            id="search-students"
            name="search"
            label="Search"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      {/* Table */}
      {filteredSubmissions.length > 0 ? (
        <div className="overflow-x-auto p-6">
          <TableComponent
            data={filteredSubmissions}
            columns={columns}
            enableSelection
            bulkActions={QUICK_GRADES.map((g) => ({
              label: `${g}%`,
              value: String(g),
            }))}
            onBulkAction={(rows, action) => {
              const grade = Number(action);
              const submissionIds = rows.map((row) => row.id);

              submitBulkGradesToBackend({
                submissionIds,
                studentIds: rows.map((row) => row.studentId),
                grade,
              });

              rows.forEach((row) => _onGrade(row.id, grade));
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className=" text-muted-foreground">
            {assignment.submissions.length === 0
              ? "No submissions yet"
              : "No submissions match your filters"}
          </p>
        </div>
      )}
    </div>
  );
};

export default GradingPanel;
