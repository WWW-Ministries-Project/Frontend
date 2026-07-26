import { Badge } from "@/components/Badge";
import { useRouteAccess } from "@/context/RouteAccessContext";
import {
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import type { SermonSeries } from "@/utils/api/sermons/interfaces";

interface SermonSeriesCardProps {
  item: SermonSeries;
  toggling?: boolean;
  onEdit?: () => void;
  onTogglePublish?: () => void;
  onDelete?: () => void;
}

const SermonSeriesCard = ({
  item,
  toggling,
  onEdit,
  onTogglePublish,
  onDelete,
}: SermonSeriesCardProps) => {
  const { canManageCurrentRoute } = useRouteAccess();
  const isPublished = item.status === "PUBLISHED";
  const sermons = item.sermons ?? [];

  return (
    <div className="app-card flex flex-col gap-3 rounded-xl p-4">
      <div className="flex items-start justify-between gap-4">
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
            <span className="text-xs text-gray-400">
              {sermons.length} {sermons.length === 1 ? "video" : "videos"}
            </span>
          </div>
          {item.description && (
            <p className="text-sm text-gray-500">{item.description}</p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          {onEdit && canManageCurrentRoute && (
            <button
              onClick={onEdit}
              className="app-icon-btn"
              aria-label="Edit sermon series"
            >
              <PencilSquareIcon className="h-4 w-4 text-gray-700" />
            </button>
          )}
          {onTogglePublish && canManageCurrentRoute && (
            <button
              onClick={onTogglePublish}
              disabled={toggling}
              className="app-icon-btn disabled:opacity-50"
              aria-label={
                isPublished ? "Unpublish sermon series" : "Publish sermon series"
              }
              title={isPublished ? "Unpublish" : "Publish"}
            >
              {isPublished ? (
                <EyeSlashIcon className="h-4 w-4 text-gray-700" />
              ) : (
                <EyeIcon className="h-4 w-4 text-gray-700" />
              )}
            </button>
          )}
          {onDelete && canManageCurrentRoute && (
            <button
              onClick={onDelete}
              className="app-icon-btn app-icon-btn-danger"
              aria-label="Delete sermon series"
            >
              <TrashIcon className="h-4 w-4 text-red-600" />
            </button>
          )}
        </div>
      </div>

      {sermons.length > 0 && (
        <ul className="flex flex-col gap-1 border-t pt-3">
          {sermons.map((sermon) => (
            <li key={sermon.id} className="truncate text-sm">
              <a
                href={sermon.youtube_url}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                {sermon.title || sermon.youtube_url}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SermonSeriesCard;
