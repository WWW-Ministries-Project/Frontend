import { useOutletContext } from "react-router-dom";
import type {
  MyRide,
  RideCatalog,
  RideEvent,
} from "@/utils/api/rides/interfaces";

/** What `RidesLayout` shares with the Find / Offer / My ride tabs: the
 *  selected church event, and one copy of the member's ride and the catalog
 *  for it. */
export interface RidesContext {
  /** The event the tabs are about (`?event_id=`), once known. */
  event: RideEvent | null;
  /** Every event taking rides, soonest first. */
  events: RideEvent[];
  /** Events the member already drives or rides to. */
  myEventIds: number[];
  myRide: MyRide | null;
  myRideLoading: boolean;
  refreshMyRide: () => Promise<void>;
  /** Apply a fresh `MyRide` a mutation answered with. */
  applyMyRide: (next: MyRide | null | undefined) => void;
  catalog: RideCatalog | null;
  catalogLoading: boolean;
  refreshCatalog: () => Promise<void>;
}

export const useRidesContext = () => useOutletContext<RidesContext>();
