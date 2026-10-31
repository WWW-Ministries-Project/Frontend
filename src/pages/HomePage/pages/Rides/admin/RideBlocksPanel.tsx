import { useCallback, useEffect, useRef, useState } from "react";
import { notify } from "@/components/feedback";
import { confirmAction } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import type { RideBlock } from "@/utils/api/rides/interfaces";
import {
  LoadError,
  RideSkeleton,
} from "../components/rideUi";
import {
  btnSecondary,
} from "../components/rideClasses";
import { formatDay } from "./adminRideFormat";

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

/** Member-to-member ride blocks, which the safety team can lift. */
export const RideBlocksPanel = ({ canLift }: { canLift: boolean }) => {
  const [blocks, setBlocks] = useState<RideBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setFailed(false);
    try {
      const response = await api.fetch.fetchRideBlocks();
      if (requestId !== requestRef.current) return;
      setBlocks(Array.isArray(response.data) ? response.data : []);
    } catch {
      if (requestId === requestRef.current) setFailed(true);
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const lift = (block: RideBlock) =>
    confirmAction({
      title: "Lift this block?",
      message: `${block.blocked.name} will be able to see ${firstName(block.blocker.name)}’s rides again. Neither of them is told. Only do this once the safety team has resolved the concern.`,
      confirmLabel: "Lift block",
      cancelLabel: "Keep it",
      tone: "danger",
      onConfirm: async () => {
        await api.delete.removeRideBlock(block.id);
        setBlocks((current) => current.filter((row) => row.id !== block.id));
        notify.success({
          title: "Block lifted",
          message: `${block.blocker.name} and ${block.blocked.name} can share rides again.`,
        });
      },
    });

  return (
    <section className="flex flex-col gap-4">
      <p className="max-w-[640px] text-sm text-primaryGray">
        A member can block someone when they report a ride. Blocked members
        never see each other’s rides. Lift a block only after the concern is
        resolved.
      </p>

      {failed ? (
        <LoadError message="Couldn't load ride blocks." onRetry={load} />
      ) : loading && !blocks.length ? (
        <RideSkeleton rows={3} className="h-16" />
      ) : (
        <ul className="overflow-hidden rounded-xl border border-lightGray bg-white">
          {blocks.map((block) => (
            <li
              key={block.id}
              className="flex min-h-[64px] flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-200 px-4 py-3 transition-colors last:border-b-0 hover:bg-lightGray/20"
            >
              <div className="flex min-w-0 flex-[1_1_240px] flex-col">
                <span className="text-sm text-primary">
                  <strong className="font-semibold">{block.blocker.name}</strong>{" "}
                  blocked{" "}
                  <strong className="font-semibold">{block.blocked.name}</strong>
                </span>
                <span className="text-xs text-mainGray">
                  Since {formatDay(block.created_at)}
                </span>
              </div>
              {canLift ? (
                <button
                  type="button"
                  onClick={() => lift(block)}
                  className={btnSecondary}
                >
                  Lift block
                </button>
              ) : null}
            </li>
          ))}
          {blocks.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-mainGray">
              No blocks in place.
            </li>
          ) : null}
        </ul>
      )}
    </section>
  );
};
