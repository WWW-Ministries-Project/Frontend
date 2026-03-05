import { Button } from "@/components";
import EmptyState from "@/components/EmptyState";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { ColumnDef } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { isLmsFeatureEnabled } from "../utils/lmsGuardrails";

export interface Student {
  id: number;
  user_id?: number | string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email: string;
  phone?: string;
  primary_number?: string;
  country_code?: string;
  status: string;
  progress_completed: number;
  progress_total: number;
  progress_percent: number;
  progress_status?: string;
  memberType?: string;
  userId?: string;
}

interface StudentDetailsState {
  studentDetails: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface StudentListQuery {
  search: string;
  status: string;
  sortBy: "name" | "email" | "progress_percent" | "status";
  sortOrder: "asc" | "desc";
  page: number;
  take: number;
}

const DEFAULT_QUERY: StudentListQuery = {
  search: "",
  status: "all",
  sortBy: "name",
  sortOrder: "asc",
  page: 1,
  take: 20,
};

const trimValue = (value?: string | null): string => (value ?? "").trim();

const buildPhone = (
  countryCode?: string | null,
  number?: string | null
): string => [trimValue(countryCode), trimValue(number)].filter(Boolean).join(" ").trim();

const resolveStudentName = (student: Student): string => {
  const firstName = trimValue(student.first_name || student.firstName);
  const lastName = trimValue(student.last_name || student.lastName);
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName || trimValue(student.name) || "Student";
};

const resolveStudentPhone = (student: Student): string =>
  buildPhone(student.country_code, student.primary_number || student.phone);

export const AllStudents = ({
  Data,
  onOpen,
  query,
  onQueryChange,
  onPageChange,
  total,
  loading = false,
  onBulkAction,
}: {
  Data: Student[];
  onOpen: () => void;
  query?: StudentListQuery;
  onQueryChange?: (next: Partial<StudentListQuery>) => void;
  onPageChange?: (page: number, take: number) => void;
  total?: number;
  loading?: boolean;
  onBulkAction?: (selectedRows: Student[], action: string) => void | Promise<void>;
}) => {
  const navigate = useNavigate();
  const advancedOpsEnabled = isLmsFeatureEnabled("server_student_operations");
  const [internalQuery, setInternalQuery] = useState<StudentListQuery>(DEFAULT_QUERY);
  const effectiveQuery = query ?? internalQuery;
  const [searchInput, setSearchInput] = useState(effectiveQuery.search);

  const updateQuery = useCallback(
    (next: Partial<StudentListQuery>) => {
      if (onQueryChange) {
        onQueryChange(next);
        return;
      }

      setInternalQuery((prev) => ({
        ...prev,
        ...next,
      }));
    },
    [onQueryChange]
  );

  useEffect(() => {
    setSearchInput(effectiveQuery.search);
  }, [effectiveQuery.search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchInput === effectiveQuery.search) return;
      updateQuery({ search: searchInput, page: 1 });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [effectiveQuery.search, searchInput, updateQuery]);

  const handleViewStudent = (student: Student) => {
    const state: StudentDetailsState = {
      studentDetails: {
        name: resolveStudentName(student),
        email: student.email || "",
        phone: resolveStudentPhone(student),
      },
    };

    navigate(`student/${student.id}`, { state });
  };

  const locallyProcessedData = useMemo(() => {
    let next = [...(Data ?? [])];

    const search = effectiveQuery.search.toLowerCase().trim();
    if (search) {
      next = next.filter((student) => {
        return (
          resolveStudentName(student).toLowerCase().includes(search) ||
          resolveStudentPhone(student).toLowerCase().includes(search) ||
          student?.email?.toLowerCase().includes(search)
        );
      });
    }

    if (effectiveQuery.status !== "all") {
      next = next.filter(
        (student) => trimValue(student.status).toLowerCase() === effectiveQuery.status.toLowerCase()
      );
    }

    const sortFactor = effectiveQuery.sortOrder === "asc" ? 1 : -1;

    next.sort((a, b) => {
      if (effectiveQuery.sortBy === "progress_percent") {
        return (a.progress_percent - b.progress_percent) * sortFactor;
      }

      if (effectiveQuery.sortBy === "email") {
        return a.email.localeCompare(b.email) * sortFactor;
      }

      if (effectiveQuery.sortBy === "status") {
        return trimValue(a.status).localeCompare(trimValue(b.status)) * sortFactor;
      }

      return resolveStudentName(a).localeCompare(resolveStudentName(b)) * sortFactor;
    });

    return next;
  }, [
    Data,
    effectiveQuery.search,
    effectiveQuery.sortBy,
    effectiveQuery.sortOrder,
    effectiveQuery.status,
  ]);

  const rows = onQueryChange ? Data : locallyProcessedData;
  const hasData = rows.length > 0;

  const columns: ColumnDef<Student>[] = [
    {
      header: "First Name",
      id: "first_name",
      cell: ({ row }) => {
        const student = row.original;
        const firstName = trimValue(student.first_name || student.firstName);
        return firstName || resolveStudentName(student).split(" ").slice(0, -1).join(" ") || "-";
      },
    },
    {
      header: "Last Name",
      id: "last_name",
      cell: ({ row }) => {
        const student = row.original;
        const lastName = trimValue(student.last_name || student.lastName);
        return lastName || resolveStudentName(student).split(" ").slice(-1)[0] || "-";
      },
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Phone",
      id: "phone",
      cell: ({ row }) => resolveStudentPhone(row.original) || "-",
    },
    {
      header: "Status",
      id: "status",
      cell: ({ row }) => {
        const status = trimValue(row.original.status) || "Unknown";
        return <span className="capitalize">{status.toLowerCase()}</span>;
      },
    },
    {
      id: "progress",
      header: "Progress",
      cell: ({ row }) => {
        const {
          progress_completed,
          progress_total,
          progress_percent,
        } = row.original;

        return (
          <div className="space-y-1 min-w-[140px]">
            <div className="flex justify-between text-xs text-primaryGray">
              <span>
                {progress_completed}/{progress_total} done
              </span>
              <span>{progress_percent}%</span>
            </div>

            <div className="h-2 bg-lightGray rounded-full overflow-hidden">
              <div
                className="h-2 bg-primary rounded-full transition-all"
                style={{ width: `${progress_percent}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      header: "Actions",
      cell: ({ row }) => (
        <Button
          value="View"
          variant="secondary"
          className="text-primary"
          onClick={() => handleViewStudent(row.original)}
        />
      ),
    },
  ];

  const statusOptions = useMemo(() => {
    const dynamicStatuses = Array.from(
      new Set((Data ?? []).map((student) => trimValue(student.status)).filter(Boolean))
    );
    return ["all", ...dynamicStatuses];
  }, [Data]);

  return (
    <div className="space-y-4 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid w-full gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-primaryGray">Search</label>
            <input
              type="text"
              placeholder="Search students..."
              className="h-10 w-full rounded-lg border border-lightGray px-3 text-sm"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {advancedOpsEnabled && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-primaryGray">Status</label>
              <select
                className="h-10 w-full rounded-lg border border-lightGray px-3 text-sm"
                value={effectiveQuery.status}
                onChange={(event) => updateQuery({ status: event.target.value, page: 1 })}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === "all" ? "All statuses" : status}
                  </option>
                ))}
              </select>
            </div>
          )}

          {advancedOpsEnabled && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-primaryGray">Sort By</label>
              <select
                className="h-10 w-full rounded-lg border border-lightGray px-3 text-sm"
                value={effectiveQuery.sortBy}
                onChange={(event) =>
                  updateQuery({
                    sortBy: event.target.value as StudentListQuery["sortBy"],
                    page: 1,
                  })
                }
              >
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="progress_percent">Progress</option>
                <option value="status">Status</option>
              </select>
            </div>
          )}

          {advancedOpsEnabled && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-primaryGray">Order</label>
              <select
                className="h-10 w-full rounded-lg border border-lightGray px-3 text-sm"
                value={effectiveQuery.sortOrder}
                onChange={(event) =>
                  updateQuery({
                    sortOrder: event.target.value as StudentListQuery["sortOrder"],
                    page: 1,
                  })
                }
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={onOpen}
            className="h-10 whitespace-nowrap rounded-lg bg-primary px-4 text-sm text-white"
          >
            Enroll student
          </button>
        </div>
      </div>

      {loading && !hasData ? (
        <div className="rounded-lg border border-lightGray bg-white p-4 text-sm text-primaryGray">
          Loading students...
        </div>
      ) : !hasData ? (
        <EmptyState scope="section" msg={"No students found"} />
      ) : (
        <>
          <div className="hidden md:block">
            <TableComponent
              data={rows}
              columns={columns}
              enableSelection={advancedOpsEnabled && Boolean(onBulkAction)}
              onBulkAction={(selectedRows, action) =>
                onBulkAction?.(selectedRows as Student[], action)
              }
              bulkActions={
                advancedOpsEnabled && onBulkAction
                  ? [
                      { label: "Set Active", value: "status_active" },
                      { label: "Set Completed", value: "status_completed" },
                      { label: "Set Pending", value: "status_pending" },
                      { label: "Unenroll", value: "unenroll", variant: "danger" as const },
                    ]
                  : []
              }
              total={total}
              displayedCount={effectiveQuery.take}
              onPageChange={(page, take) => {
                if (onPageChange) {
                  onPageChange(page, take);
                } else {
                  updateQuery({ page, take });
                }
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:hidden">
            {rows.map((student) => (
              <div
                key={student.id}
                className="rounded-xl border border-lightGray p-4 space-y-3 bg-white shadow-sm"
              >
                <div className="flex gap-y-2 justify-between items-start">
                  <div className="flex flex-col gap-y-2">
                    <p className="flex items-center gap-1 font-semibold text-primary">
                      <UserIcon className="w-4 h-4 text-primaryGray" />
                      {resolveStudentName(student)}
                    </p>

                    <p className="flex items-center gap-1 text-sm text-primaryGray">
                      <EnvelopeIcon className="w-4 h-4" />
                      {student.email}
                    </p>

                    <p className="flex items-center gap-1 text-sm text-primaryGray">
                      <PhoneIcon className="w-4 h-4" />
                      {resolveStudentPhone(student) || "-"}
                    </p>
                  </div>

                  <Button
                    value="View"
                    variant="secondary"
                    className="text-primary"
                    onClick={() => handleViewStudent(student)}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-primaryGray">
                    <span>
                      {student.progress_completed}/{student.progress_total} done
                    </span>
                    <span>{student.progress_percent}%</span>
                  </div>

                  <div className="h-2 bg-lightGray rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-primary rounded-full transition-all"
                      style={{ width: `${student.progress_percent}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
