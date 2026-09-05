import { Badge } from "@/components/Badge";
import { useRouteAccess } from "@/context/RouteAccessContext";
import {
  ArchiveBoxArrowDownIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import type { Promotion } from "@/utils/api/promotions/interfaces";

interface PromotionCardProps {
  item: Promotion;
  onEdit?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

/** A published promotion is only actually on a member's Home screen when today
 *  falls inside its window, so the card reports that derived state rather than
 *  the raw status — "Published" alone would be misleading for a banner that is
 *  scheduled for next month or already expired. */
const getLiveState = (item: Promotion) => {
  if (item.status === "DRAFT") {
    return { label: "Draft", className: "border-gray-200 bg-gray-100 text-gray-600" };
  }
  if (item.status === "ARCHIVED") {
    return { label: "Archived", className: "border-gray-200 bg-gray-100 text-gray-500" };
  }

  const now = Date.now();
  const start = item.start_date ? new Date(item.start_date).getTime() : null;
  const end = item.end_date ? new Date(item.end_date).getTime() : null;

  if (start !== null && start > now) {
    return { label: "Scheduled", className: "border-blue-200 bg-blue-50 text-blue-700" };
  }
  if (end !== null && end < now) {
    return { label: "Expired", className: "border-amber-200 bg-amber-50 text-amber-700" };
  }
  return { label: "Live", className: "border-green-200 bg-green-50 text-green-700" };
};

const formatWindow = (item: Promotion) => {
  const format = (value: string | null) =>
    value ? new Date(value).toLocaleDateString() : null;
  const start = format(item.start_date);
  const end = format(item.end_date);

  if (start && end) return `${start} – ${end}`;
  if (start) return `From ${start}`;
  if (end) return `Until ${end}`;
  return "Always on";
};

const PromotionCard = ({
  item,
  onEdit,
  onArchive,
  onDelete,
}: PromotionCardProps) => {
  const { canManageCurrentRoute } = useRouteAccess();
  const liveState = getLiveState(item);

  return (
    <div className="app-card flex items-center gap-4 rounded-xl p-4">
      {item.image_url ? (
        <img
          src={item.image_url}
          alt=""
          className="h-14 w-24 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
          No image
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h2 className="truncate text-base font-semibold text-gray-900">
            {item.title}
          </h2>
          <Badge className={`text-xs ${liveState.className}`}>
            {liveState.label}
          </Badge>
          {item.sort_order !== null && (
            <Badge className="border-gray-200 bg-gray-50 text-xs text-gray-600">
              Order {item.sort_order}
            </Badge>
          )}
        </div>
        <p className="truncate text-sm text-gray-500">
          {formatWindow(item)}
          {item.deep_link ? ` · ${item.deep_link}` : ""}
        </p>
      </div>

      <div className="flex shrink-0 gap-2">
        {onEdit && canManageCurrentRoute && (
          <button
            onClick={onEdit}
            className="app-icon-btn"
            aria-label="Edit promotion"
          >
            <PencilSquareIcon className="h-4 w-4 text-gray-700" />
          </button>
        )}
        {onArchive && canManageCurrentRoute && item.status === "PUBLISHED" && (
          <button
            onClick={onArchive}
            className="app-icon-btn"
            aria-label="Archive promotion"
          >
            <ArchiveBoxArrowDownIcon className="h-4 w-4 text-gray-700" />
          </button>
        )}
        {onDelete && canManageCurrentRoute && (
          <button
            onClick={onDelete}
            className="app-icon-btn app-icon-btn-danger"
            aria-label="Delete promotion"
          >
            <TrashIcon className="h-4 w-4 text-red-600" />
          </button>
        )}
      </div>
    </div>
  );
};

export default PromotionCard;
