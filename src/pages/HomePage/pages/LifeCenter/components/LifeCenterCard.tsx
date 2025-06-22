import ellipse from "@/assets/ellipse.svg";
import Action from "@/components/Action";
import { encodeQuery } from "@/pages/HomePage/utils";
import { LifeCenterType } from "@/utils/api/lifeCenter/interfaces";
import {
  CalendarIcon,
  IdentificationIcon,
  MapPinIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";

interface IProps {
  item: LifeCenterType;
  handleEdit: (item: LifeCenterType) => void;
  deleteLifeCenter: (id: string, name: string) => void;
}
export const LifeCenterCard = ({
  item,
  handleEdit,
  deleteLifeCenter,
}: IProps) => {
  const [showActions, setShowActions] = useState(false);
  const toggleActions = () => setShowActions((prev) => !prev);

  const navigate = useNavigate();

  const handleView = () =>
    navigate(`life-center/${encodeQuery(String(item?.id))}`);

  return (
    <div className="w-full max-w-[591px] flex flex-col rounded-2xl text-[#101840] border border-lightGray p-4 bg-white relative">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-medium mb-2">{item.name}</h2>
        <div
          className="absolute right-5 top-5 flex flex-col items-end w-1/4"
          onClick={toggleActions}
        >
          <img src={ellipse} alt="options" className="cursor-pointer" />
          {showActions && (
            <Action
              onDelete={() => deleteLifeCenter(item.id, item.name)}
              onView={handleView}
              onEdit={() => handleEdit(item)}
            />
          )}
        </div>
      </div>
      <div className="space-y-4">
        <p className="mb-3">{item.description}</p>
        <InfoRow
          icon={<MapPinIcon className="h-6 w-6 text-gray-600" />}
          label={item.location}
        />
        {!!item.meeting_dates?.length && (
          <InfoRow
            icon={<CalendarIcon className="h-6 w-6 text-gray-600" />}
            label={
              <ul className="border flex divide-x-[1px] w-fit">
                {item.meeting_dates.map((date, index) => (
                  <li key={index} className="px-2">
                    {date.slice(0, 2)}
                  </li>
                ))}
              </ul>
            }
          />
        )}
        <InfoRow
          icon={<IdentificationIcon className="h-6 w-6 text-gray-600" />}
          label={`${item.totalMembers || 0} Members`}
        />
        <InfoRow
          icon={<UserIcon className="h-6 w-6 text-gray-600" />}
          label={`${item.totalSoulsWon || 0} Souls won`}
        />
      </div>
    </div>
  );
};

interface InfoRowProps {
  icon: ReactNode;
  label: ReactNode;
}

export const InfoRow = ({ icon, label }: InfoRowProps) => (
  <div className="flex items-center gap-3">
    {icon && <span>{icon}</span>}
    <div>{label}</div>
  </div>
);
