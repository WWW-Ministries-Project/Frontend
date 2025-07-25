
import { matchRoutes, useLocation } from "react-router-dom";
import { ChurchAnnouncements } from "./Components/ChurchAnnouncements ";
import { MyAppointments } from "./Components/MyAppointments ";
import { ProfileSummary } from "./Components/ProfileSummary ";
import { QuickActions } from "./Components/QuickActions ";
import { RecentSermons } from "./Components/RecentSermons";
import { UpcomingEvents } from "./Components/UpcomingEvents";
import { WelcomeHeader } from "./Components/WelcomeHeader ";
import { routes } from "@/routes/appRoutes";


const DashBoardPage = () => {
  const location = useLocation();

  const matches = matchRoutes(routes, location);
  const routeName = matches?.find(m => m.route.name)?.route.name;


  return (
      <div className={`${routeName==="member"?"":"min-h-screen p-6"}`}>
      <WelcomeHeader route={routeName} />

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${routeName==="member"?"px-[1rem] lg:px-[4rem] xl:px-[8rem] pb-6":""}`}>
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <UpcomingEvents />
          <ChurchAnnouncements />
          <RecentSermons />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <ProfileSummary />
          <MyAppointments />
          <QuickActions />
        </div>
      </div>
    </div>
  );
};

export default DashBoardPage;
