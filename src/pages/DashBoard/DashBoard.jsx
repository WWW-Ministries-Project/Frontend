import StatsCard from "../HomePage/Components/StatsCard";
import BreakdownComponents from "./Components/BreakdownComponents";
import NotificationFlag from "../HomePage/Components/NotificationFlag";
import TableComponent from "../HomePage/Components/TableComponent";
import SearchBar from "../../components/SearchBar";
import Button from "../../components/Button";
import { useOutletContext } from "react-router-dom";

function DashBoard() {
  const stats = [
    { name: "Total Attendance", value: 60000, duration: "This month",additionalInfo:"I wonder how it should appear" },
    { name: "Total Members", value: 2000, duration: "This month",additionalInfo:"As a tooltip or info card" },
    { name: "Total Number of Partners", value: 300, duration: "This month" },
  ];
  const {setDisplayForm} = useOutletContext();
  const handleClick = () => {
    console.log("clicked");
    setDisplayForm(true);
  }
  return (
      <main className="">
        <NotificationFlag className={" mb-5"}/>
        <div className="my-5 flex items-center justify-between">
          <div className="H600">Overview</div>
          <div className="flex gap-2  justify-between">
            <div className="bg-white rounded shadow flex gap-2 items-center justify-between h-10 px-2 py-4 border border-[#EEF2F4]">
              Date: <span className="P250 text-dark900 ">This Month</span>
            </div>
            <div className="bg-white rounded shadow flex gap-2 items-center justify-between h-10 px-2 py-4 border border-[#EEF2F4]">
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
        <section className="mt-6 bg-white p-7">
          <div className="flex justify-between items-center mb-5">
            <div className="flex justify-start gap-2 items-center  w-2/3">
             <SearchBar className="w-[40.9%] h-10" placeholder='Search members here...'  /> 
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
          <TableComponent />
        </section>
      </main>
  );
}

export default DashBoard;
