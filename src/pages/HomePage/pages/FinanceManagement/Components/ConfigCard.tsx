import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { FinanceConfigValues } from "./FinanceConfigForm";


interface Iprops {
    configData: FinanceConfigValues;
    onEdit?: () => void;
    onDelete?: () => void;
}



const ConfigCard = ({configData, onEdit, onDelete}: Iprops ) => {
    return ( 
        <div className="rounded-lg border p-6 ">
                    <div className="flex gap-3 items-center justify-between">
                        <p>{configData.name}</p>

                        <div className="flex gap-2">
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
                    </div>

                    <div className="flex gap-3 text-sm text-gray-600">
                        <p>{configData.description}</p>
                    </div>

                    {configData.percentage&&<div className="flex gap-3">
                        <p>{configData.percentage}</p>
                    </div>}
                </div>
     );
}
 
export default ConfigCard;