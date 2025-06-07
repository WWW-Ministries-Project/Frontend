import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils/api/apiCalls";
import { decodeQuery } from "@/pages/HomePage/utils";
import { useParams } from "react-router-dom";
import { SoulsWon } from "../components/SoulsWon";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import VisitorIcon from "@/assets/sidebar/VisitorIcon";
import { useEffect, useState } from "react";
import { SoulsWonType } from "@/utils";

export function ViewLifeCenter() {
  const { id } = useParams();

  const LCId = decodeQuery(String(id));
  const { data } = useFetch(api.fetch.fetchLifeCenterById, {
    id: LCId,
  });
  const [soulsWon, setSoulsWon] = useState<SoulsWonType[]>([])

  const LCData = data?.data;

  useEffect(()=>{
    if(LCData){
        setSoulsWon(LCData.soulsWon)
    }
  },[LCData])

  return (
    <PageOutline>
      
        <div className="space-y-5">
          <div className="bg-primary text-white p-4 rounded-t-lg">
            <div className="space-y-1">
              <p className=" text-2xl font-semibold">{LCData?.name || "No name"}</p>
              <p>{LCData?.description || "No description"}</p>
            </div>

            <div className="flex gap-5 items-center justify-between mt-3 pr-5  ">
              <div className="flex items-center gap-2">
                <img src="/src/assets/location.svg" className="size-5" />
                <p>{LCData?.location || "No location"}</p>
              </div>
              <div className="flex items-center gap-2">
                <img src="/src/assets/calendar.svg" className="size-5" />
                <ul className="border flex divide-x-[1px] w-fit">
                  {LCData?.meeting_dates?.map((date, index) => (
                    <li key={index} className="px-2">
                      {date.slice(0, 3)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center gap-2">
                <img src="/src/assets/member.svg" className="size-5" />
                <p>{LCData?.num_of_members || 0} Members</p>
              </div>
              <div className="flex items-center gap-2">
                <VisitorIcon />

                <p>{LCData?.num_of_souls_won || 0} Souls won</p>
              </div>
            </div>
          </div>

          <div className="border border-lightGray rounded-lg p-4">
            <SoulsWon soulsWon={soulsWon} />
          </div>
        </div>
      
    </PageOutline>
  );
}
