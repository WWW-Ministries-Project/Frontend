import { Outlet } from "react-router-dom";
import { CommunityInteractionsProvider } from "./components/CommunityInteractions";
import { MembersOnlyNotice } from "./components/MembersOnlyNotice";
import { isGuestViewer } from "./utils/communityHelpers";

/** Shell for every member Community route. Guests get the members-only
 *  notice; members share one interactions provider, so a toast (e.g. Undo
 *  after hiding a post from its detail page) survives navigation. */
const CommunityLayout = () => {
  if (isGuestViewer()) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
        <MembersOnlyNotice />
      </div>
    );
  }

  return (
    <CommunityInteractionsProvider>
      <Outlet />
    </CommunityInteractionsProvider>
  );
};

export default CommunityLayout;
