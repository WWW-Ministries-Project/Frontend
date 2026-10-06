import { useCallback, useEffect, useState } from "react";
import { api } from "@/utils/api/apiCalls";
import type { CommunityBlock } from "@/utils/api/community/interfaces";

interface BlockedMembersPanelProps {
  /** Bumped by the page after a new block so the list reloads. */
  refreshKey: number;
  onUnblocked: () => void;
}

export const BlockedMembersPanel = ({
  refreshKey,
  onUnblocked,
}: BlockedMembersPanelProps) => {
  const [blocks, setBlocks] = useState<CommunityBlock[]>([]);

  const load = useCallback(async () => {
    try {
      const response = await api.fetch.fetchCommunityBlocks();
      setBlocks(Array.isArray(response.data) ? response.data : []);
    } catch {
      setBlocks([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (!blocks.length) return null;

  const unblock = async (block: CommunityBlock) => {
    try {
      await api.delete.deleteCommunityBlock(block.id);
      setBlocks((current) => current.filter((item) => item.id !== block.id));
      onUnblocked();
    } catch {
      // ApiErrorHandler has already shown the error.
    }
  };

  return (
    <section className="rounded-2xl border border-lightGray bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-primary">Blocked</h2>
      <ul className="flex flex-col gap-2">
        {blocks.map((block) => (
          <li key={block.id} className="flex items-center justify-between gap-3">
            <span className="truncate text-sm text-primary">
              {block.name ?? "An anonymous author"}
            </span>
            <button
              type="button"
              onClick={() => unblock(block)}
              className="flex-none text-xs font-semibold text-amber-700 hover:underline"
            >
              Unblock
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};
