import { Badge } from "@/components/Badge";
import EmptyState from "@/components/EmptyState";
import { useRef, useState } from "react";
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

const AllStudents = ({
  Data,
  onOpen,
}: {
  Data: Student[];
  onOpen: () => void;
}) => {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState("Active");
  const [searchQuery, setSearchQuery] = useState("");

  // const filterStudents = () => {
  //   return Data?.filter(
  //     (student) =>
  //       student?.status === selectedTab &&
  //       (student?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //         student?.email.toLowerCase().includes(searchQuery.toLowerCase()))
  //   );
  // };

  const toggleMenu = (id: number) => {
    setOpenMenuId((prevId) => (prevId === id ? null : id));
  };

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
        <div className="text-center py-8 w-1/4 mx-auto">
          <EmptyState msg={"No students found"} />
        </div>
      ) : (
        <div className="bg-white border border-lightGray p-4 rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="text-primary">
                <tr>
                  <th className="px-4 py-2 text-left">First Name</th>
                  <th className="px-4 py-2 text-left">Last Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Phone Number</th>
                  {/* <th className="px-4 py-2 text-left">Attendance</th> */}
                  <th className="px-4 py-2 text-left">Progress</th>
                  <th className="px-4 py-2 text-left">Member</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Data?.map((student, index) => (
                  <tr key={index} className="border-t border-lightGray">
                    <td className="px-4 py-2">{student?.firstName}</td>
                    <td className="px-4 py-2">{student?.lastName}</td>
                    <td className="px-4 py-2">{student?.email}</td>
                    <td className="px-4 py-2">{student?.phone}</td>
                    {/* <td className="px-4 py-2">{student?.attendance}%</td> */}
                    <td className="px-4 py-2">
                      <div className="relative w-full">
                        <div className="h-2 bg-lightGray rounded-full">
                          <div
                            className="h-2 bg-primaryViolet rounded-full"
                            style={{ width: `${student?.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <Badge className="md:w-2/3 text-xs border border-lightGray text-primary ">
                        {student?.userId ? "Member" : "Non-member"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                      <div className="relative " ref={menuRef}>
                        <button
                          className="text-primary"
                          onClick={() => navigate(`student/${student?.id}`)}
                        >
                          {/* <img src={ellipse} alt="options" className="cursor-pointer" /> */}
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination (if needed) */}
          <div className="mt-4 text-center">
            Showing {Data?.length} of {Data?.length} students
          </div>
        </div>
      )}
    </div>
  );
};

export default AllStudents;
