import { Outlet, useLocation, useNavigate } from "react-router-dom";

import PageOutline from "@/pages/HomePage/Components/PageOutline";
import {
  PageHeading,
  PillTabs,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import {
  ManagerData,
  useManagerDataSource,
} from "@/pages/HomePage/pages/MembershipManagement/components/manager/useManagerData";
import { relativePath } from "@/utils/const";

const paths = relativePath.home.membership.management;

const TABS: { key: string; label: string; count: keyof ManagerData["counts"] }[] = [
  { key: paths.memberConfirmation, label: "Member confirmation", count: "confirm" },
  { key: paths.visitorToMembership, label: "Visitor-to-membership", count: "visitors" },
  { key: paths.soulwonToMembership, label: "Soulwon-to-membership", count: "souls" },
  { key: paths.guestToMembership, label: "Guest-to-membership", count: "guests" },
  { key: paths.joinRequests, label: "Join department requests", count: "joins" },
];

export const MembershipManagement = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const data = useManagerDataSource();

  const segments = pathname.split("/").filter(Boolean);
  const active =
    TABS.find((tab) => segments.includes(tab.key))?.key ?? paths.memberConfirmation;

  return (
    <PageOutline
      crumbs={[
        { label: "Home", link: "/home" },
        { label: "Membership", link: "/home/membership" },
        { label: "Membership manager" },
      ]}
    >
      <div className="flex flex-col gap-6">
        <PageHeading
          title="Membership Management"
          subtitle="Confirm members, convert visitors and soul-winning records into members, and decide requests from app guests."
        />
        <PillTabs
          ariaLabel="Membership management"
          value={active}
          onChange={(key) => navigate(key)}
          tabs={TABS.map((tab) => ({
            key: tab.key,
            label: tab.label,
            count: data.counts[tab.count],
          }))}
        />
        <Outlet context={data} />
      </div>
    </PageOutline>
  );
};

export default MembershipManagement;
