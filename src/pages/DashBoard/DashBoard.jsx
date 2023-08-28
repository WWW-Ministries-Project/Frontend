import StatsCard from "../HomePage/Components/StatsCard";
import BreakdownComponents from "./Components/BreakdownComponents";
import NotificationFlag from "../HomePage/Components/NotificationFlag";

function DashBoard() {
  const stats = [
    { name: "Total Attendance", value: "60,000", duration: "This month",additionalInfo:"I wonder how it should appear" },
    { name: "Total Members", value: "2000", duration: "This month",additionalInfo:"As a tooltip or info card" },
    { name: "Total Number of Partners", value: "300", duration: "This month" },
  ];
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
