import { ArrowRightIcon } from "@heroicons/react/24/outline";
import type { ColumnDef } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import EmptyState from "@/components/EmptyState";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { showConfirmDialog, showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import type { RideBlock } from "@/utils/api/rides/interfaces";
import {
  PanelError,
  PanelSkeleton,
  dangerButtonClass,
  formatWhen,
} from "./AdminRideShared";

/** Member-to-member ride blocks, which the safety team can lift. */
export const RideBlocksPanel = () => {
  const [blocks, setBlocks] = useState<RideBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
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

  const lift = useCallback(
    async (block: RideBlock) => {
      setBusyId(block.id);
      try {
        await api.delete.removeRideBlock(block.id);
        showNotification("Block lifted", "success");
        setBlocks((current) => current.filter((row) => row.id !== block.id));
      } catch {
        // ApiErrorHandler has already shown the error.
      } finally {
        setBusyId(null);
      }
    },
    []
  );

  const columns = useMemo<ColumnDef<RideBlock>[]>(
    () => [
      {
        id: "blocker",
        header: "Blocked by",
        cell: ({ row }) => (
          <span className="font-medium text-primary">
            {row.original.blocker.name}
          </span>
        ),
      },
      {
        id: "arrow",
        header: () => <span className="sr-only">blocked</span>,
        cell: () => (
          <ArrowRightIcon
            className="h-4 w-4 text-primaryGray"
            aria-label="blocked"
          />
        ),
        size: 48,
      },
      {
        id: "blocked",
        header: "Blocked member",
        cell: ({ row }) => (
          <span className="font-medium text-primary">
            {row.original.blocked.name}
          </span>
        ),
      },
      {
        id: "created_at",
        header: "Since",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-primaryGray">
            {formatWhen(row.original.created_at)}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const block = row.original;
          return (
            <div className="flex justify-end">
              <button
                type="button"
                className={dangerButtonClass}
                disabled={busyId === block.id}
                onClick={() =>
                  showConfirmDialog(
                    "Lift this block?",
                    () => {
                      void lift(block);
                    },
                    {
                      message: `${block.blocker.name} and ${block.blocked.name} will be able to see and request each other's rides again. Neither of them is notified.`,
                      confirmLabel: "Lift block",
                    }
                  )
                }
              >
                Lift block
              </button>
            </div>
          );
        },
      },
    ],
    [busyId, lift]
  );

  return (
    <section className="flex flex-col gap-4">
      <p className="text-sm text-primaryGray">
        A member can block someone when they report a ride. Until the block is
        lifted, neither member sees the other&apos;s rides. Lift a block once
        the safety team has resolved the concern.
      </p>

      {failed ? (
        <PanelError
          message="Failed to load ride blocks. Please try again."
          onRetry={load}
        />
      ) : loading && !blocks.length ? (
        <PanelSkeleton rows={3} rowClassName="h-14" />
      ) : blocks.length === 0 ? (
        <EmptyState
          scope="section"
          msg="No blocks"
          description="No member has blocked another from their rides."
        />
      ) : (
        <TableComponent
          columns={columns}
          data={blocks}
          displayedCount={Math.max(blocks.length, 1)}
          showNumberColumn={false}
          rowClass="cursor-default"
          headClass="text-xs uppercase tracking-wide"
          className="min-w-0"
        />
      )}
    </section>
  );
};
