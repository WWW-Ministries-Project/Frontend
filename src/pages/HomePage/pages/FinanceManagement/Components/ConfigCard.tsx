import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useRouteAccess } from "@/context/RouteAccessContext";
import { FinanceConfigValues } from "./FinanceConfigForm";


interface Iprops {
    configData: FinanceConfigValues;
    onEdit?: () => void;
    onDelete?: () => void;
}



const ConfigCard = ({configData, onEdit, onDelete}: Iprops ) => {
    const { canManageCurrentRoute } = useRouteAccess();
    return ( 
        <div className="app-card relative space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <p className="pr-20 text-base font-semibold text-primary">{configData.name}</p>

                        <div className="flex gap-2">
        {onEdit && canManageCurrentRoute && (
          <button
            onClick={onEdit}
            className="app-icon-btn"
            aria-label={`Edit ${configData.name}`}
          >
            <PencilSquareIcon className="w-4 h-4 text-gray-700" />
          </button>
        )}
        {onDelete && canManageCurrentRoute && (
          <button
            onClick={onDelete}
            className="app-icon-btn app-icon-btn-danger"
            aria-label={`Delete ${configData.name}`}
          >
            <TrashIcon className="w-4 h-4 text-red-600" />
          </button>
        )}
      </div>
                    </div>

                    <div className="text-sm text-primaryGray">
                        <p>{configData.description || "No description available."}</p>
                    </div>

                    {configData.percentage !== undefined && (
                      <div className="text-sm font-medium text-primary">
                        <p>Percentage: {configData.percentage}%</p>
                      </div>
                    )}
                </div>
     );
}
 
export default ConfigCard;
