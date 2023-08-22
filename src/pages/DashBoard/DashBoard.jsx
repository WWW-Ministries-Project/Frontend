import StatsCard from "../HomePage/Components/StatsCard";
import BreakdownComponents from "./Components/BreakdownComponents";
import NotificationFlag from "../HomePage/Components/NotificationFlag";

function DashBoard() {
  const stats = [
    { name: "Total Attendance", value: "60,000", duration: "This month" },
    { name: "Total Members", value: "2000", duration: "This month" },
    { name: "Total Number of Partners", value: "300", duration: "This month" },
  ];
  return (
      <main className="">
        <NotificationFlag className={" mb-5"}/>
        <div className="my-5 flex items-center justify-between">
          <div className="H600">Overview</div>
          <div className="flex justify-between">
            <div className="bg-white h-10 px-2 py-4">
              Date: <span>This Month</span>
            </div>
          </div>
        </div>
        <section className="flex justify-between">
          {stats.map((stat) => (
            <StatsCard stats={stat} />
          ))}
        </section>
        <section>
          <BreakdownComponents />
        </section>
      </main>
  );
}

export default DashBoard;
