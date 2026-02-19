import { UserGroupIcon, UserIcon } from "@heroicons/react/24/outline";

const ChurchAttendanceHeader = () => {
    return (
        <div className="grid grid-cols-10 px-4 py-2 gap-x-3 text-sm font-medium text-gray-500 border-t">
            <div>Event</div>
            <div>Date</div>
            <div>Group</div>
            <div className="flex items-center gap-1">
                <UserGroupIcon className="h-4 w-4" /> Adults
            </div>
            <div className="flex items-center gap-1">
                <UserIcon className="h-4 w-4" /> Children
            </div>
            <div>Youth</div>
            <div>Visiting Pastors</div>
            <div>Total</div>
            <div>Recorded by</div>
            <div className="text-right">Actions</div>
        </div>
    );
}
 
export default ChurchAttendanceHeader;
