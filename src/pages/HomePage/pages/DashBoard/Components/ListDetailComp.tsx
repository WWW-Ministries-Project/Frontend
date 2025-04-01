import CalendarAssets from "@/assets/CalendarAsset";
import Badge from "@/components/Badge";
import { formatTime } from "@/utils/helperFunctions";

interface ListDetailCompProps {
    icon: React.ReactNode;
    title: string;
    startDate?: Date;
    startTime?: string;
    eventType?: string;
    mode?: React.ReactNode;
}

const ListDetailComp = ({icon, title, startDate, startTime, eventType, mode}: ListDetailCompProps) => {
    return ( 
        <div className="flex justify-between items-center ">
                    <div className="flex gap-2 items-center">
                        <div className="  p-1 rounded-full bg-primary/20">
                            {icon}
                        </div>
                        <div>
                            <div className="font-bold ">{title}</div>
                            <div className="flex text-sm gap-2 ">
                                <p className="font-medium">{formatTime(startDate ? startDate.toString() : "")} • {startTime}</p>
                                {eventType&&<Badge><p className="capitalize">{eventType.toLowerCase()}</p></Badge>}
                            </div>
                        </div>
                    </div>
                    <div>
                        {mode&&<p className="text-sm">{mode}</p>}
                    </div>
                </div>
     );
}
 
export default ListDetailComp;