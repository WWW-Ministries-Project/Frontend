
import PageOutline from "../../Components/PageOutline";
import { ChurchAnnouncements } from "./Components/ChurchAnnouncements ";
import { MyAppointments } from "./Components/MyAppointments ";
import { ProfileSummary } from "./Components/ProfileSummary ";
import { QuickActions } from "./Components/QuickActions ";
import { RecentSermons } from "./Components/RecentSermons";
import { UpcomingEvents } from "./Components/UpcomingEvents";
import { WelcomeHeader } from "./Components/WelcomeHeader ";


const DashBoardPage = () => {


  return (
      <div className="min-h-screen p-6">
      <WelcomeHeader />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
