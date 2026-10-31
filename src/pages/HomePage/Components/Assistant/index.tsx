import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { useAssistantStore } from "@/store/assistantStore";
import { buildBranchQuery, useBranchStore } from "@/store/useBranchStore";
import { api, relativePath } from "@/utils";

import { AssistantDrawer } from "./AssistantDrawer";
import { AssistantLauncher } from "./AssistantLauncher";
import { AssistantNudge } from "./AssistantNudge";

/**
 * Admin Assistant: an animated AI-bot launcher that opens a right-side drawer
 * (For you / Updates / Ask), plus a proactive nudge when items are overdue.
 * Replaces the old AiChatbotWidget. Gated on AI view access, hidden on the AI
 * Console page.
 */
export const Assistant = () => {
  const { canView } = useAccessControl();
  const location = useLocation();
  const open = useAssistantStore((state) => state.open);
  const openTo = useAssistantStore((state) => state.openTo);
  const activeBranchId = useBranchStore((state) => state.activeBranchId);

  const [overdue, setOverdue] = useState(0);
  const [nudgesEnabled, setNudgesEnabled] = useState(true);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [nudgeReady, setNudgeReady] = useState(false);

  const canViewAi = canView("AI");
  const onAiConsole =
    location.pathname.startsWith(`${relativePath.home.main}/${relativePath.home.ai}`) ||
    location.pathname.includes("/settings/ai-console");
  const active = canViewAi && !onAiConsole;

  // Overdue count drives the launcher badge and the nudge; refreshes on branch
  // change and whenever the drawer closes (after the user acts on tasks).
  useEffect(() => {
    if (!active) return;
    let alive = true;
    api.fetch
      .fetchAiTasks(buildBranchQuery(activeBranchId))
      .then((res) => {
        if (alive) setOverdue(res.data?.summary?.overdue ?? 0);
      })
      .catch(() => {
        if (alive) setOverdue(0);
      });
    return () => {
      alive = false;
    };
  }, [active, activeBranchId, open]);

  // Reminder preferences gate the nudge.
  useEffect(() => {
    if (!active) return;
    let alive = true;
    api.fetch
      .fetchAiPreferences()
      .then((res) => {
        if (alive && res.data) setNudgesEnabled(res.data.nudges);
      })
      .catch(() => {
        /* default to enabled */
      });
    return () => {
      alive = false;
    };
  }, [active]);

  // Small delay before the nudge appears, mirroring the prototype.
  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => setNudgeReady(true), 1400);
    return () => window.clearTimeout(timer);
  }, [active]);

  if (!active) return null;

  const showNudge = !open && nudgeReady && nudgesEnabled && !nudgeDismissed && overdue > 0;

  return (
    <>
      <AssistantLauncher taskCount={overdue} hidden={open} onOpen={() => openTo("ask")} />
      {showNudge ? (
        <AssistantNudge
          overdue={overdue}
          onOpen={() => {
            setNudgeDismissed(true);
            openTo("tasks");
          }}
          onDismiss={() => setNudgeDismissed(true)}
        />
      ) : null}
      {open ? <AssistantDrawer /> : null}
    </>
  );
};
