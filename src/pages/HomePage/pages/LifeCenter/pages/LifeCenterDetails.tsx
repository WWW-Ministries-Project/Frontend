import { HeaderControls } from "@/components/HeaderControls";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils/api/apiCalls";
import { decodeQuery } from "@/pages/HomePage/utils";
import { useParams } from "react-router-dom";
import { SoulsWon } from "../components/SoulsWon";

export function LifeCenterDetails() {
  const { id } = useParams();

  const LCId = decodeQuery(String(id));
  const { data } = useFetch(api.fetch.fetchLifeCenterById, {
    id: LCId,
  });

  const LCData = data?.data;
  return (
    <div className="bg-white rounded-xl flex flex-col gap-4 m-4 p-4 min-h-[100vh] h-fit">
      {LCData && (
        <div className="space-y-10">
          <HeaderControls
            title={LCData.name}
            subtitle={LCData.description}
            screenWidth={window.innerWidth}
          />
          <div className="flex flex-wrap gap-5 items-start ">
            <div className="flex items-center gap-2">
              <img src="/src/assets/location.svg" className="size-5" />
              <p>{LCData.location}</p>
            </div>
            <div className="flex items-center gap-2">
              <img src="/src/assets/calendar.svg" className="size-5" />
              <ul className="border flex divide-x-[1px] w-fit">
                {LCData.meeting_dates.map((date, index) => (
                  <li key={index} className="px-2">
                    {date.slice(0, 3)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center gap-2">
              <img src="/src/assets/member.svg" className="size-5" />
              <p>{LCData.num_of_members || 0} Members</p>
            </div>
            <div className="flex items-center gap-2">
              <img src="/src/assets/user-profile.svg" className="size-5" />
              <p>{LCData.num_of_souls_won || 0} Souls won</p>
            </div>
          </div>
          <div className="border border-lightGray rounded-lg p-4">
            
            <SoulsWon LCData={LCData}/>
          </div>
        </div>
      )}
    </div>
  );
}
