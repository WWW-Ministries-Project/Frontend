import StatsCard from "../HomePage/Components/StatsCard";
import BreakdownComponents from "./Components/BreakdownComponents";

function DashBoard() {
  const stats = [
    { name: "Total Attendance", value: "60,000", duration: "This month" },
    { name: "Total Members", value: "2000", duration: "This month" },
    { name: "Total Number of Partners", value: "300", duration: "This month" },
  ];
  return (
      <main className="">
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
