import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HeaderControls } from "@/components/HeaderControls";
import { Modal } from "@/components/Modal";
import { useRouteAccess } from "@/context/RouteAccessContext";
import PageOutline from "../../Components/PageOutline";
import TabSelection from "../../Components/reusable/TabSelection";
import ChurchMessageForm from "./Components/ChurchMessageForm";
import { CommunityAdminPosts } from "./Components/CommunityAdminPosts";
import { CommunityAuditLog } from "./Components/CommunityAuditLog";
import { CommunityReportsQueue } from "./Components/CommunityReportsQueue";

type CommunityTab = "Posts" | "Reported" | "Audit log";

const TAB_PARAM: Record<CommunityTab, string> = {
  Posts: "posts",
  Reported: "reported",
  "Audit log": "audit-log",
};

/** Admin side of Community: every post, the moderation queue and, for
 *  managers, the audit log. Church-wide messages are important `MESSAGE`
 *  posts. */
const CommunityManager = () => {
  const { canManageCurrentRoute } = useRouteAccess();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs: CommunityTab[] = canManageCurrentRoute
    ? ["Posts", "Reported", "Audit log"]
    : ["Posts", "Reported"];
  const requested = tabs.find(
    (tab) => TAB_PARAM[tab] === searchParams.get("tab")
  );
  const activeTab: CommunityTab = requested ?? "Posts";

  const selectTab = (tab: CommunityTab) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", TAB_PARAM[tab]);
    setSearchParams(next, { replace: true });
  };

  return (
    <PageOutline>
      <HeaderControls
        title="Community"
        subtitle="Members' prayer requests, testimonies and discussions, important church messages and reported content"
        btnName="New church message"
        screenWidth={window.innerWidth}
        handleClick={() => setIsFormOpen(true)}
      />

      <div className="mb-6">
        <TabSelection
          tabs={tabs}
          selectedTab={activeTab}
          onTabSelect={selectTab}
        />
      </div>

      {activeTab === "Posts" ? (
        <CommunityAdminPosts
          canManage={canManageCurrentRoute}
          refreshKey={refreshKey}
        />
      ) : activeTab === "Reported" ? (
        <CommunityReportsQueue canManage={canManageCurrentRoute} />
      ) : (
        <CommunityAuditLog />
      )}

      <Modal open={isFormOpen} onClose={() => setIsFormOpen(false)}>
        <ChurchMessageForm
          onClose={() => setIsFormOpen(false)}
          onSaved={() => setRefreshKey((value) => value + 1)}
        />
      </Modal>
    </PageOutline>
  );
};

export default CommunityManager;
