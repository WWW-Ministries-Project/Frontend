import { useLocation } from "react-router-dom";

import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { useAssistantStore } from "@/store/assistantStore";
import { relativePath } from "@/utils";

import { AssistantDrawer } from "./AssistantDrawer";
import { AssistantLauncher } from "./AssistantLauncher";

/**
 * Admin Assistant: an animated AI-bot launcher that opens a right-side drawer
 * (For you / Updates / Ask). Replaces the old AiChatbotWidget. Gated on AI view
 * access and hidden on the AI Console page.
 */
export const Assistant = () => {
  const { canView } = useAccessControl();
  const location = useLocation();
  const open = useAssistantStore((state) => state.open);
  const openTo = useAssistantStore((state) => state.openTo);

  const canViewAi = canView("AI");
  const onAiConsole = location.pathname.startsWith(
    `${relativePath.home.main}/${relativePath.home.ai}`
  );

  if (!canViewAi || onAiConsole) return null;

  return (
    <>
      <AssistantLauncher taskCount={0} hidden={open} onOpen={() => openTo("ask")} />
      {open ? <AssistantDrawer /> : null}
    </>
  );
};
