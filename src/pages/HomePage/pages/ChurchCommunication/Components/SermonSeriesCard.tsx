import { useRouteAccess } from "@/context/RouteAccessContext";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { SermonSeries } from "@/utils/api/sermons/interfaces";

interface SermonSeriesCardProps {
  item: SermonSeries;
  onEdit?: () => void;
  onDelete?: () => void;
}

const SermonSeriesCard = ({ item, onEdit, onDelete }: SermonSeriesCardProps) => {
  const { canManageCurrentRoute } = useRouteAccess();
  const sermons = item.sermons ?? [];

  return (
    <div className="app-card flex flex-col gap-3 rounded-xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-semibold text-gray-900">
              {item.title}
            </h2>
            <span className="text-xs text-gray-400">
              {sermons.length} {sermons.length === 1 ? "sermon" : "sermons"}
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
