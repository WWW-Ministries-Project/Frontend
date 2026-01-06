import { useFetch } from "@/CustomHooks/useFetch";
import { InfoRow } from "@/pages/HomePage/pages/LifeCenter/components/LifeCenterCard";
import { SoulsWon } from "@/pages/HomePage/pages/LifeCenter/components/SoulsWon";
import { useUserStore } from "@/store/userStore";
import { api } from "@/utils/api/apiCalls";
import { CalendarIcon, MapPinIcon } from "@heroicons/react/24/outline";
import BannerWrapper from "../layouts/BannerWrapper";
import lifecenter from "@/assets/banner/lifecenter.svg";


const MyLifeCenter = () => {
    const userData = useUserStore((state) => state);
    const user_id = userData.id
    const { data, refetch } = useFetch(api.fetch.fetchLifeCenterByUserId, { user_id });
    const lifeCenterData = data?.data;
    
    return ( 
       <div className="space-y-4 ">
       <BannerWrapper imgSrc={lifecenter}>
                <div className="space-y-4 w-full">
                    <div className="font-bold text-2xl">
                    {lifeCenterData?.name || "No name"}
                </div>
                <div>
                    {lifeCenterData?.description&&<p>{lifeCenterData?.description || ""}</p>}
                </div>
                <div className="flex gap-5 items-center ">
            {lifeCenterData?.location&&<InfoRow
              icon={<MapPinIcon className="h-6 w-6 " />}
              label={lifeCenterData?.location || "No location"}
            />}

            {lifeCenterData?.meeting_dates&&<div className="flex items-center gap-2">
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
            </div>}
            
            
          </div>
                </div>
            </BannerWrapper>
            <div className=" rounded-lg  ">
                <SoulsWon
                    soulsWon={lifeCenterData?.soulsWon || []}
                    handleSuccess={refetch}
                    lifeCenterId={`${lifeCenterData?.id}`}
                    hasMembers={lifeCenterData?.members.length!==0}
                    leader={lifeCenterData?.members[0]}
                />
            </div>
            
        </div>
     );
}

export default MyLifeCenter;