import { Badge } from "@/components/Badge";
import { useRouteAccess } from "@/context/RouteAccessContext";
import {
  CalendarIcon,
  BookOpenIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface AnnualTheme {
  title: string;
  year: string | number;
  verseReference: string;
  verse: string;
  message: string;
  imageUrl?: string | null;
  image?: string | null;
  isActive?: boolean;
}

interface AnnualThemeCardProps {
  theme: AnnualTheme;
  onEdit?: () => void;
  onDelete?: () => void;
}

const AnnualThemeCard = ({ theme, onEdit, onDelete }: AnnualThemeCardProps) => {
  const { canManageCurrentRoute } = useRouteAccess();
  const themeImage = theme.imageUrl || theme.image;

  return (
    <div className="app-card relative overflow-hidden rounded-xl">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {onEdit && canManageCurrentRoute && (
          <button
            onClick={onEdit}
            className="app-icon-btn"
            aria-label="Edit annual theme"
          >
            <PencilSquareIcon className="w-4 h-4 text-gray-700" />
          </button>
        )}
        {onDelete && canManageCurrentRoute && (
          <button
            onClick={onDelete}
            className="app-icon-btn app-icon-btn-danger"
            aria-label="Delete annual theme"
          >
            <TrashIcon className="w-4 h-4 text-red-600" />
          </button>
        )}
      </div>

      {themeImage && (
        <img
          src={themeImage}
          alt={`${theme.title} theme`}
          className="h-44 w-full object-cover"
        />
      )}

      <div className="p-5">
        <div className="mb-2 flex items-start justify-between gap-3 pr-20">
          <h2 className="text-lg font-bold text-gray-900">
            {theme.title}
          </h2>
          {theme.isActive && <Badge>Current theme</Badge>}
        </div>

        <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
          <span className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {theme.year}
          </span>
          {theme.verseReference && (
            <span className="flex items-center gap-2 font-semibold text-gray-800">
              <BookOpenIcon className="h-4 w-4" />
              {theme.verseReference}
            </span>
          )}
        </div>

        {theme.verse && (
          <div className="mb-4 flex gap-3">
            <div className="w-1 shrink-0 rounded-full bg-primary" />
            <p className="line-clamp-3 italic leading-relaxed text-gray-600">
              “{theme.verse}”
            </p>
          </div>
        )}

        {theme.message && (
          <p className="line-clamp-3 leading-relaxed text-gray-700">
            {theme.message}
          </p>
        )}
      </div>
    </div>
  );
};

export default AnnualThemeCard;
