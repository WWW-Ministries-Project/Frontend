import SearchBar from "@/components/SearchBar";
import useWindowSize from "@/CustomHooks/useWindowSize";
import { eventColumns } from "@/pages/HomePage/pages/EventsManagement/utils/eventHelpers";
import { useStore } from "@/store/useStore";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Button from "../../../../components/Button";
import { decodeToken } from "../../../../utils/helperFunctions";
import BarChart from "../../Components/BarChart";
import LineChart from "../../Components/LineChart";
import NotificationFlag from "../../Components/reusable/NotificationFlag";
import StatsCard from "../../Components/reusable/StatsCard";
import TableComponent from "../../Components/reusable/TableComponent";
import type { UserStats, UserType } from "../Members/utils/membersInterfaces";
import { dashboardColumns } from "./utils/dashboardFunctions";
import DashBoardPage from "./DashboardPage";

function DashBoard() {
  const { members, userStats } = useOutletContext<{
    members: UserType[];
    userStats: UserStats;
    upcomingEvents: any;
  }>();
  const [welcomeMsg, setWelcomeMsg] = useState(
    JSON.parse(localStorage.getItem("welcomeMsg") ?? "true")
  );
  const [isTabletOrAbove, setIsTabletOrAbove] = useState(false);
  const { screenWidth } = useWindowSize();

  const upcomingEvents = useStore().upcomingEvents;
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
      value: userStats.members?.total_members || 0,
    },
    {
      name: "Males",
      value: userStats.members?.total_males || 0,
    },
    {
      name: "Female",
      value: userStats.members?.total_females || 0,
    },
    {
      name: "Children",
      value: userStats.members?.stats?.children?.Total || 0,
    },
  ];

  const columns = dashboardColumns;
  const [filter, setFilter] = useState("");
  const [eventsFilter, setEventsFilter] = useState("");

  const navigate = useNavigate();

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
    <main className={`p-4`}>
      {welcomeMsg && isTabletOrAbove && (
        <NotificationFlag
          name={decodeToken().name}
          className={" "}
          onClose={handleToggleView}
        />
      )}

      <DashBoardPage/>

      

      <div className="grid gap-y-4">
        <section className="grid gap-4 xl:grid-cols-4 md:grid-cols-2 xs:grid-cols-2 ">
          {stats.map((stat) => (
            <StatsCard stats={stat} key={stat.name} />
          ))}
        </section>
        <div className="flex flex-col items-center justify-between grid gap-4 2xl:grid-cols-2 xl:grid-cols-2 lg:grid-cols-2 md:grid grid-cols-1 ">
          <section className=" bg-white p-7 shadow-sm rounded-xl w-full">
            <div className="text-primary H600">Members Breakdown</div>
            <BarChart value={userStats.members?.stats} />
          </section>
          <section className=" bg-white p-7 shadow-sm rounded-xl w-full">
            <div className="text-primary H600">Event Attendance</div>
            {/* <BarChart value={userStats.stats} /> */}
            <LineChart value={userStats.members?.stats} />
          </section>
        </div>
        <div className="flex flex-col  justify-between grid gap-4 2xl:grid-cols-2 xl:grid-cols-2 lg:grid-cols-2 md:grid grid-cols-1">
          <section className="bg-white p-7 w-full rounded-xl space-y-4">
            <div className="flex justify-between items-center ">
            <div className="text-primary H600">First Timers</div>
            <div>
                <Button
                  value="All Members"
                  className={
                    " p-3 m-1 text-white min-h-10 max-h-14 bg-primary"
                  }
                  onClick={() => navigate("/home/members")}
                />
              </div>
            </div>
            <div className="flex justify-between items-center ">
              <div className="flex justify-start gap-2 items-center w-2/3">
                <SearchBar
                  className="w-[40.9%] h-10"
                  placeholder="Search members here..."
                  value={filter}
                  onChange={handleSearchChange}
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
          <section className="bg-white p-7 w-full rounded-xl space-y-4">
            <div className="flex justify-between items-center">
            <div className="text-primary H600">Upcoming Event</div>
            <div>
                <Button
                  value="All Events"
                  className={
                    " p-3 m-1 text-white min-h-10 max-h-14 bg-primary"
                  }
                  onClick={() => navigate("/home/events")}
                />
              </div>
            </div>
            <div className="flex justify-between items-center ">
              <div className="flex justify-start gap-2 items-center w-2/3">
                <SearchBar
                  className="w-[40.9%] h-10"
                  placeholder="Search events here..."
                  value={eventsFilter}
                  onChange={handleEventsSearchChange}
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
