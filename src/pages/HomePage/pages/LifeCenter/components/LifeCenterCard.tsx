import React, { useState } from "react";
import { LifeCenterType } from "../LifeCenter";
import Action from "@/components/Action";
import ellipse from "@/assets/ellipse.svg";
import { Dialog } from "@/components/Dialog";
import { encodeQuery, showDeleteDialog } from "@/pages/HomePage/utils";
import { api } from "@/utils";
import { useDelete } from "@/CustomHooks/useDelete";
import { useNavigate } from "react-router-dom";

interface Props {
  item: LifeCenterType;
  handleEdit: (item: LifeCenterType) => void;
  handleDelete: (id: string) => void;
}

const InfoRow = ({ icon, label }: { icon: string; label: React.ReactNode }) => (
  <div className="flex items-center gap-1">
    <img src={icon} className="size-5" />
    <p>{label}</p>
  </div>
);

const LifeCenterCard: React.FC<Props> = ({ item, handleEdit, handleDelete }) => {
  const [showActions, setShowActions] = useState(false);
  const toggleActions = () => setShowActions((prev) => !prev);

  const { executeDelete } = useDelete(api.delete.deleteLifeCenter);
  const navigate = useNavigate();

  const handleView = () =>
    navigate(`/home/members/${encodeQuery(String(item?.id))}/info`);

  const deleteLifeCenter = () => {
    showDeleteDialog({ id: item.id as string, name: item.name }, async () => {
      await executeDelete({ id: String(item.id) });
      handleDelete(item.id as string);
    });
  };

  return (
    <div className="w-full max-w-[591px] flex flex-col rounded-2xl text-[#101840] border border-lightGray p-4 bg-white relative">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-medium mb-2">{item.name}</h2>
        <div className="absolute right-5 top-5 flex flex-col items-end w-1/4" onClick={toggleActions}>
          <img src={ellipse} alt="options" className="cursor-pointer" />
          {showActions && (
            <Action onDelete={deleteLifeCenter} onView={handleView} onEdit={() => handleEdit(item)} />
          )}
        </div>
      </div>
      <div className="space-y-4">
        <p className="mb-3">{item.description}</p>
        <InfoRow icon="/src/assets/location.svg" label={item.location} />
        {!!item.meeting_dates?.length && (
          <InfoRow
            icon="/src/assets/calendar.svg"
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
        <InfoRow icon="/src/assets/member.svg" label={`${item.num_of_members || 0} Members`} />
        <InfoRow icon="/src/assets/user-profile.svg" label={`${item.num_of_souls_won || 0} Souls won`} />
      </div>
      <Dialog />
    </div>
  );
};

export default LifeCenterCard;
