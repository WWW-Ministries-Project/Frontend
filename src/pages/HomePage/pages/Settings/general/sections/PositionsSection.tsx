import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { notify } from "@/components/feedback";
import { UiButton } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { confirmAction } from "@/pages/HomePage/utils/helperFunctions";
import { ALL_BRANCHES, useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils/api/apiCalls";
import type { PositionType } from "@/utils/api/settings/positionInterfaces";

import { PositionDialog } from "../dialogs/PositionDialog";
import { Card, LoadFailed, RowsSkeleton, SectionTitle } from "../generalUi";

type OutletContext = { refetchPositions?: () => unknown } | undefined;

export const PositionsSection = () => {
  const { hasAction } = useAccessControl();
  const canCreate = hasAction("Positions.create");
  const canEdit = hasAction("Positions.edit");
  const canDelete = hasAction("Positions.delete");
  const outlet = useOutletContext<OutletContext>();
  const branches = useBranchStore((state) => state.branches);
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  const [positions, setPositions] = useState<PositionType[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [dialog, setDialog] = useState<{ position: PositionType | null } | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await api.fetch.fetchPositions();
      setPositions(response.data ?? []);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    setStatus("loading");
    void load();
  }, [load, activeBranchId]);

  const afterChange = () => {
    void load();
    // Keeps the shell's position store (used by other pages) in step.
    outlet?.refetchPositions?.();
  };

  const branchName = (id?: number | null) => branches.find((branch) => branch.id === id)?.name ?? "—";

  const defaultBranchId =
    activeBranchId !== ALL_BRANCHES
      ? activeBranchId
      : branches.find((branch) => branch.is_default)?.id ?? branches[0]?.id ?? null;

  const remove = (position: PositionType) =>
    confirmAction({
      title: `Delete ${position.name}?`,
      points: ["Approval steps and eligibility rules that use it will need a new position."],
      confirmLabel: "Delete position",
      cancelLabel: "Keep position",
      tone: "danger",
      onConfirm: async () => {
        await api.delete.deletePosition({ id: String(position.id) });
        notify.success({ title: "Position deleted", message: position.name });
        afterChange();
      },
    });

  return (
    <>
      <SectionTitle
        title="Positions"
        text="Titles people hold. Approval steps and eligibility rules can point to them."
        action={
          canCreate ? (
            <UiButton tone="primary" onClick={() => setDialog({ position: null })}>
              New position
            </UiButton>
          ) : undefined
        }
      />
      {status === "loading" ? (
        <RowsSkeleton rows={5} />
      ) : status === "error" ? (
        <LoadFailed what="positions" onRetry={() => void load()} />
      ) : !positions.length ? (
        <p className="rounded-xl border border-dashed border-lightGray bg-white p-6 text-center text-sm text-gray-600">
          No positions yet.{canCreate ? " Add the titles people hold, like Head Usher or Choir Director." : ""}
        </p>
      ) : (
        <Card>
          {positions.map((position) => (
            <div
              key={position.id}
              className="flex min-h-16 flex-wrap items-center gap-x-4 gap-y-1 border-b border-gray-200 px-4 py-3 last:border-b-0 hover:bg-lightGray/20"
            >
              <div className="flex min-w-0 flex-[1_1_220px] flex-col">
                <span className="text-sm font-medium text-primary">{position.name}</span>
                <span className="text-xs text-gray-500">{position.description || "—"}</span>
              </div>
              <span className="flex-[0_0_140px] text-sm text-gray-600">{branchName(position.branch_id)}</span>
              {(canEdit || canDelete) && (
                <div className="flex gap-1">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setDialog({ position })}
                      className="min-h-10 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5"
                    >
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => remove(position)}
                      className="min-h-10 rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
      <PositionDialog
        open={!!dialog}
        position={dialog?.position ?? null}
        branches={branches}
        defaultBranchId={defaultBranchId}
        onClose={() => setDialog(null)}
        onSaved={afterChange}
      />
    </>
  );
};
