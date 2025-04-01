import BarChart from "@/pages/HomePage/Components/BarChart";
import { useOutletContext } from "react-router-dom";
import { UserStats, UserType } from "../../Members/utils/membersInterfaces";

const Analytics = () => {
    const { members, userStats } = useOutletContext<{
        members: UserType[];
        userStats: UserStats;
        upcomingEvents: any;
      }>();
    return ( 
        <div className="grid grid-cols-2 gap-4">
            <section className=" bg-white p-4 shadow-sm rounded-lg w-full border border-lightGray">
                <div className="text-dark900 H600">Members Breakdown</div>
                <BarChart value={userStats.members?.stats} />
            </section>

            <section className=" bg-white p-4 shadow-sm rounded-lg w-full border border-lightGray">
                <div className="text-dark900 H600">Members Breakdown</div>
                <BarChart value={userStats.visitors?.stats} />
            </section>

            <section className=" bg-white p-4 shadow-sm rounded-lg w-full border border-lightGray">
                <div className="text-dark900 H600">Members Breakdown</div>
                <BarChart value={userStats.members?.stats} />
            </section>

            <section className=" bg-white p-4 shadow-sm rounded-lg w-full border border-lightGray">
                <div className="text-dark900 H600">Members Breakdown</div>
                <BarChart value={userStats.members?.stats} />
            </section>
        </div>
     );
}
 
export default Analytics;