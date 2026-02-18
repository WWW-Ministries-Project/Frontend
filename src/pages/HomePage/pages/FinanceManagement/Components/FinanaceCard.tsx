import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

interface Finance {
  id?: number | string;
  title: string;
  createdBy?: string;
  createdDate?: string;
  from?: string;
  to?: string;
  updatedBy?: string;
  updatedDate?: string;
}

interface FinanceCardProps {
  finance: Finance;
  onEdit?: () => void;
  onDelete?: () => void;
}

const FinanceCard = ({ finance, onEdit, onDelete }: FinanceCardProps) => {
  const navigate = useNavigate();
  return (
    <div className="relative space-y-3 rounded-lg border bg-white p-4 shadow-sm">
      <div className="absolute right-4 top-4 flex gap-2">
        {onEdit && (
          <button
            onClick={onEdit}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
            aria-label="Edit financial record"
          >
            <PencilSquareIcon className="w-4 h-4 text-gray-700" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-red-200 bg-white hover:bg-red-50"
            aria-label="Delete financial record"
          >
            <TrashIcon className="w-4 h-4 text-red-600" />
          </button>
        )}
      </div>
      <button
        type="button"
        className="w-full cursor-pointer space-y-2 text-left"
        onClick={() => {
          if (!finance?.id) return;
          navigate(`${finance.id}`);
        }}
      >
        <div className="text-base font-semibold text-gray-900">{finance.title}</div>

        <div className="text-sm text-gray-600">
          <span className="font-medium text-gray-700">Created by:</span>{" "}
          {finance.createdBy || "—"} on {finance.createdDate || "—"}
        </div>

        <div className="text-sm text-gray-600">
          <span className="font-medium text-gray-700">Period:</span>{" "}
          {finance.from || "—"} – {finance.to || "—"}
        </div>

        <div className="text-sm text-gray-600">
          <span className="font-medium text-gray-700">Last updated:</span>{" "}
          {finance.updatedBy || "—"} on {finance.updatedDate || "—"}
        </div>
      </button>
    </div>
  );
};

export default FinanceCard;
