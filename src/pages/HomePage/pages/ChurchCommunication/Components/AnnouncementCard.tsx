import { Badge } from "@/components/Badge";
import { useRouteAccess } from "@/context/RouteAccessContext";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { Announcement } from "@/utils/api/announcements/interfaces";

const AUDIENCE_LABELS: Record<Announcement["audience_type"], string> = {
  ALL_MEMBERS: "All members",
  MINISTRY_WORKERS: "Ministry workers",
  HEADS_OF_DEPARTMENT: "Heads of department",
  SPECIFIC_DEPARTMENT: "Specific department",
  SPECIFIC_POSITION: "Specific position",
};

interface AnnouncementCardProps {
  item: Announcement;
  onEdit?: () => void;
  onDelete?: () => void;
}

const AnnouncementCard = ({ item, onEdit, onDelete }: AnnouncementCardProps) => {
  const { canManageCurrentRoute } = useRouteAccess();
  const isPublished = item.status === "PUBLISHED";

  const audienceLabel =
    item.audience_type === "SPECIFIC_DEPARTMENT" && item.department?.name
      ? item.department.name
      : item.audience_type === "SPECIFIC_POSITION" && item.position?.name
        ? item.position.name
        : AUDIENCE_LABELS[item.audience_type];

  return (
    <div className="app-card flex items-center justify-between gap-4 rounded-xl p-4">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h2 className="truncate text-base font-semibold text-gray-900">
            {item.title}
          </h2>
          <Badge
            className={
              isPublished
                ? "border-green-200 bg-green-50 text-xs text-green-700"
                : "border-gray-200 bg-gray-100 text-xs text-gray-600"
            }
          >
            {isPublished ? "Published" : "Draft"}
          </Badge>
        </div>
        <p className="text-sm text-gray-500">{audienceLabel}</p>
      </div>

      <div className="flex shrink-0 gap-2">
        {onEdit && canManageCurrentRoute && (
          <button
            onClick={onEdit}
            className="app-icon-btn"
            aria-label="Edit announcement"
          >
            <PencilSquareIcon className="h-4 w-4 text-gray-700" />
          </button>
        )}
        {onDelete && canManageCurrentRoute && (
          <button
            onClick={onDelete}
            className="app-icon-btn app-icon-btn-danger"
            aria-label="Delete announcement"
          >
            <TrashIcon className="h-4 w-4 text-red-600" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AnnouncementCard;
