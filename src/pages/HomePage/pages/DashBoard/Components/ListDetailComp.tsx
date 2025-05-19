import { Badge } from "@/components/Badge";
import { formatDate } from "@/utils/helperFunctions";
import { ComponentType, SVGProps } from "react";

interface IProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  startDate?: Date;
  startTime?: string;
  eventType?: string;
  mode?: React.ReactNode;
}

export const ListDetailComp = ({
  icon: Icon,
  title,
  startDate,
  startTime,
  eventType,
  mode,
}: IProps) => {
  // console.log(icon);
  return (
    <div className="flex justify-between items-center ">
      <div className="flex gap-2 items-center">
        <div className="  p-1 w-5 h-5 rounded-full bg-primary/20">
          <Icon />
        </div>
        <div>
          <div className="font-bold ">{title}</div>
          <div className="flex text-sm gap-2 ">
            {startDate && (
              <p className="font-medium">
                {formatDate(startDate ? startDate.toString() : "")} •{" "}
                {startTime}
              </p>
            )}
            {eventType && (
              <Badge>
                <p className="capitalize">{eventType.toLowerCase()}</p>
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div>{mode && <p className="text-sm">{mode}</p>}</div>
    </div>
  );
};
