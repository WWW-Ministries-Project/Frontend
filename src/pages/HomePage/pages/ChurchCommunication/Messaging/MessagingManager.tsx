import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components";
import { HeaderControls } from "@/components/HeaderControls";
import { useRouteAccess } from "@/context/RouteAccessContext";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils/api/apiCalls";
import PageOutline from "../../../Components/PageOutline";
import TabSelection from "../../../Components/reusable/TabSelection";
import { BirthdayTab } from "./components/BirthdayTab";
import { GeneralTab } from "./components/GeneralTab";
import { MessagingSettingsModal } from "./components/MessagingSettingsModal";
import { WelcomeTab } from "./components/WelcomeTab";

type MessagingTab = "Welcome messages" | "Birthday messages" | "General messages";

const TABS: MessagingTab[] = ["Welcome messages", "Birthday messages", "General messages"];
const TAB_PARAM: Record<MessagingTab, string> = {
  "Welcome messages": "welcome",
  "Birthday messages": "birthday",
  "General messages": "general",
};

/** Communication > Messaging: automatic welcome and birthday templates and
 *  church-wide messages over SMS, email and in-app. */
const MessagingManager = () => {
  const { canManageCurrentRoute } = useRouteAccess();
  const [searchParams, setSearchParams] = useSearchParams();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dirtyKeys = useRef(new Set<string>());

  const { data: templatesData, refetch: refetchTemplates } = useFetch(api.fetch.fetchMessageTemplates);
  const { data: settingsData, refetch: refetchSettings } = useFetch(api.fetch.fetchMessagingSettings);
  const { data: statsData, refetch: refetchStats } = useFetch(api.fetch.fetchMessagingStats, { days: 30 });

  const templates = templatesData?.data ?? [];
  const settings = settingsData?.data ?? null;
  const stats = statsData?.data ?? null;

  const activeTab: MessagingTab =
    TABS.find((tab) => TAB_PARAM[tab] === searchParams.get("tab")) ?? "Welcome messages";

  const onDirtyChange = useCallback((key: string, dirty: boolean) => {
    if (dirty) dirtyKeys.current.add(key);
    else dirtyKeys.current.delete(key);
  }, []);

  // Warn before leaving the page with unsaved template edits.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyKeys.current.size) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const selectTab = (tab: MessagingTab) => {
    if (tab === activeTab) return;
    if (dirtyKeys.current.size && !window.confirm("You have unsaved changes. Leave this tab without saving?")) return;
    dirtyKeys.current.clear();
    const next = new URLSearchParams(searchParams);
    next.set("tab", TAB_PARAM[tab]);
    setSearchParams(next, { replace: true });
  };

  const onTemplateSaved = () => {
    refetchTemplates();
    refetchStats();
  };

  const templateProps = {
    settings,
    stats,
    canManage: canManageCurrentRoute,
    onOpenSettings: () => setSettingsOpen(true),
    onDirtyChange,
    onSaved: onTemplateSaved,
  };

  return (
    <PageOutline>
      <HeaderControls
        title="Messaging"
        subtitle="Welcome and birthday messages sent automatically, and messages to the church, departments or people"
        customIcon={<Button value="Settings" variant="secondary" onClick={() => setSettingsOpen(true)} />}
      />

      <div className="mb-6">
        <TabSelection tabs={TABS} selectedTab={activeTab} onTabSelect={selectTab} />
      </div>

      {activeTab === "Welcome messages" ? (
        <WelcomeTab {...templateProps} templates={templates} />
      ) : activeTab === "Birthday messages" ? (
        <BirthdayTab {...templateProps} template={templates.find((t) => t.key === "BIRTHDAY")} />
      ) : (
        <GeneralTab canManage={canManageCurrentRoute} />
      )}

      <MessagingSettingsModal
        open={settingsOpen}
        settings={settings}
        canManage={canManageCurrentRoute}
        onClose={() => setSettingsOpen(false)}
        onSaved={refetchSettings}
      />
    </PageOutline>
  );
};

export default MessagingManager;
