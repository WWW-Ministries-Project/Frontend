export type EventResponseType = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  location: string;
  description: string;
  event_status: string | null;
  poster: string;
  qr_code: string;
  event_type: "ACTIVITY" | "PROGRAM" | "SERVICE" | "other";
  start_time: string; // Format: "HH:mm"
  end_time: string; // Format: "HH:mm"
  //   event_attendance: [];
};

export type EventType = {
  id: string,
  event_name: string,
  event_type: string,
  event_description: string
}
