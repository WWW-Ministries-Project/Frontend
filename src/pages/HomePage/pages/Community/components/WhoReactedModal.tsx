import { useEffect, useMemo, useState } from "react";
import { api } from "@/utils/api/apiCalls";
import { cn } from "@/utils/cn";
import type {
  CommunityReactionType,
  CommunityReactor,
} from "@/utils/api/community/interfaces";
import { REACTIONS, REACTION_BY_TYPE } from "../utils/communityConstants";
import { CommunityAvatar } from "./CommunityAvatar";
import { CommunitySheet } from "./CommunitySheet";

export interface WhoReactedTarget {
  kind: "post" | "comment";
  id: number;
  /** Prayer posts title the sheet "People praying" and open on that tab. */
  isPrayer?: boolean;
}

interface WhoReactedModalProps {
  target: WhoReactedTarget | null;
  onClose: () => void;
}

export const WhoReactedModal = ({ target, onClose }: WhoReactedModalProps) => {
  const [reactors, setReactors] = useState<CommunityReactor[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<CommunityReactionType | "ALL">("ALL");

  useEffect(() => {
    if (!target) return;
    let cancelled = false;
    setReactors([]);
    setFailed(false);
    setLoading(true);
    setTab(target.isPrayer ? "PRAY" : "ALL");

    const request =
      target.kind === "post"
        ? api.fetch.fetchCommunityPostReactions(target.id)
        : api.fetch.fetchCommunityCommentReactions(target.id);

    request
      .then((response) => {
        if (!cancelled) {
          setReactors(Array.isArray(response.data) ? response.data : []);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [target]);

  const tabs = useMemo(() => {
    const present = REACTIONS.filter((reaction) =>
      reactors.some((reactor) => reactor.type === reaction.type)
    );
    return [
      { id: "ALL" as const, label: `All · ${reactors.length}` },
      ...present.map((reaction) => ({
        id: reaction.type,
        label: `${reaction.emoji} ${
          reactors.filter((reactor) => reactor.type === reaction.type).length
        }`,
      })),
    ];
  }, [reactors]);

  const visible =
    tab === "ALL" ? reactors : reactors.filter((reactor) => reactor.type === tab);

  const title =
    target?.kind === "post" && target.isPrayer
      ? "People praying"
      : "People who reacted";

  return (
    <CommunitySheet open={Boolean(target)} onClose={onClose} title={title}>
      {tabs.length > 2 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                tab === item.id
                  ? "border-amber-300 bg-amber-50 font-semibold text-amber-800"
                  : "border-lightGray bg-white text-primaryGray hover:bg-lightGray/40"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      {loading ? (
        <p className="py-6 text-center text-sm text-primaryGray">Loading…</p>
      ) : failed ? (
        <p className="py-6 text-center text-sm text-error">
          Could not load reactions. Please try again.
        </p>
      ) : visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-primaryGray">
          No reactions yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((reactor) => (
            <li
              key={`${reactor.type}-${reactor.user.id}`}
              className="flex items-center gap-3"
            >
              <CommunityAvatar person={reactor.user} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-primary">
                  {reactor.user.name}
                </p>
                {reactor.user.department ? (
                  <p className="truncate text-xs text-primaryGray">
                    {reactor.user.department}
                  </p>
                ) : null}
              </div>
              <span aria-label={REACTION_BY_TYPE[reactor.type]?.label}>
                {REACTION_BY_TYPE[reactor.type]?.emoji}
              </span>
            </li>
          ))}
        </ul>
      )}
    </CommunitySheet>
  );
};
