import { Outlet } from "react-router-dom";
import { MembersOnlyNotice } from "./components/MembersOnlyNotice";
import { isGuestViewer } from "./utils/rideHelpers";

/** Shell for every member Ride to church route. Guests get the members-only
 *  notice; signed-in non-members get it from each page when the backend
 *  answers 401 "for church members only". */
const RidesLayout = () => {
  if (isGuestViewer()) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
        <MembersOnlyNotice />
      </div>
    );
  }

  return <Outlet />;
};

export default RidesLayout;
