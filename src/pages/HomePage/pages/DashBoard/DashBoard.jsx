import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import * as XLSX from "xlsx";
import Button from "../../../../components/Button";
import { decodeToken, getToken } from "../../../../utils/helperFunctions";
import NotificationFlag from "../../Components/reusable/NotificationFlag";
import StatsCard from "../../Components/reusable/StatsCard";
import TableComponent from "../../Components/reusable/TableComponent";
import BreakdownComponents from "./Components/BreakdownComponents";
import { dashboardColumns } from "./utils/dashboardFunctions";


function DashBoard() {
  const {setDisplayForm, members} = useOutletContext();
  
  const stats = [
    { name: "Total Attendance", value: 0, duration: "This month",additionalInfo:"I wonder how it should appear" },
    { name: "Total Members", value: members.length, duration: "All",additionalInfo:"As a tooltip or info card" },
    { name: "Total Number of Partners", value: 0, duration: "This month" },
  ];
  const token = getToken();

  const columns = dashboardColumns;
  const [filter,setFilter] = useState("");

  const navigate = useNavigate();

  const handleClick = () => {
    setDisplayForm(true);
  }
  const exportToExcel = ()=>{
    if(stats.length === 0)return;
 
    const worksheet = XLSX.utils.json_to_sheet(stats);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet);
 
    const excelFileName = "Attendence.xlsx";
    XLSX.writeFile(workbook, excelFileName);    
 };

 const handleSearchChange = (e) => {
  setFilter(e.target.value);
 }
  return (
      <main className="">
        <NotificationFlag name={decodeToken().name} className={" mb-5"}/>
        <div className="my-5 flex items-center justify-between">
          <div className="H600">Overview</div>
          <div className="flex gap-2  justify-between">
            <div className="bg-white rounded shadow flex gap-2 items-center justify-between h-10 px-2 py-4 border border-[#EEF2F4] cursor-pointer">
              Date: <span className="P250 text-dark900 ">This Month</span>
            </div>
            <div className="bg-white rounded shadow flex gap-2 items-center justify-between h-10 px-2 py-4 border border-[#EEF2F4] cursor-pointer" onClick={exportToExcel}>
             <span className="P250 text-dark900"> Export </span><img src="/assets/home/fi_download.svg" alt="export" className="inline-block" />
            </div>
          </div>
        </div>
        <section className="flex justify-between">
          {stats.map((stat) => (
            <StatsCard stats={stat} key={stat.name} />
          ))}
        </section>
        <section>
          <BreakdownComponents />
        </section>
        <section className="mt-6 bg-white p-7 ">
          <div className="flex justify-end items-center mb-5">
            {/* <div className="flex justify-start gap-2 items-center  w-2/3">
             <SearchBar className="w-[40.9%] h-10" placeholder='Search members here...' value={filter} onChange={handleSearchChange} /> 
             <select name="filter" id="filter" placeholder="Filter" className="h-10 bg-white rounded-md p-1 opacity-50 border border-[#f2f2f2]">
                <option value="">Filter by</option>
                <option value="Name">Name</option>
                <option value="Department">Department</option>
                <option value="Date">Date created</option>
             </select>
            </div> */}
            <div>
              <Button value="View all members →" className={"  text-white h-10 p-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 transition duration-300 hover:bg-gradient-to-l hover:scale-105"} onClick={() => navigate("/home/members")}/>
            </div>
          </div>
          {/* <TableComponent /> */}
          <div>

          <TableComponent columns={columns} data={members} filter={filter} setFilter={setFilter}/>
          </div>
        </section>
      </main>
  );
}

export default DashBoard;
