import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface NavHistoryEntry {
  /** React Router `location.key`; stable for a history entry across reloads. */
  key: string;
  path: string;
}

type NavigationType = "POP" | "PUSH" | "REPLACE";

interface NavHistoryState {
  /** In-app history up to and including the current entry. */
  entries: NavHistoryEntry[];
  record: (entry: NavHistoryEntry, type: NavigationType) => void;
}

const MAX_ENTRIES = 50;

/**
 * Mirrors the browser history stack for this tab so a page can tell which
 * in-app page the user came from. Persisted in `sessionStorage` so it survives
 * a reload, like the browser history it shadows.
 */
export const useNavHistoryStore = create<NavHistoryState>()(
  persist(
    (set) => ({
      entries: [],
      record: (entry, type) =>
        set(({ entries }) => {
          const last = entries[entries.length - 1];
          if (last?.key === entry.key) return { entries };

          if (type === "REPLACE") {
            return { entries: [...entries.slice(0, -1), entry] };
          }
          if (type === "POP") {
            // Back (or a reload): the entry is already on the stack, so drop
            // what came after it. Forward lands on an entry we dropped, so it
            // is pushed again like a normal visit.
            const index = entries.findIndex((item) => item.key === entry.key);
            if (index >= 0) return { entries: entries.slice(0, index + 1) };
          }
          return { entries: [...entries, entry].slice(-MAX_ENTRIES) };
        }),
    }),
    {
      name: "nav-history",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
