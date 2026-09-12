import { Badge } from "@/components/Badge";
import { useRouteAccess } from "@/context/RouteAccessContext";
import {
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/outline";
import type { Sermon } from "@/utils/api/sermons/interfaces";

interface SermonCardProps {
  item: Sermon;
  toggling?: boolean;
  onEdit?: () => void;
  onTogglePublish?: () => void;
  onDelete?: () => void;
}

const MAX_VISIBLE_TAGS = 3;

export const SermonCard = ({
  item,
  toggling,
  onEdit,
  onTogglePublish,
  onDelete,
}: SermonCardProps) => {
  const { canManageCurrentRoute } = useRouteAccess();
  const isPublished = item.status === "PUBLISHED";
  const tags = item.tags ?? [];
  const hiddenTagCount = Math.max(0, tags.length - MAX_VISIBLE_TAGS);

  return (
    <div className="app-card flex flex-col overflow-hidden rounded-xl">
      <a
        href={item.youtube_url}
        target="_blank"
        rel="noreferrer"
        className="group relative block aspect-video w-full bg-gray-100"
      >
        {item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
            No thumbnail
          </div>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/25">
          <PlayCircleIcon className="h-10 w-10 text-white opacity-0 transition group-hover:opacity-100" />
        </span>
      </a>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
            {item.title}
          </h3>
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

        {item.series && (
          <p className="truncate text-xs text-gray-500">{item.series.title}</p>
        )}

        {item.description && (
          <p className="line-clamp-2 text-xs text-gray-500">
            {item.description}
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, MAX_VISIBLE_TAGS).map((tag) => (
              <span
                key={tag.id}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600"
              >
                {tag.name}
              </span>
            ))}
            {hiddenTagCount > 0 && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                +{hiddenTagCount}
              </span>
            )}
          </div>
        )}

        {canManageCurrentRoute && (
          <div className="mt-auto flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onEdit}
              className="text-gray-500 hover:text-primary"
              aria-label={`Edit ${item.title}`}
            >
              <PencilSquareIcon className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onTogglePublish}
              disabled={toggling}
              className="text-gray-500 hover:text-primary disabled:opacity-40"
              aria-label={
                isPublished ? `Unpublish ${item.title}` : `Publish ${item.title}`
              }
            >
              {isPublished ? (
                <EyeSlashIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="text-gray-500 hover:text-red-500"
              aria-label={`Delete ${item.title}`}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SermonCard;
