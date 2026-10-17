/**
 * Ride to church — DTOs mirror the backend's `/rides` responses (snake_case,
 * see Backend src/modules/rides/rideService.ts). Members share an AREA they
 * set off from and the public landmarks (pickup points) they pass, never a
 * home address; phone and car details only come back once a request is
 * accepted.
 */

/** A public landmark a rider is picked up at. */
export interface RidePoint {
  id: number;
  name: string;
  /** The district under the landmark's name, e.g. "Spintex Road". */
  area_label: string;
}

export interface RidePickupPoint extends RidePoint {
  /** Rides with a free seat passing this point this Sunday. */
  open_rides: number;
}

export interface RideAreaRouteStop {
  pickup_point_id: number;
  /** Typical minutes from setting off. */
  minutes: number;
}

/** A neighbourhood a driver sets off from, with the landmarks it usually passes. */
export interface RideArea {
  id: number;
  name: string;
  route: RideAreaRouteStop[];
}

export interface RideCatalog {
  service_date: string;
  service_label: string;
  /** 24h "HH:MM" departure choices. */
  depart_times: string[];
  min_seats: number;
  max_seats: number;
  decline_reasons: string[];
  report_reasons: string[];
  areas: RideArea[];
  pickup_points: RidePickupPoint[];
  recent_pickup_point_id: number | null;
  alert_pickup_point_ids: number[];
  /** The member's previous offer, to prefill the form. */
  last_offer: {
    area_id: number;
    car_details: string | null;
    seats_total: number;
    depart_time: string;
  } | null;
}

export interface RideStop extends RidePoint {
  pickup_time: string;
}

export interface RideMember {
  id: number;
  first_name: string;
  initials: string;
}

export interface RideAreaRef {
  id: number;
  name: string;
}

/** The driver's own published ride. */
export interface DriverRide {
  id: number;
  service_date: string;
  area: RideAreaRef;
  depart_time: string;
  reminder_time: string;
  seats_total: number;
  seats_left: number;
  car_details: string | null;
  stops: RideStop[];
  route: string[];
  pending_requests: Array<{
    id: number;
    passenger: RideMember;
    pickup_point: RidePoint;
    pickup_time: string;
    requested_at: string;
  }>;
  /** Accepted passengers — their phone unlocks once the driver accepts. */
  passengers: Array<
    RideMember & {
      request_id: number;
      name: string;
      phone: string | null;
      pickup_point: RidePoint;
      pickup_time: string;
    }
  >;
  declined: Array<{
    request_id: number;
    id: number;
    first_name: string;
    reason: string | null;
    message: string | null;
  }>;
}

export type PassengerRequestStatus = "PENDING" | "ACCEPTED" | "DECLINED";

/** The passenger's seat request and the ride it is on. */
export interface PassengerRide {
  id: number;
  status: PassengerRequestStatus;
  cancelled_by_driver: boolean;
  pickup_point: RidePoint;
  pickup_time: string;
  decline_reason: string | null;
  decline_message: string | null;
  reminder_time: string;
  ride: {
    id: number;
    service_date: string;
    area: RideAreaRef;
    depart_time: string;
    seats_total: number;
    seats_left: number;
    other_passengers: number;
    route: string[];
    driver: RideMember & {
      name: string;
      /** Null until the driver accepts. */
      phone: string | null;
      car_details: string | null;
    };
  };
}

export type RideRole = "driver" | "passenger" | null;

export interface MyRide {
  service_date: string;
  service_label: string;
  role: RideRole;
  offer: DriverRide | null;
  request: PassengerRide | null;
}

export interface RideSearchResult {
  service_date: string;
  pickup_point: RidePoint;
  alert_on: boolean;
  /** The member already drives or holds a seat this Sunday. */
  busy: boolean;
  /** Rides past this point with no seat left — hidden, only counted. */
  full_count: number;
  rides: Array<{
    id: number;
    driver: RideMember;
    area: RideAreaRef;
    depart_time: string;
    seats_left: number;
    pickup_time: string;
    route: string[];
    my_request_status: string | null;
  }>;
}

export interface PublishRideDto {
  area_id: number;
  depart_time: string;
  seats: number;
  pickup_point_ids: number[];
  car_details?: string;
}

export interface RequestSeatDto {
  ride_offer_id: number;
  pickup_point_id: number;
}

export interface DeclineRequestDto {
  reason?: string;
  message?: string;
}

export interface RideAlertDto {
  pickup_point_id: number;
  enabled: boolean;
}

export interface RideReportDto {
  ride_offer_id: number;
  reason: string;
  details?: string;
  block?: boolean;
  /** Drivers name which passenger they are reporting. */
  reported_user_id?: number;
}

/* ------------------------------------------------------------------ */
/* Safety team / church office                                         */
/* ------------------------------------------------------------------ */

export interface RidePerson {
  id: number;
  name: string;
  phone: string | null;
}

export type RideOfferStatus = "ACTIVE" | "CANCELLED";
export type RideRequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "WITHDRAWN"
  | "CANCELLED";

export interface AdminRideRequest {
  id: number;
  status: RideRequestStatus;
  passenger: RidePerson;
  pickup_point: RidePoint;
  pickup_time: string;
  decline_reason: string | null;
  decline_message: string | null;
  requested_at: string;
}

export interface AdminRideOffer {
  id: number;
  status: RideOfferStatus;
  area: RideAreaRef;
  depart_time: string;
  seats_total: number;
  seats_left: number;
  car_details: string | null;
  cancelled_at: string | null;
  created_at: string;
  driver: RidePerson;
  stops: RideStop[];
  route: string[];
  requests: AdminRideRequest[];
}

export interface AdminRideOverview {
  service_date: string;
  current_service_date: string;
  service_label: string;
  /** The current service date plus recent dates that had rides, newest first. */
  service_dates: string[];
  stats: {
    rides: number;
    cancelled_rides: number;
    seats_offered: number;
    seats_filled: number;
    pending_requests: number;
    declined_requests: number;
    open_reports: number;
  };
  offers: AdminRideOffer[];
}

export type RideReportStatus = "OPEN" | "RESOLVED";

export interface RideReport {
  id: number;
  reason: string;
  details: string | null;
  blocked: boolean;
  status: RideReportStatus;
  resolution_note: string | null;
  resolved_at: string | null;
  created_at: string;
  reporter: RidePerson;
  reported_user: RidePerson | null;
  resolver: { id: number; name: string } | null;
  offer: {
    id: number;
    service_date: string;
    depart_time: string;
    area: string;
  } | null;
}

export interface RideBlock {
  id: number;
  created_at: string;
  blocker: { id: number; name: string };
  blocked: { id: number; name: string };
}

export interface AdminRidePickupPoint {
  id: number;
  name: string;
  area_label: string;
  sort_order: number;
  is_active: boolean;
}

export interface AdminRideArea {
  id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
  route: Array<{
    pickup_point_id: number;
    position: number;
    minutes_from_start: number;
  }>;
}

export interface AdminRideCatalog {
  areas: AdminRideArea[];
  pickup_points: AdminRidePickupPoint[];
}

export interface SaveRidePickupPointDto {
  name?: string;
  area_label?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface SaveRideAreaDto {
  name?: string;
  sort_order?: number;
  is_active?: boolean;
  /** Replaces the area's suggested route, in order. */
  route?: RideAreaRouteStop[];
}
