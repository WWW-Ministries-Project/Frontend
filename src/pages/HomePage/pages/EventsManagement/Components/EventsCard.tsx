import Action from "@/components/Action";
import { compareDates, formatDate } from "@/utils/helperFunctions";
import CardWrapper from "@/Wrappers/CardWrapper";
import { eventTypeColors } from "../utils/eventHelpers";
import { eventType } from "../utils/eventInterfaces";
import calendar from "/src/assets/calendar.svg";
import Elipse from "/src/assets/ellipse.svg";
import defaultImage1 from "/src/assets/image.svg";
import location from "/src/assets/location.svg";

interface IProps {
  showOptions: boolean;
  event: eventType;
  indicatorClass?: string;
  onNavigate: (path: string) => void;
  onDelete: (event: eventType) => void;
  onShowOptions: (id: number) => void;
}

const EventsCard = (props: IProps) => {
  const handleNavigation = (path: string) => {
    props.onNavigate(path);
  };

  const handleShowOptions = (e: React.MouseEvent) => {
    e.stopPropagation();
    props.onShowOptions(props.event.id);
  };

  // Format the date dynamically
  const eventDate = new Date(props.event.start_date);
  const dayOfWeek = eventDate.toLocaleString("en-US", { weekday: "short" });
  const dayOfMonth = eventDate.getDate();

  return (
    <div
      className={`rounded-xl pb-1`}
      style={{
        backgroundColor: props.event.event_type
          ? eventTypeColors[props.event.event_type]
          : "#00000050",
      }}
    >
      <CardWrapper
        className={
          "text-gray gap-2 pb-2 flex flex-col rounded-xl relative border border-lightGray"
        }
      >
        <div
          className={`rounded-xl bg-[#00000050] border-b `}
          style={{
            borderColor: props.event.event_type
              ? eventTypeColors[props.event.event_type]
              : "#00000050",
          }}
        >
          <img
            className="max-w-[70vw] rounded-xl w-full h-44"
            src={props.event.poster || defaultImage1}
            alt="poster for event"
          />
        </div>

        <div
          className="flex px-3 gap-1 text-sm"
          onClick={() =>
            handleNavigation(
              `/home/events/view-event?event_id=${props.event.id}`
            )
          }
        >
          <div
            className={`border rounded-lg py-2 px-3 flex justify-center items-center flex-col ${
              compareDates(props.event.start_date + "")
                ? "bg-[#FF576510] border-[#FF576550]"
                : "bg-green/10 border-green/50"
            }`}
          >
            <div className="font-medium">{dayOfWeek}</div>
            <div className="font-bold text-lg">{dayOfMonth}</div>
          </div>
          <div className="space-y-1">
            <div
              className="flex px-3  items-center font-bold cursor-pointer"
              onClick={() =>
                handleNavigation(
                  `/home/events/view-event?event_id=${props.event.id}`
                )
              }
            >
              <div
                className={`${
                  compareDates(props.event.start_date + "")
                    ? "bg-[#FF5765]"
                    : "bg-green"
                } rounded-full ${props.indicatorClass} `}
              />
              <p className="text-md">{props.event.name}</p>
            </div>
            <div className="flex px-3 gap-1 items-center text-sm">
              <img src={calendar} alt="clock icon" />
              <p>
                {formatDate(props.event.start_date + "") || "TBD"} |
                <span className="text-sm">{props.event.start_time}</span>
                <span className="text-sm">- {props.event.end_time} </span>
              </p>
            </div>
            <div className="flex px-3 gap-1 text-sm">
              <img src={location} alt="location" />
              <p>{props.event.location || "-"}</p>
            </div>
          </div>
        </div>
        <div
          className={`absolute right-0 flex flex-col items-end m-4 rounded-md w-1/4 text-center`}
          onClick={handleShowOptions}
        >
          <img src={Elipse} alt="options" className="cursor-pointer" />
          {props.showOptions && (
            <Action
              onDelete={() => props.onDelete(props.event)}
              onView={() =>
                handleNavigation(
                  `/home/events/view-event?event_id=${props.event.id}`
                )
              }
              onEdit={() =>
                handleNavigation(
                  `/home/manage-event?event_id=${props.event.id}`
                )
              }
            />
          )}
        </div>
      </CardWrapper>
    </div>
  );
};

export default EventsCard;
