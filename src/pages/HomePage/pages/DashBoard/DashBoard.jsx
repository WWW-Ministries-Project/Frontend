import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import * as XLSX from "xlsx";
import Button from "../../../../components/Button";
import { decodeToken } from "../../../../utils/helperFunctions";
import BarChart from "../../Components/BarChart";
import NotificationFlag from "../../Components/reusable/NotificationFlag";
import StatsCard from "../../Components/reusable/StatsCard";
import TableComponent from "../../Components/reusable/TableComponent";
import { dashboardColumns } from "./utils/dashboardFunctions";
import SearchBar from "/src/components/SearchBar";


function DashBoard() {
  const { members, userStats } = useOutletContext();

  // const stats = [
  //   { name: "Total Attendance", value: 0, duration: "This month",additionalInfo:"I wonder how it should appear" },
  //   { name: "Total Members", value: members.length, duration: "All",additionalInfo:"As a tooltip or info card" },
  //   { name: "Total Number of Partners", value: 0, duration: "This month" },
  // ];
  const stats = [
    { name: "Total Members", value: userStats.total_members, additionalInfo: "I wonder how it should appear" },
    { name: "Males", value: userStats.total_males, additionalInfo: "As a tooltip or info card" },
    { name: "Female", value: userStats.total_females, additionalInfo: "Number of female adults" },
    { name: "Females", value: userStats.total_females, additionalInfo: "Number of female adults" },
  ];

  const columns = dashboardColumns;
  const [filter, setFilter] = useState("");

  const navigate = useNavigate();

  const exportToExcel = () => {
    if (stats.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(members);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet);

    const excelFileName = "Members.xlsx";
    XLSX.writeFile(workbook, excelFileName);
  };

  const handleSearchChange = (e) => {
    setFilter(e.target.value);
  }
  return (
    <main className="">
      <NotificationFlag name={decodeToken().name} className={" mb-5"} />
      <div className={`pb-4 xl:h-[75vh] lg:h-[75vh] overflow-y-auto`}>
      <div className={`my-5 flex items-center justify-between `}>
        <div className="H600">Overview</div>
        <div className="flex gap-2  justify-between">
          {/* <div className="bg-white rounded shadow flex gap-2 items-center justify-between h-10 px-2 py-4 border border-[#EEF2F4] cursor-pointer">
              Date: <span className="P250 text-dark900 ">This Month</span>
            </div> */}
          <div className="bg-white rounded shadow-sm flex gap-2 items-center justify-between h-10 px-2 py-4 border-1 border-[#EEF2F4] cursor-pointer" onClick={exportToExcel}>
            <span className="P250 text-dark900"> Export </span><img src="/assets/home/fi_download.svg" alt="export" className="inline-block" />
          </div>
        </div>
      </div>
      <section className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatsCard stats={stat} key={stat.name} />
        ))}
      </section>
      <div className="flex flex-col items-center tablet:flex-row justify-between grid 2xl:grid-cols-2 xl:grid-cols-2 lg:grid-cols-2 md:grid grid-cols-1 gap-4">
        <section className="mt-6 bg-white p-7 shadow-sm rounded-xl w-full  ">
          {/* <BreakdownComponents /> */}
          <div className="text-dark900 H600">Members Breakdown</div>
          <BarChart value={userStats.stats} />
        </section>
        <section className="mt-6 bg-white p-7 shadow-sm rounded-xl w-full ">
          {/* <BreakdownComponents /> */}
          <div className="text-dark900 H600">Event data</div>
          <BarChart value={userStats.stats} />
        </section>
      </div>

      <div className="flex flex-col items-center tablet:flex-row justify-between grid grid-cols-2 md:grid grid-cols-1 gap-4">
      <section className="mt-6 bg-white p-7 w-full rounded-xl">
        <div className="flex justify-between items-center mb-5">
          <div className="flex justify-start gap-2 items-center  w-2/3">
            <SearchBar className="w-[40.9%] h-10" placeholder='Search members here...' value={filter} onChange={handleSearchChange} />
          </div>
          <div>
            <Button value="View members " className={" p-3 m-1 text-white min-h-10 max-h-14 bg-primaryViolet"} onClick={() => navigate("/home/members")} />
          </div>
        </div>
        <div>

          <TableComponent columns={columns} data={members} filter={filter} setFilter={setFilter} displayedCount={5} rowClass={"h-10"} />
        </div>
      </section>
      </div>
      </div>
    </main>
  );
}

export default DashBoard;
