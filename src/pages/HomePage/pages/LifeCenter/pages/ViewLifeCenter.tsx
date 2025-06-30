import VisitorIcon from "@/assets/sidebar/VisitorIcon";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { decodeQuery } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import {
  CalendarIcon,
  MapPinIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
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
              icon={<MapPinIcon className="h-6 w-6 text-gray-600" />}
              label={lifeCenterData?.location || "No location"}
            />

            <div className="flex items-center gap-2">
              <InfoRow
                icon={<CalendarIcon className="h-6 w-6 text-gray-600" />}
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
              icon={<UserIcon className="h-6 w-6 text-gray-600" />}
              label={`${lifeCenterData?.members?.length || 0} Members`}
            />
            <InfoRow
              icon={<VisitorIcon />}
              label={`${lifeCenterData?.soulsWon?.length || 0} Souls won`}
            />
          </div>
        </div>

        <div className="flex gap-2 xs:flex-col sm:flex-col md:flex-row  ">
          <div className="border border-lightGray rounded-lg xs:w-full p-4 w-[75%] sm:w-full md:w-1/2 lg:w-[75%]">
            <SoulsWon
              soulsWon={lifeCenterData?.soulsWon || []}
              handleSuccess={refetch}
              lifeCenterId={id}
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
