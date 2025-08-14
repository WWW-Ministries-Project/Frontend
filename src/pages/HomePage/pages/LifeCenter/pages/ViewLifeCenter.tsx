import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { decodeQuery } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import { CalendarIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { useParams } from "react-router-dom";
import { InfoRow } from "../components/LifeCenterCard";
import { LifeCenterMembers } from "../components/LifeCenterMembers";
import { SoulsWon } from "../components/SoulsWon";

export function ViewLifeCenter() {
  const { id: lifeCenterId } = useParams();
  const id = decodeQuery(String(lifeCenterId));
  const { data, refetch } = useFetch(api.fetch.fetchLifeCenterById, { id });

  const lifeCenterData = data?.data;

  return (
    <PageOutline className="p-0">
      <div className="space-y-5">
        <div className="bg-primary text-white p-4 px-8 rounded-t-lg space-y-3">
          <div className="space-y-1">
            <p className="text-2xl font-semibold">
              {lifeCenterData?.name || "No name"}
            </p>
            {lifeCenterData?.description && (
              <p>{lifeCenterData?.description || ""}</p>
            )}
          </div>

          <div className="flex gap-5 items-center ">
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

        <div className="flex gap-2 xs:flex-col sm:flex-col md:flex-row  px-8">
          <div className="border border-lightGray rounded-lg xs:w-full p-4 w-full md:w-6/9 ">
            <SoulsWon
              soulsWon={lifeCenterData?.soulsWon || []}
              handleSuccess={refetch}
              lifeCenterId={id}
              hasMembers={lifeCenterData?.members.length !== 0}
              leader={lifeCenterData?.members[0]}
            />
          </div>
          <div className="border border-lightGray w-[35%] xs:w-full sm:w-full md:w-1/2 rounded-lg h-fit">
            <LifeCenterMembers
              refetchLifeCenter={refetch}
              lifeCenterId={id}
              members={lifeCenterData?.members || []}
            />
          </div>
        </div>
      </div>
    </PageOutline>
  );
}
