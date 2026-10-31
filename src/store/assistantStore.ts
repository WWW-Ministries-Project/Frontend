import { create } from "zustand";

import type { AiDisplay } from "@/utils/api/ai/interfaces";

export type AssistantTab = "tasks" | "updates" | "ask";
export type AssistantView = "main" | "settings";

export interface AssistantMessage {
  role: "user" | "ai";
  text: string;
  display?: AiDisplay;
  intent?: string;
}

export interface AssistantToast {
  text: string;
  undo?: () => void;
}

interface AssistantState {
  open: boolean;
  tab: AssistantTab;
  view: AssistantView;
  /** bumped whenever the drawer is asked to open, so children can react */
  signal: number;
  conversationId?: string;
  msgs: AssistantMessage[];
  draft: string;
  busy: boolean;
  toast: AssistantToast | null;

  openTo: (tab?: AssistantTab) => void;
  close: () => void;
  setTab: (tab: AssistantTab) => void;
  setView: (view: AssistantView) => void;
  setDraft: (draft: string) => void;
  pushMsg: (msg: AssistantMessage) => void;
  setBusy: (busy: boolean) => void;
  setConversationId: (id?: string) => void;
  setToast: (toast: AssistantToast | null) => void;
}

export const useAssistantStore = create<AssistantState>((set) => ({
  open: false,
  tab: "tasks",
  view: "main",
  signal: 0,
  conversationId: undefined,
  msgs: [],
  draft: "",
  busy: false,
  toast: null,

  openTo: (tab) =>
    set((state) => ({
      open: true,
      view: "main",
      tab: tab ?? state.tab,
      signal: state.signal + 1,
    })),
  close: () => set({ open: false }),
  setTab: (tab) => set({ tab, view: "main" }),
  setView: (view) => set({ view }),
  setDraft: (draft) => set({ draft }),
  pushMsg: (msg) => set((state) => ({ msgs: [...state.msgs, msg] })),
  setBusy: (busy) => set({ busy }),
  setConversationId: (conversationId) => set({ conversationId }),
  setToast: (toast) => set({ toast }),
}));
