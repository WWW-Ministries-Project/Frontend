
import { Badge } from "@/components/Badge";
import { EventType } from "@/utils";
import { ReactNode, useCallback, useState } from "react";
import { getBadgeColor } from "../utils/eventHelpers";
import ActionButton from "@/pages/HomePage/Components/reusable/ActionButton";

interface IProps {
  item: EventType;
  handleEdit: (item: EventType) => void;
  deleteUniqueEvent: (id: string, name: string) => void;
  onView?: (item: EventType) => void;
}

export const AllEventCard = ({
  item,
  handleEdit,
  deleteUniqueEvent,
  onView,
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
        <h2
          className={`text-xl font-medium text-primary ${onView ? "cursor-pointer hover:text-primary/70" : ""}`}
          onClick={onView ? (e) => { e.stopPropagation(); onView(item); } : undefined}
        >{item.event_name}</h2>
        
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

      {onView && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onView(item); }}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/70 transition-colors"
        >
          View schedules
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
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
