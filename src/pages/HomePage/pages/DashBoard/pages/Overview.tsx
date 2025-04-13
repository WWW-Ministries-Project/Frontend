import CalendarAssets from "@/assets/CalendarAsset";
import Badge from "@/components/Badge";
import HeaderControls from "@/components/HeaderControls";
import StatsCard from "../Components/StatsCard";
import ListDetailComp from "../Components/ListDetailComp";
import { useStore } from "@/store/useStore";
import { useEffect } from "react";
import { formatInputDate } from "@/utils/helperFunctions";
import { UserIcon } from "@heroicons/react/24/solid";
import UsersIcon from "@/assets/sidebar/UsersIcon";
import MembersIcon from "@/assets/sidebar/MembersIcon";
import { useOutletContext } from "react-router-dom";
import { UserStats, UserType } from "../../Members/utils/membersInterfaces";

const Overview = () => {
    const { members, userStats } = useOutletContext<{
            members: UserType[];
            userStats: UserStats;
            upcomingEvents: any;
          }>();
  // Get upcoming events from the store
  const upcomingEvents = useStore().upcomingEvents;

  // Log the upcoming events for debugging
  useEffect(() => {
    console.log("Upcoming Events", upcomingEvents);
  }, [upcomingEvents]);

  return (
    <div className="space-y-4 text-primary">
      <section>
        <div className="flex gap-4">
          <StatsCard
            title="Total Members"
            icon={<MembersIcon className={'h-5 '}/>
          } 
            quantity={userStats.members?.total_members + userStats.visitors?.total_members}
            increaseDecrease={"5"}
            increase={true}
            leftSideName="In person church family"
            leftSideNumber={userStats.members?.total_members}
            rightsideName="Online e-church family"
            rightSideNumber={userStats.visitors?.total_members}
          />
          <StatsCard
            title="Visitors"
            icon={<CalendarAssets className={'h-5 '} />}
            quantity={10}
            increaseDecrease={"5"}
            increase={true}
            leftSideName="Left Name"
            leftSideNumber={20}
            rightsideName="Right Name"
            rightSideNumber={30}
          />
          <StatsCard
            title="Attendance"
            icon={<CalendarAssets className={'h-5 '}/>}
            quantity={10}
            increaseDecrease={"5"}
            increase={true}
            leftSideName="Left Name"
            leftSideNumber={20}
            rightsideName="Right Name"
            rightSideNumber={30}
          />
          <StatsCard
            title="Total Soul Won"
            icon={<CalendarAssets className={'h-5 '}/>}
            quantity={10}
            increaseDecrease={"5"}
            increase={true}
            leftSideName="Left Name"
            leftSideNumber={20}
            rightsideName="Right Name"
            rightSideNumber={30}
          />
        </div>
      </section>

      <section>
        <div className="grid grid-cols-3 gap-4">
          <div className="border border-lightGray rounded-lg col-span-2 p-4 max-lg:h-[40rem] overflow-auto shadow-sm">
            <div className="sticky top-0 bg-white">
              <HeaderControls title="Upcoming Events" />
            </div>

            {/* Dynamically render the upcoming events */}
            {upcomingEvents && upcomingEvents.length > 0 ? (
              upcomingEvents.map((event, index) => (
                <div key={index}>
                  <ListDetailComp
                    icon={<CalendarAssets />}
                    title={event.name}
                    startDate={formatInputDate (event?.start_date)}
                    startTime={event.start_time}
                    eventType={event.event_type}
                    mode={event.location}
                  />
                  <hr className="text-lightGray my-4" />
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center">No upcoming events</div>
            )}
          </div>

          <div className="border border-lightGray rounded-lg p-4 max-lg:h-[40rem] overflow-auto shadow-sm">
            <HeaderControls title="Recent Activities" />
            <ListDetailComp
              icon={<CalendarAssets />}
              title="Event Title"
              startDate="2023-04-06"
              startTime="10:00 AM"
            />
            <hr className="text-lightGray my-4" />
            <ListDetailComp
              icon={<CalendarAssets />}
              title="Event Title"
              startDate="2023-04-06"
              startTime="10:00 AM"
            />
            <hr className="text-lightGray my-4" />
            <ListDetailComp
              icon={<CalendarAssets />}
              title="Event Title"
              startDate="2023-04-06"
              startTime="10:00 AM"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Overview;
