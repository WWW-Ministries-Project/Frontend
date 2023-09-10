import StatsCard from "../../Components/reusable/StatsCard";
import BreakdownComponents from "./Components/BreakdownComponents";
import NotificationFlag from "../../Components/reusable/NotificationFlag";
import TableComponent from "../../Components/reusable/TableComponent";
import SearchBar from "../../../../components/SearchBar";
import data from "/public/data/MOCK_DATA.json";
import Button from "../../../../components/Button";
import { useOutletContext } from "react-router-dom";
import { useState } from "react";
import * as XLSX from "xlsx";


function DashBoard() {
  const stats = [
    { name: "Total Attendance", value: 60000, duration: "This month",additionalInfo:"I wonder how it should appear" },
    { name: "Total Members", value: 2000, duration: "This month",additionalInfo:"As a tooltip or info card" },
    { name: "Total Number of Partners", value: 300, duration: "This month" },
  ];

  const columns = [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Phone number",
      accessorKey: "phone_number",
    },
    {
      header: "last visited",
      accessorKey: "last_visited",
      cell: (info) => info.getValue() + " days ago",
    },
    {
      header: "Visits",
      accessorKey: "vieits",
      cell: (info) => info.getValue() + " visits",
    },
    {
      header: "Created",
      accessorKey: "created",
    },
    {
      header: "Action",
      accessorKey: "action",
    },
  ];
  const [filter,setFilter] = useState("");
  const {setDisplayForm} = useOutletContext();
  const handleClick = () => {
    console.log("clicked");
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
        <NotificationFlag className={" mb-5"}/>
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
          <div className="flex justify-between items-center mb-5">
            <div className="flex justify-start gap-2 items-center  w-2/3">
             <SearchBar className="w-[40.9%] h-10" placeholder='Search members here...' value={filter} onChange={handleSearchChange} /> 
             <select name="filter" id="filter" placeholder="Filter" className="h-10 bg-white rounded-md p-1 opacity-50 border border-[#f2f2f2]">
                <option value="">Filter by</option>
                <option value="Name">Name</option>
                <option value="Department">Department</option>
                <option value="Date">Date created</option>
             </select>
             {/* <select name="filter" id="filter" placeholder="Filter" className="h-10 bg-white rounded-md p-1 opacity-50 border border-[#f2f2f2]">
                <option value="">Filter by</option>
                <option value="Name">Name</option>
                <option value="Department">Department</option>
                <option value="Date">Date created</option>
             </select> */}
            </div>
            <div>
              <Button value="Add member" className={" text-white h-10 p-2"} onClick={handleClick}/>
            </div>
          </div>
          {/* <TableComponent /> */}
          <div>

          <TableComponent columns={columns} data={data} filter={filter} setFilter={setFilter}/>
          </div>
        </section>
      </main>
  );
}

export default DashBoard;
