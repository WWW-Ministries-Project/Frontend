import { useState, useEffect } from "react";
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
import LineChart from "../../Components/LineChart";

function DashBoard() {
  const { members, userStats } = useOutletContext();
  const [welcomeMsg, setWelcomeMsg] = useState(
    JSON.parse(localStorage.getItem("welcomeMsg")) !== false
  );
  const [isTabletOrAbove, setIsTabletOrAbove] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsTabletOrAbove(window.innerWidth >= 640);
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const stats = [
    { name: "Total Members", value: userStats.total_members, additionalInfo: "I wonder how it should appear" },
    { name: "Males", value: userStats.total_males, additionalInfo: "As a tooltip or info card" },
    { name: "Female", value: userStats.total_females, additionalInfo: "Number of female adults" },
    { name: "Children", value: userStats.stats?.children?.Total, additionalInfo: "Number of all children" },
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
  };

  const handleToggleView = () => {
    setWelcomeMsg(false);
    localStorage.setItem("welcomeMsg", false);
  };

  return (
    <main className={`hideScrollbar pb-4 2xl:h-[90vh] xl:h-[88vh] md:h-[87vh] xs:h-[86vh] overflow-y-auto rounded-xl`}>
      {welcomeMsg && isTabletOrAbove && (
          <NotificationFlag name={decodeToken().name} className={" "} onClose={handleToggleView}/>
      )}
      <div className=''>
        {/* <div className={`my-5 flex items-center justify-between `}>
          <div className="H600">Overview</div>
        </div> */}
        <section className="grid xl:grid-cols-4 md:grid-cols-2 xs:grid-cols-2  gap-4">
          {stats.map((stat) => (
            <StatsCard stats={stat} key={stat.name} />
          ))}
        </section>
        <div className="flex flex-col items-center tablet:flex-row justify-between grid 2xl:grid-cols-2 xl:grid-cols-2 lg:grid-cols-2 md:grid grid-cols-1 gap-4">
          <section className="mt-6 bg-white p-7 shadow-sm rounded-xl w-full">
            <div className="text-dark900 H600">Members Breakdown</div>
            <BarChart value={userStats.stats} />
          </section>
          <section className="mt-6 bg-white p-7 shadow-sm rounded-xl w-full">
            <div className="text-dark900 H600">Event Attendance</div>
            {/* <BarChart value={userStats.stats} /> */}
            <LineChart value={userStats.stats}/>
          </section>
        </div>
        <div className="flex flex-col items-center tablet:flex-row justify-between grid 2xl:grid-cols-2 xl:grid-cols-2 lg:grid-cols-2 md:grid grid-cols-1 gap-4">
          <section className="mt-6 bg-white p-7 w-full rounded-xl">
          <div className="text-dark900 H600">First Timers</div>
            <div className="flex justify-between items-center mb-5">
              <div className="flex justify-start gap-2 items-center w-2/3">
                <SearchBar
                  className="w-[40.9%] h-10"
                  placeholder="Search members here..."
                  value={filter}
                  onChange={handleSearchChange}
                />
              </div>
              <div>
                <Button
                  value="All Members"
                  className={" p-3 m-1 text-white min-h-10 max-h-14 bg-primaryViolet"}
                  onClick={() => navigate("/home/members")}
                />
              </div>
            </div>
            <div className="">
              <TableComponent
                columns={columns}
                data={members}
                filter={filter}
                setFilter={setFilter}
                displayedCount={8}
                rowClass={"h-10"}
              />
            </div>
          </section>
          <section className="mt-6 bg-white p-7 w-full rounded-xl">
            <div className="text-dark900 H600">Upcoming Event</div>
            <div className="flex justify-between items-center mb-5">
              
              <div className="flex justify-start gap-2 items-center w-2/3">
                <SearchBar
                  className="w-[40.9%] h-10"
                  placeholder="Search events here..."
                  value={filter}
                  onChange={handleSearchChange}
                />
              </div>
              <div>
                <Button
                  value="All Events"
                  className={" p-3 m-1 text-white min-h-10 max-h-14 bg-primaryViolet"}
                  onClick={() => navigate("/home/events")}
                />
              </div>
            </div>
            <div className="">
              <TableComponent
                columns={columns}
                data={members}
                filter={filter}
                setFilter={setFilter}
                displayedCount={8}
                rowClass={"h-10"}
              />
            </div>
          </section>
        </div>
        
      </div>
    </main>
  );
}

export default DashBoard;
