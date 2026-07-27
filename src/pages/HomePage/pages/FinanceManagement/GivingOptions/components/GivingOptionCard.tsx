import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useRouteAccess } from "@/context/RouteAccessContext";
import type { GivingOption } from "@/utils/api/finance/interface";

interface IProps {
  givingOption: GivingOption;
  onEdit?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
}

const GivingOptionCard = ({
  givingOption,
  onEdit,
  onArchive,
  onRestore,
}: IProps) => {
  const { canManageCurrentRoute } = useRouteAccess();
  const isArchived = Boolean(givingOption.archived_at);

  return (
    <div className="app-card relative space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-base font-semibold text-primary">
            {givingOption.name}
          </p>
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              isArchived
                ? "bg-lightGray text-primaryGray"
                : "bg-green-100 text-green-700"
            }`}
          >
            {isArchived ? "Archived" : "Active"}
          </span>
        </div>

        <div className="flex gap-2">
          {!isArchived && onEdit && canManageCurrentRoute && (
            <button
              onClick={onEdit}
              className="app-icon-btn"
              aria-label={`Edit ${givingOption.name}`}
            >
              <PencilSquareIcon className="h-4 w-4 text-gray-700" />
            </button>
          )}
          {!isArchived && onArchive && canManageCurrentRoute && (
            <button
              onClick={onArchive}
              className="app-icon-btn app-icon-btn-danger"
              aria-label={`Archive ${givingOption.name}`}
            >
              <TrashIcon className="h-4 w-4 text-red-600" />
            </button>
          )}
          {isArchived && onRestore && canManageCurrentRoute && (
            <button
              onClick={onRestore}
              className="app-icon-btn"
              aria-label={`Restore ${givingOption.name}`}
            >
              <ArrowPathIcon className="h-4 w-4 text-gray-700" />
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-primaryGray">
        {givingOption.description || "No description available."}
      </p>

      <div className="space-y-1 text-sm text-primary">
        <p className="font-medium">{givingOption.bank_name}</p>
        <p className="text-primaryGray">
          {givingOption.masked_account_number} &middot;{" "}
          {givingOption.account_name}
        </p>
      </div>

      <p className="text-xs text-primaryGray">
        Routes 100% of payments to this account ({givingOption.currency})
      </p>

      {!givingOption.is_synced && (
        <p className="flex items-start gap-1.5 text-xs font-medium text-amber-600">
          <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          Not in sync with Paystack. Save this option again to re-sync it.
        </p>
      )}
    </div>
  );
};

export default GivingOptionCard;
