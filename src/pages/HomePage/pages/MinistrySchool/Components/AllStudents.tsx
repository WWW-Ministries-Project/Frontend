import { useRef, useState } from "react";
import ellipse from "@/assets/ellipse.svg";
import { useNavigate } from "react-router-dom";

interface Student {
  id: number;
  name: string;
  email: string;
  status: string;
  attendance: number;
  progress: number;
  memberType: string;
}




const AllStudents = ({ Data, onOpen }: { Data: Student[]; onOpen: () => void }) => {
    const navigate = useNavigate();
    const menuRef = useRef<HTMLDivElement | null>(null);
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState("Active");
  const [searchQuery, setSearchQuery] = useState("");
  
  const filterStudents = () => {
    return Data?.filter(
      (student) =>
        student?.status === selectedTab &&
        (student?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student?.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const toggleMenu = (id: number) => {
    setOpenMenuId((prevId) => (prevId === id ? null : id));
  };

  return (
    <div className="space-y-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search students..."
            className="px-4 py-2 border border-lightGray rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex gap-x-4">
            {/* Export Button */}
          <div>
          <button className="border border-primary text-primary px-4 py-2 rounded-lg">
            Export List
          </button>
          </div>
          {/* Export Button */}
          <div>
          <button onClick={onOpen} className="bg-primary text-white px-4 py-2 rounded-lg">
            Add student
          </button>
          </div>
          </div>

        </div>
      <div className="flex justify-between items-center mb-4">
        

        {/* Tabs */}
        <div className="flex gap-4 border p-1 rounded-lg border-lightGray">
          {["All Students", "Active", "Inactive", "Completed", "In Progress", "Not Started"].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded-lg ${selectedTab === tab ? "bg-lightGray text-dark900 font-bold" : " text-dark900"}`}
              onClick={() => setSelectedTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-lightGray p-4 rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="text-dark900">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Attendance</th>
                <th className="px-4 py-2 text-left">Progress</th>
                <th className="px-4 py-2 text-left">Member</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filterStudents()?.map((student, index) => (
                <tr key={index} className="border-t border-lightGray">
                  <td className="px-4 py-2">{student?.name}</td>
                  <td className="px-4 py-2">{student?.email}</td>
                  <td className="px-4 py-2">{student?.status}</td>
                  <td className="px-4 py-2">{student?.attendance}%</td>
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
                  <td className="px-4 py-2">{student?.memberType}</td>
                  <td className="px-4 py-2">
                  <div className="relative " ref={menuRef}>
            <button className="text-primary" onClick={() => navigate(`student?${student?.id}`)}>
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
          Showing {filterStudents()?.length} of {Data?.length} students
        </div>
      </div>
      
    </div>
  );
};

export default AllStudents;
