import ellipse from "@/assets/ellipse.svg";
import Action from "@/components/Action";
import { Badge } from "@/components/Badge";
import { encodeQuery } from "@/pages/HomePage/utils";
import { EventType } from "@/utils";
import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBadgeColor } from "../utils/eventHelpers";

interface IProps {
  item: EventType;
  handleEdit: (item: EventType) => void;
  deleteAllEvent: (id: string, name: string) => void;
}

export const AllEventCard = ({
  item,
  handleEdit,
  deleteAllEvent,
}: IProps) => {
  const [showActions, setShowActions] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const toggleActions = () => setShowActions((prev) => !prev);

  const navigate = useNavigate();

  const handleView = () =>
    navigate(`life-center/${encodeQuery(String(item?.id))}`);

  return (
    <div 
      className="w-full max-w-[591px] flex flex-col rounded-2xl text-[#101840] border border-lightGray p-4 bg-white relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between  items-center">
        <h2 className="text-xl font-medium">{item.event_name}</h2>
        
        {/* Badge - hidden on hover */}
        <div className={`flex-shrink-0 transition-opacity duration-200 ${isHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <Badge className={`bg-[${getBadgeColor(item.event_type)}] text-xs`}>
            {item.event_type}
          </Badge>
        </div>

        {/* Actions icon - shown on hover */}
        <div
          className={`absolute right-5 top-5 flex flex-col items-end w-1/4 transition-opacity duration-200 ${
            isHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={toggleActions}
        >
          <img src={ellipse} alt="options" className="cursor-pointer" />
          {showActions && (
            <Action
              onDelete={() => deleteAllEvent(item.id, item.event_name)}
              onView={handleView}
              onEdit={() => handleEdit(item)}
            />
          )}
        </div>
      </div>

      <div className="text-gray-600 text-sm leading-relaxed">
        {item.event_description}
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