import { useState } from "react";
import { useFetch } from "@/CustomHooks/useFetch";
import { InfoRow } from "@/pages/HomePage/pages/LifeCenter/components/LifeCenterCard";
import { SoulsWon } from "@/pages/HomePage/pages/LifeCenter/components/SoulsWon";
import { MeetingsList } from "@/pages/HomePage/pages/LifeCenter/components/Meetings/MeetingsList";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import { useUserStore } from "@/store/userStore";
import { api } from "@/utils/api/apiCalls";
import { CalendarIcon, MapPinIcon } from "@heroicons/react/24/outline";
import BannerWrapper from "../layouts/BannerWrapper";
import lifecenter from "@/assets/banner/lifecenter.svg";

const TABS = ["Souls Won", "My Meetings"] as const;
type Tab = (typeof TABS)[number];

const MyLifeCenter = () => {
  const userData = useUserStore((state) => state);
  const user_id = userData.id;
  const { data, refetch } = useFetch(api.fetch.fetchLifeCenterByUserId, {
    user_id,
  });
  const lifeCenterData = data?.data;
  const [selectedTab, setSelectedTab] = useState<Tab>("Souls Won");

  const isLeadershipMember = Boolean(
    lifeCenterData?.members?.some(
      (m) => String(m.userId) === String(user_id)
    )
  );

  return (
    <div className="space-y-4 ">
      <BannerWrapper imgSrc={lifecenter}>
        <div className="space-y-4 w-full">
          <div className="font-bold text-2xl">
            {lifeCenterData?.name || "No name"}
          </div>
          <div>
            {lifeCenterData?.description && (
              <p>{lifeCenterData?.description || ""}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3 sm:gap-5 items-center ">
            {lifeCenterData?.location && (
              <InfoRow
                icon={<MapPinIcon className="h-6 w-6 " />}
                label={lifeCenterData?.location || "No location"}
              />
            )}

            {lifeCenterData?.meeting_dates && (
              <div className="flex items-center gap-2">
                <InfoRow
                  icon={<CalendarIcon className="h-6 w-6 " />}
                  label={
                    <ul className="border flex divide-x-[1px] w-fit">
                      {lifeCenterData?.meeting_dates.map((date, index) => (
                        <li key={index} className="px-2">
                          {date.slice(0, 3)}
                        </li>
                      ))}
                    </ul>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </BannerWrapper>

      <div className="app-page-padding">
        <TabSelection
          tabs={[...TABS]}
          selectedTab={selectedTab}
          onTabSelect={setSelectedTab}
        />
      </div>

      {selectedTab === "Souls Won" ? (
        <div className=" rounded-lg  ">
          <SoulsWon
            soulsWon={lifeCenterData?.soulsWon || []}
            handleSuccess={refetch}
            lifeCenterId={`${lifeCenterData?.id}`}
            hasMembers={lifeCenterData?.members.length !== 0}
            leader={lifeCenterData?.members[0]}
          />
        </div>
      ) : (
        <div className="rounded-lg">
          <MeetingsList
            lifeCenterId={`${lifeCenterData?.id}`}
            leader={lifeCenterData?.members[0]}
            accessMode="membership"
            isLeadershipMember={isLeadershipMember}
          />
        </div>
      )}
    </div>
  );
};

export default MyLifeCenter;
