import { Badge } from "@/components/Badge";
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
  isActive?: boolean;
}

interface AnnualThemeCardProps {
  theme: AnnualTheme;
  onEdit?: () => void;
  onDelete?: () => void;
}

const AnnualThemeCard = ({ theme, onEdit, onDelete }: AnnualThemeCardProps) => {
  return (
    <div className="border rounded-xl  p-6 relative">
      {/* Action buttons */}
      <div className="absolute top-4 right-4 flex gap-2">
        {onEdit && (
          <button
            onClick={onEdit}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
            aria-label="Edit annual theme"
          >
            <PencilSquareIcon className="w-4 h-4 text-gray-700" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-red-200 bg-white hover:bg-red-50"
            aria-label="Delete annual theme"
          >
            <TrashIcon className="w-4 h-4 text-red-600" />
          </button>
        )}
      </div>

      {/* Title row */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex gap-2">
            <h2 className="text-xl font-bold text-gray-900">
          {theme.title}
        </h2>
        {theme.isActive && (
          <Badge>
            Current theme
          </Badge>
        )}
        </div>
        
      </div>

      {/* Year */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <CalendarIcon className="w-4 h-4" />
        <span>{theme.year}</span>
      </div>

      {/* Scripture */}
      <div className="flex items-center gap-2 font-semibold text-gray-900 mb-3">
        <BookOpenIcon className="w-4 h-4" />
        <span>{theme.verseReference}</span>
      </div>

      {/* Verse */}
      <div className="flex gap-3 mb-4">
        <div className="w-1 bg-primary rounded-full" />
        <p className="italic text-gray-600 leading-relaxed">
          “{theme.verse}”
        </p>
      </div>

      {/* Description */}
      <p className="text-gray-700 leading-relaxed">
        {theme.message}
      </p>
    </div>
  );
};

export default AnnualThemeCard;