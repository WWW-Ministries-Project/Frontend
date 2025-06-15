import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils/api/apiCalls";
import { decodeQuery } from "@/pages/HomePage/utils";
import { useParams } from "react-router-dom";
import { SoulsWon } from "../components/SoulsWon";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import VisitorIcon from "@/assets/sidebar/VisitorIcon";
import { useCallback, useEffect, useState } from "react";
import { ISoulsWonForm } from "../components/SoulsWonForm";
import { InfoRow } from "../components/LifeCenterCard";
import { LocationIcon } from "@/assets/LocationIcon";
import { MemberIcon } from "@/assets/MemberIcon";
import { CalendarIcon } from "@/assets/CalendarIcon";

export function ViewLifeCenter() {
  const { id: lifeCenterId } = useParams();
  const id = decodeQuery(String(lifeCenterId));
  const { data } = useFetch(api.fetch.fetchLifeCenterById, { id });

  const lifeCenterData = data?.data;

  const [souls, setSouls] = useState<ISoulsWonForm[]>([]);

  useEffect(() => {
    if (lifeCenterData?.soulsWon) {
      setSouls(lifeCenterData.soulsWon);
    }
  }, [lifeCenterData?.soulsWon]);

  const addSoul = useCallback((data: ISoulsWonForm) => {
    setSouls((prevSouls) => {
      if (prevSouls.find((soul) => soul.id === data.id)) return prevSouls;
      return [data, ...prevSouls];
    });
  }, []);

  const editSoul = useCallback((item: ISoulsWonForm) => {
    setSouls((prevSouls) =>
      prevSouls.map((soul) => (soul.id === item.id ? item : soul))
    );
  }, []);

  return (
    <PageOutline>
      <div className="space-y-5">
        <div className="bg-primary text-white p-4 rounded-t-lg">
          <div className="space-y-1">
            <p className="text-2xl font-semibold">
              {lifeCenterData?.name || "No name"}
            </p>
            <p>{lifeCenterData?.description || "No description"}</p>
          </div>

          <div className="flex gap-5 items-center justify-between mt-3 pr-5">
            <InfoRow
              icon={<LocationIcon />}
              label={lifeCenterData?.location || "No location"}
            />

            <div className="flex items-center gap-2">
              <InfoRow
                icon={<CalendarIcon />}
                label={
                  <ul className="border flex divide-x-[1px] w-fit">
                    {lifeCenterData?.meeting_dates.map((date, index) => (
                      <li key={index} className="px-2">
                        {date.slice(0, 2)}
                      </li>
                    ))}
                  </ul>
                }
              />
            </div>
            <InfoRow
              icon={<MemberIcon />}
              label={`${lifeCenterData?.totalMembers || 0} Members`}
            />
            <InfoRow
              icon={<VisitorIcon />}
              label={`${lifeCenterData?.totalSoulsWon || 0} Souls won`}
            />
          </div>
        </div>

        <div className="border border-lightGray rounded-lg p-4">
          <SoulsWon
            soulsWon={souls}
            setSoulsWon={setSouls}
            addToSoul={addSoul}
            editSoul={editSoul}
          />
        </div>
      </div>
    </PageOutline>
  );
}
