import { Navigate } from "react-router-dom";
import { RideSkeleton } from "./components/rideUi";
import { useRidesContext } from "./hooks/useRidesContext";
import { ridePaths, withEvent } from "./utils/rideHelpers";

/** /member/rides — opens My ride when the member drives or rides to any
 *  upcoming event (the layout has already selected that event), otherwise
 *  Find a ride for the soonest event. */
const RidesHubPage = () => {
  const { event, myEventIds, myRide, myRideLoading } = useRidesContext();

  if (myRideLoading && !myRide) {
    return (
      <div className="mx-auto max-w-[1120px]">
        <RideSkeleton rows={3} />
      </div>
    );
  }

  if (myRide?.role) {
    return <Navigate to={withEvent(ridePaths.mine, event?.id)} replace />;
  }
  if (myEventIds.length) {
    return <Navigate to={withEvent(ridePaths.mine, myEventIds[0])} replace />;
  }
  return <Navigate to={withEvent(ridePaths.find, event?.id)} replace />;
};

export default RidesHubPage;
