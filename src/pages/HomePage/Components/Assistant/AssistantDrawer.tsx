import { useEffect } from "react";

import { useAuth } from "@/context/AuthWrapper";
import { useAssistantStore, type AssistantTab } from "@/store/assistantStore";
import { ALL_BRANCHES, useBranchStore } from "@/store/useBranchStore";
import { useInAppNotificationStore } from "@/store/useInAppNotificationStore";
import { cn } from "@/utils/cn";

import { AskTab } from "./tabs/AskTab";
import { ForYouTab } from "./tabs/ForYouTab";
import { UpdatesTab } from "./tabs/UpdatesTab";
import { SettingsView } from "./SettingsView";

const DATE_LABEL = new Date().toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });

export const AssistantDrawer = () => {
  const { tab, view, setTab, setView, close } = useAssistantStore();
  const tasksCount = useAssistantStore((state) => state.tasksCount);
  const { user } = useAuth();
  const unreadCount = useInAppNotificationStore((state) => state.unreadCount);
  const branches = useBranchStore((state) => state.branches);
  const activeBranchId = useBranchStore((state) => state.activeBranchId);

  const branchName =
    activeBranchId === ALL_BRANCHES
      ? "All branches"
      : branches.find((branch) => branch.id === activeBranchId)?.name ||
        user?.branch_name ||
        "Your branch";

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const tabs: { key: AssistantTab; label: string; count: number }[] = [
    { key: "tasks", label: "For you", count: tasksCount },
    { key: "updates", label: "Updates", count: unreadCount },
    { key: "ask", label: "Ask", count: 0 },
  ];

  const isMain = view === "main";

  return (
    <aside
      role="complementary"
      aria-label="Assistant"
      className="fixed bottom-3 right-3 top-3 z-[150] flex w-[440px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-[#D8DAE5] bg-white shadow-[0_20px_45px_-20px_rgba(8,13,45,0.45)]"
    >
      <header className="flex-shrink-0 bg-[#080D2D] px-6 pt-5 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
              <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
            </svg>
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <h2 className="text-base font-semibold leading-6">Assistant</h2>
            <p className="truncate text-xs text-white/80">
              {branchName} · {DATE_LABEL}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setView(view === "settings" ? "main" : "settings")}
            aria-label="Reminder settings"
            title="Reminder settings"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-white/10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" />
              <circle cx="15" cy="6" r="2" />
              <circle cx="9" cy="12" r="2" />
              <circle cx="17" cy="18" r="2" />
            </svg>
          </button>
          <button
            type="button"
            onClick={close}
            aria-label="Close assistant"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-white/10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div role="tablist" aria-label="Assistant views" className="mt-4 flex gap-1">
          {tabs.map((entry) => {
            const on = isMain && tab === entry.key;
            return (
              <button
                key={entry.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(entry.key)}
                className={cn(
                  "flex items-center gap-2 rounded-t-lg px-3.5 py-2.5 text-sm",
                  on ? "bg-white font-semibold text-[#080D2D]" : "font-normal text-white/80 hover:text-white"
                )}
              >
                <span>{entry.label}</span>
                {entry.count > 0 ? (
                  <span
                    className={cn(
                      "min-w-[20px] rounded-full px-1.5 text-center text-xs font-semibold leading-5",
                      on ? "bg-[#080D2D] text-white" : "bg-white/20 text-white"
                    )}
                  >
                    {entry.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </header>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          isMain && tab === "ask" ? "overflow-hidden" : "overflow-y-auto"
        )}
      >
        {!isMain ? (
          <SettingsView />
        ) : tab === "tasks" ? (
          <ForYouTab greetingName={(user?.name || "there").split(" ")[0]} />
        ) : tab === "updates" ? (
          <UpdatesTab />
        ) : (
          <AskTab />
        )}
      </div>
    </aside>
  );
};
