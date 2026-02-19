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
import { api } from "@/utils/api/apiCalls";
import { useFetch } from "@/CustomHooks/useFetch";
import { useEffect, useState } from "react";

export const DashBoardPage = () => {
  const location = useLocation();
  const [activeTheme, setActiveTheme] = useState<any>(null);

  const matches = matchRoutes(routes, location);
  const routeName = matches?.find((m) => m.route.name)?.route.name;
  const { data, loading, refetch } = useFetch(api.fetch.fetchActiveAnnualTheme);

  useEffect(() => {
    if (data && data.data) {
      setActiveTheme(data.data);
    }
  }, [data]);



  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-20 z-30">
        <WelcomeHeader showFull={ routeName === "member" ? true : false} theme={activeTheme} />
      </div>

      <div
        className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${
          routeName === "member" ? "" : "px-6"
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
    </div>
  );
};

