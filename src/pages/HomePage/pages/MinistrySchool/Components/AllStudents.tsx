import { Button } from "@/components";
import EmptyState from "@/components/EmptyState";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";

interface Student {
  id: number;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  name: string;
  email: string;
  phone?: string;
  primary_number?: string;
  status: string;
  progress_completed: number;
  progress_total: number;
  progress_percent: number;
  progress_status: string;
  memberType: string;
  userId?: string; // Added userId property
}

export const AllStudents = ({
  Data,
  onOpen,
}: {
  Data: Student[];
  onOpen: () => void;
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = Data?.filter(
    (student) =>
      (student?.first_name || student?.firstName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (student?.last_name || student?.lastName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      student?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // const filterStudents = () => {
  //   return Data?.filter(
  //     (student) =>
  //       student?.status === selectedTab &&
  //       (student?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //         student?.email.toLowerCase().includes(searchQuery.toLowerCase()))
  //   );
  // };

  const columns: ColumnDef<Student>[] = [
    {
      header: "First Name",
      accessorKey: "first_name",
    },
    {
      header: "Last Name",
      accessorKey: "last_name",
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Phone",
      accessorKey: "primary_number",
    },
    {
      id: "progress",
      header: (
        "Progress"
      ),
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
          value={
            "View"
          }
          variant="secondary"
          className="text-primary"
          onClick={() => navigate(`student/${row.original?.id}`)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          {/* Search Bar */}
          {Data?.length !== 0 && (
            <input
              type="text"
              placeholder="Search students..."
              className="px-4 py-2 border border-lightGray rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          )}
        </div>
        <div className="flex gap-x-4">
          {/* Export Button */}
          {/* <div>
          <button className="border border-primary text-primary px-4 py-2 rounded-lg">
            Export List
          </button>
          </div> */}
          {/* Export Button */}
          <div>
            <button
              onClick={onOpen}
              className="bg-primary text-white px-4 py-2 rounded-lg"
            >
              Enroll student
            </button>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center mb-4">
        {/* Tabs */}
        {/* <div className="flex gap-4 border p-1 rounded-lg border-lightGray">
          {["All Students", "Active", "Inactive", "Completed", "In Progress", "Not Started"].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded-lg ${selectedTab === tab ? "bg-lightGray text-primary font-bold" : " text-primary"}`}
              onClick={() => setSelectedTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div> */}
      </div>

      {filteredData?.length === 0 ? (
        <EmptyState msg={"No students found"} />
      ) : (
        <>
          {/* Desktop / Tablet Table View */}
          <div className="hidden md:block">
            <TableComponent
              data={filteredData}
              columns={columns}
              filter={searchQuery}
              setFilter={setSearchQuery}
            />
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredData.map((student) => (
              <div
                key={student.id}
                className="rounded-xl border border-lightGray p-4 space-y-3 bg-white shadow-sm"
              >
                <div className="flex gap-y-2 justify-between items-start">
                  <div className="flex flex-col gap-y-2">
                    <p className="flex items-center gap-1 font-semibold text-primary">
                      <UserIcon className="w-4 h-4 text-primaryGray" />
                      {student.first_name || student.firstName} {student.last_name || student.lastName}
                    </p>

                    <p className="flex items-center gap-1 text-sm text-primaryGray">
                      <EnvelopeIcon className="w-4 h-4" />
                      {student.email}
                    </p>

                    <p className="flex items-center gap-1 text-sm text-primaryGray">
                      <PhoneIcon className="w-4 h-4" />
                      {student?.primary_number}
                    </p>
                  </div>

                  <Button
                    value={
                      "View"
                    }
                    variant="secondary"
                    className="text-primary"
                    onClick={() => navigate(`student/${student.id}`)}
                  />
                </div>

                {/* Progress */}
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
