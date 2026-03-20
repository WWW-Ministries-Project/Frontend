import Action from "@/components/Action";
import { compareDates, formatDate } from "@/utils/helperFunctions";
import CardWrapper from "@/Wrappers/CardWrapper";
import { eventTypeColors } from "../utils/eventHelpers";
import { CalendarEvent } from "./calenda/utils/CalendaHelpers";
import calendar from "/src/assets/calendar.svg";
import location from "/src/assets/location.svg";
import defaultImage1 from "/src/assets/image.svg";
import Elipse from "/src/assets/ellipse.svg";

interface IProps {
  showOptions: boolean;
  event: CalendarEvent;
  indicatorClass?: string;
  onNavigate: (path: string) => void;
  onDelete: (event: CalendarEvent) => void;
  onShowOptions: (id: string | number) => void;
  readOnly?: boolean;
  onSelect?: (event: CalendarEvent) => void;
}

export const EventsCard = (props: IProps) => {
  const eventDate = new Date(props.event.start_date);
  const month = eventDate.toLocaleString("en-US", { month: "short" });
  const day = eventDate.getDate();

  const isPast = compareDates(props.event.start_date + "");
  const isReadOnly = Boolean(props.readOnly);
  const isClickable = Boolean(props.onSelect);
  const handleSelect = () => {
    props.onSelect?.(props.event);
  };

  return (
    <CardWrapper className="group rounded-xl overflow-hidden border border-lightGray bg-white hover:shadow-lg transition-shadow duration-200">
      {/* Poster */}
      <div
        className={`relative h-44 ${isClickable ? "cursor-pointer" : ""}`}
        onClick={isClickable ? handleSelect : undefined}
        // onClick={() =>
        //   props.onNavigate(
        //     `${relativePath.home.events.view}?event_id=${props.event.id}`
        //   )
        // }
      >
        <img
          src={props.event.poster || defaultImage1}
          alt="event poster"
          className="w-full h-full object-cover"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Date badge */}
        <div className="absolute top-3 left-3 bg-white rounded-lg shadow px-3 py-2 text-center">
          <p className="text-xs uppercase text-gray-500">{month}</p>
          <p className="text-lg font-bold">{day}</p>
        </div>

        {/* Options */}
        {!isReadOnly && (
          <div
            className="absolute top-3 right-3"
            onClick={(e) => {
              e.stopPropagation();
              props.onShowOptions(props.event.id);
            }}
          >
            <img src={Elipse} alt="options" className="cursor-pointer" />
            {props.showOptions && (
              <Action
                onDelete={() => props.onDelete(props.event)}
                // onView={() =>
                //   props.onNavigate(
                //     `${relativePath.home.events.view}?event_id=${props.event.id}`
                //   )
                // }
                onEdit={() =>
                  props.onNavigate(
                    `/home/manage-event?event_id=${props.event.id}`
                  )
                }
              />
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div
          className={`flex items-center gap-2 ${
            isClickable ? "cursor-pointer" : ""
          }`}
          onClick={isClickable ? handleSelect : undefined}
          // onClick={() =>
          //   props.onNavigate(
          //     `${relativePath.home.events.view}?event_id=${props.event.id}`
          //   )
          // }
        >
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isPast ? "bg-gray-400" : "bg-green-500"
            }`}
          />
          <h3 className="font-semibold text-gray-900 line-clamp-2">
            {props.event.event_name}
          </h3>
        </div>

        {/* Date & time */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <img src={calendar} alt="calendar" className="h-4 w-4" />
          <span>
            {formatDate(props.event.start_date + "") || "TBD"} •{" "}
            {props.event.start_time} – {props.event.end_time}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <img src={location} alt="location" className="h-4 w-4" />
          <span className="truncate">
            {props.event.location || "No location specified"}
          </span>
        </div>

        {/* Event type pill */}
        {props.event.event_type && (
          <span
            className="inline-block mt-2 text-xs font-medium px-3 py-1 rounded-full"
            style={{
              backgroundColor:
                eventTypeColors[props.event.event_type] + "20",
              color: eventTypeColors[props.event.event_type],
            }}
          >
            {props.event.event_type}
          </span>
        )}
      </div>
    </CardWrapper>
  );
};
