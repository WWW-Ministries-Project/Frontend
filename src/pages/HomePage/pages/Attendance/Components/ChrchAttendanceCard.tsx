import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useRouteAccess } from "@/context/RouteAccessContext";
import { IChurchAttendanceForm } from "../Components/ChurchAttendanceForm";

interface Props {
  record: IChurchAttendanceForm;
  onEdit: (record: IChurchAttendanceForm) => void;
  onDelete?: (record: IChurchAttendanceForm) => void;
}

const ChurchAttendanceCard = ({ record, onEdit, onDelete }: Props) => {
  const { canManageCurrentRoute } = useRouteAccess();
  const getTotals = () => {
    const adultTotal = (record.adultMale ?? 0) + (record.adultFemale ?? 0);
    const childTotal =
      (record.childrenMale ?? 0) + (record.childrenFemale ?? 0);
    const youthTotal = (record.youthMale ?? 0) + (record.youthFemale ?? 0);
    const total = adultTotal + childTotal + youthTotal;
    return { adultTotal, childTotal, youthTotal, total };
  };

  return (
    <div className="grid grid-cols-10 items-center px-4 py-3 text-sm border-t gap-x-3">
      <div>
        {record.event_name ?? "Unknown Event"}
      </div>
      <div>
        {new Date(record.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </div>

      <div>
        <span className="px-2 py-1 rounded-full bg-gray-100 text-xs">
          {record.group === "ADULTS"
            ? "Adults"
            : record.group === "CHILDREN"
            ? "Children"
            : "Both"}
        </span>
      </div>

      <div>
        {record.group !== "CHILDREN"
          ? <div className="flex flex-col">
            <div>
              M: {record.adultMale ?? 0} 
            </div>
            <div>
              F: {record.adultFemale ?? 0}
            </div>
            <div className="font-semibold">
              Total: {getTotals().adultTotal}
            </div>
          </div>
          : "—"}
      </div>

      <div>
        {record.group !== "ADULTS"
          ? <div className="flex flex-col">
            <div>
              M: {record.childrenMale ?? 0}
            </div>
            <div>
              F: {record.childrenFemale ?? 0}
            </div>
            <div>
              Total: {getTotals().childTotal}
            </div>
          </div>
          : "—"}
      </div>

      <div>
        <div className="flex flex-col">
          <div>
            M: {record.youthMale ?? 0}
          </div>
          <div>
            F: {record.youthFemale ?? 0}
          </div>
          <div className="font-semibold">
            Total: {getTotals().youthTotal}
          </div>
        </div>
      </div>

      <div className="font-semibold">{record.visitingPastors ?? 0}</div>

      <div className="font-semibold">{getTotals().total}</div>

      <div className="text-xs text-gray-600">
        <p className="font-medium">{record.recordedByName}</p>
        {/* <p>
          Updated by:{" "}
          <span className="font-medium">{record.lastUpdatedBy}</span>
        </p> */}
      </div>

      <div className="flex justify-end gap-3">
        {canManageCurrentRoute && (
          <>
            <button
              onClick={() => onEdit(record)}
              className="text-gray-600 hover:text-black"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete?.(record)}
              className="text-red-500 hover:text-red-700"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ChurchAttendanceCard;
