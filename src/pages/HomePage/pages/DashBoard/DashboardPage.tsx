import { routes } from "@/routes/appRoutes";
import { matchRoutes, useLocation } from "react-router-dom";

import PageOutline from "../../Components/PageOutline";
import { ChurchAnnouncements } from "./Components/ChurchAnnouncements";
import { MyAppointments } from "./Components/MyAppointments";
import { ProfileSummary } from "./Components/ProfileSummary";
import { QuickActions } from "./Components/QuickActions";
import { RecentSermons } from "./Components/RecentSermons";
import { UpcomingEvents } from "./Components/UpcomingEvents";
import { WelcomeHeader } from "./Components/WelcomeHeader";

export const DashBoardPage = () => {
  const location = useLocation();

  const matches = matchRoutes(routes, location);
  const routeName = matches?.find((m) => m.route.name)?.route.name;

  return (
    <PageOutline className="bg-inherit p-6">
      <WelcomeHeader />

      <div
        className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${
          routeName === "member" ? "" : ""
        }`}
      >
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
    </PageOutline>
  );
};

