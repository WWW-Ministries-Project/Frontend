
import { Badge } from "@/components/Badge";
import { EventType } from "@/utils";
import { ReactNode, useCallback, useState } from "react";
import { getBadgeColor } from "../utils/eventHelpers";
import ActionButton from "@/pages/HomePage/Components/reusable/ActionButton";

interface IProps {
  item: EventType;
  handleEdit: (item: EventType) => void;
  deleteUniqueEvent: (id: string, name: string) => void;
}

export const AllEventCard = ({
  item,
  handleEdit,
  deleteUniqueEvent,
}: IProps) => {
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [isHovered, setIsHovered] = useState(false);
  const badgeColor = getBadgeColor(item.event_type);

  const handleShowOptions = useCallback((id: string) => {
      setSelectedEventId((prev) => (prev === id ? "" : id));
    }, []);

  // const handleView = () =>
  //   navigate(`life-center/${encodeQuery(String(item?.id))}`);

  return (
    <div 
      className="w-full max-w-[591px] rounded-2xl border border-lightGray bg-white p-4 text-primary shadow-sm transition-shadow hover:shadow-md relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between  items-center">
        <h2 className="text-xl font-medium text-primary">{item.event_name}</h2>
        
        {/* Badge - hidden on hover */}
        <div className={`flex-shrink-0 transition-opacity duration-200 ${isHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <Badge
            className="border text-xs"
            style={{
              backgroundColor: `${badgeColor}20`,
              borderColor: `${badgeColor}40`,
              color: badgeColor,
            }}
          >
            {item.event_type}
          </Badge>
        </div>

        {/* Actions icon - shown on hover */}
        <div
          className={`absolute right-5 top-5 flex flex-col items-end w-1/4 transition-opacity duration-200 ${
            isHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={()=>handleShowOptions(item.id)}
        >
            <ActionButton
            showOptions={selectedEventId === item.id}
              onDelete={() => deleteUniqueEvent(item.id, item.event_name)}
              onEdit={() => handleEdit(item)}
            />
        </div>
      </div>

      <div className="text-sm leading-relaxed text-primaryGray">
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
