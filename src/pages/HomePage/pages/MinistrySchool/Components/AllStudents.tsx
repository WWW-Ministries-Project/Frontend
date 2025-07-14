import EmptyState from "@/components/EmptyState";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  attendance: number;
  progress: number;
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
      header: "Progress",
      cell: ({ row }) => (
        <div className="h-2 bg-lightGray rounded-full">
          <div
            className="h-2 bg-primaryViolet rounded-full"
            style={{ width: `${row.original?.progress}%` }}
          ></div>
        </div>
      ),
    },
    {
      header: "Actions",
      cell: ({ row }) => (
        <button
          className="text-primary"
          onClick={() => navigate(`student/${row.original?.id}`)}
        >
          View
        </button>
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

      {Data?.length === 0 ? (
        <EmptyState msg={"No students found"} />
      ) : (
        <TableComponent
          data={Data}
          columns={columns}
          filter={searchQuery}
          setFilter={setSearchQuery}
        />
      )}
    </div>
  );
};
