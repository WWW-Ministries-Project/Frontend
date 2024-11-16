import SearchBar from "@/components/SearchBar";
import useWindowSize from "@/CustomHooks/useWindowSize";
import { eventColumns } from "@/pages/HomePage/pages/EventsManagement/utils/eventHelpers";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import * as XLSX from "xlsx";
import Button from "../../../../components/Button";
import { decodeToken } from "../../../../utils/helperFunctions";
import BarChart from "../../Components/BarChart";
import LineChart from "../../Components/LineChart";
import NotificationFlag from "../../Components/reusable/NotificationFlag";
import StatsCard from "../../Components/reusable/StatsCard";
import TableComponent from "../../Components/reusable/TableComponent";
import type { UserStats, UserType } from "../Members/utils/membersInterfaces";
import { dashboardColumns } from "./utils/dashboardFunctions";

function DashBoard() {
  const { members, userStats, upcomingEvents } = useOutletContext<{
    members: UserType[];
    userStats: UserStats;
    upcomingEvents: any;
  }>();
  const [welcomeMsg, setWelcomeMsg] = useState(
    JSON.parse(localStorage.getItem("welcomeMsg") ?? "false")
  );
  const [isTabletOrAbove, setIsTabletOrAbove] = useState(false);
  const { screenWidth } = useWindowSize();

  // for hiding or showing welcome msg based on size
  useEffect(() => {
    const handleResize = () => {
      setIsTabletOrAbove(screenWidth >= 640);
    };
    handleResize();
  }, [screenWidth]);

  const stats = [
    {
      name: "Total Members",
      value: userStats.total_members,
      additionalInfo: "I wonder how it should appear",
    },
    {
      name: "Males",
      value: userStats.total_males,
      additionalInfo: "As a tooltip or info card",
    },
    {
      name: "Female",
      value: userStats.total_females,
      additionalInfo: "Number of female adults",
    },
    {
      name: "Children",
      value: userStats.stats?.children?.Total,
      additionalInfo: "Number of all children",
    },
  ];

  const columns = dashboardColumns;
  const [filter, setFilter] = useState("");
  const [eventsFilter, setEventsFilter] = useState("");

  const navigate = useNavigate();

  const exportToExcel = () => {
    if (stats.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(members);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet);

    const excelFileName = "Members.xlsx";
    XLSX.writeFile(workbook, excelFileName);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  };
  const handleEventsSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEventsFilter(e.target.value);
  };

  const handleToggleView = () => {
    setWelcomeMsg(false);
    localStorage.setItem("welcomeMsg", "false");
  };

  return (
    <main className={``}>
      {welcomeMsg && isTabletOrAbove && (
        <NotificationFlag
          name={decodeToken().name}
          className={" "}
          onClose={handleToggleView}
        />
      )}

      <div className="grid gap-y-4">
        <section className="grid gap-4 xl:grid-cols-4 md:grid-cols-2 xs:grid-cols-2 ">
          {stats.map((stat) => (
            <StatsCard stats={stat} key={stat.name} />
          ))}
        </section>
        <div className="flex flex-col items-center justify-between grid gap-4 2xl:grid-cols-2 xl:grid-cols-2 lg:grid-cols-2 md:grid grid-cols-1 ">
          <section className=" bg-white p-7 shadow-sm rounded-xl w-full">
            <div className="text-dark900 H600">Members Breakdown</div>
            <BarChart value={userStats.stats} />
          </section>
          <section className=" bg-white p-7 shadow-sm rounded-xl w-full">
            <div className="text-dark900 H600">Event Attendance</div>
            {/* <BarChart value={userStats.stats} /> */}
            <LineChart value={userStats.stats} />
          </section>
        </div>
        <div className="flex flex-col  justify-between grid gap-4 2xl:grid-cols-2 xl:grid-cols-2 lg:grid-cols-2 md:grid grid-cols-1">
          <section className="bg-white p-7 w-full rounded-xl">
            <div className="text-dark900 H600">First Timers</div>
            <div className="flex justify-between items-center ">
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
                  className={
                    " p-3 m-1 text-white min-h-10 max-h-14 bg-primaryViolet"
                  }
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
                displayedCount={4}
                rowClass={"h-10"}
              />
            </div>
          </section>
          <section className="bg-white p-7 w-full rounded-xl">
            <div className="text-dark900 H600">Upcoming Event</div>
            <div className="flex justify-between items-center ">
              <div className="flex justify-start gap-2 items-center w-2/3">
                <SearchBar
                  className="w-[40.9%] h-10"
                  placeholder="Search events here..."
                  value={eventsFilter}
                  onChange={handleEventsSearchChange}
                />
              </div>
              <div>
                <Button
                  value="All Events"
                  className={
                    " p-3 m-1 text-white min-h-10 max-h-14 bg-primaryViolet"
                  }
                  onClick={() => navigate("/home/events")}
                />
              </div>
            </div>
            <div className="">
              <TableComponent
                columns={eventColumns}
                data={upcomingEvents}
                filter={eventsFilter}
                setFilter={setFilter}
                displayedCount={4}
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
