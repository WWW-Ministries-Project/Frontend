import { useCallback, useEffect, useState } from "react";

import { notify } from "@/components/feedback";
import { Pill, UiButton } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { confirmAction, showLoader } from "@/pages/HomePage/utils/helperFunctions";
import { useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils/api/apiCalls";
import type { Branch, BranchDeleteImpact } from "@/utils/api/settings/branchInterfaces";

import { BranchDialog } from "../dialogs/BranchDialog";
import { CardsSkeleton, LoadFailed, SectionTitle } from "../generalUi";
import { useMemberOptions } from "../useMemberOptions";

/** Reloads the branch list into the shared store. */
const refreshBranches = async () => {
  const response = await api.fetch.fetchBranches();
  useBranchStore.getState().setBranches(response.data ?? []);
};

const Detail = ({ label, value, wide }: { label: string; value: string; wide?: boolean }) => (
  <div className={wide ? "col-span-full" : undefined}>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-sm text-primary">{value}</p>
  </div>
);

const LinkButton = ({ children, onClick, danger }: { children: string; onClick: () => void; danger?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    className={
      danger
        ? "ml-auto min-h-10 rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        : "min-h-10 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5"
    }
  >
    {children}
  </button>
);

export const BranchesSection = ({ canEdit, canDelete }: { canEdit: boolean; canDelete: boolean }) => {
  const branches = useBranchStore((state) => state.branches);
  const allowedIds = useBranchStore((state) => state.allowedBranchIds);
  // Admins limited to some branches can only change those (the API answers 403 otherwise).
  const mine = (branch: Branch) => !allowedIds || allowedIds.includes(branch.id);
  const { members } = useMemberOptions();
  const [status, setStatus] = useState<"loading" | "ready" | "error">(branches.length ? "ready" : "loading");
  const [dialog, setDialog] = useState<{ branch: Branch | null } | null>(null);

  const reload = useCallback(async () => {
    try {
      await refreshBranches();
      setStatus("ready");
    } catch {
      setStatus((current) => (current === "ready" ? current : "error"));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const makeDefault = async (branch: Branch) => {
    showLoader(true);
    try {
      await api.put.setDefaultBranch({ id: branch.id });
      await reload();
      notify.success({ title: "Default branch changed", message: `New sign-ups now land in ${branch.name}.` });
    } catch {
      // The API layer already raised a toast.
    } finally {
      showLoader(false);
    }
  };

  const remove = async (branch: Branch) => {
    showLoader(true);
    let impact: BranchDeleteImpact | undefined;
    try {
      impact = (await api.fetch.fetchBranchDeleteImpact({ id: String(branch.id) })).data;
    } catch {
      return;
    } finally {
      showLoader(false);
    }
    if (!impact) return;

    if (impact.is_default || branch.is_default) {
      confirmAction({
        title: `${branch.name} is the default branch`,
        message: "New members and records land here. Make another branch the default first.",
        confirmLabel: "Delete branch",
        cancelLabel: "Close",
        blocked: true,
        onConfirm: () => undefined,
      });
      return;
    }
    if (!impact.deletable || impact.blockers.length) {
      confirmAction({
        title: `${branch.name} can’t be deleted yet`,
        points: [...impact.blockers.map((blocker) => `It still has ${blocker.label}.`), "Move them to another branch, then delete it."],
        confirmLabel: "Delete branch",
        cancelLabel: "Close",
        blocked: true,
        onConfirm: () => undefined,
      });
      return;
    }
    confirmAction({
      title: `Delete ${branch.name}?`,
      message: "It has no members left and disappears from every branch picker. This can’t be undone.",
      confirmLabel: "Delete branch",
      cancelLabel: "Keep branch",
      tone: "danger",
      typeToConfirm: branch.name,
      onConfirm: async () => {
        await api.delete.deleteBranch({ id: String(branch.id) });
        notify.success({ title: "Branch deleted", message: branch.name });
        void reload();
      },
    });
  };

  return (
    <>
      <SectionTitle
        title="Branches"
        text="Every member and record belongs to a branch. New sign-ups land in the default one."
        action={
          canEdit ? (
            <UiButton tone="primary" onClick={() => setDialog({ branch: null })}>
              New branch
            </UiButton>
          ) : undefined
        }
      />
      {status === "loading" && !branches.length ? (
        <CardsSkeleton />
      ) : status === "error" && !branches.length ? (
        <LoadFailed what="branches" onRetry={() => void reload()} />
      ) : (
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr))]">
          {branches.map((branch) => (
            <div key={branch.id} className="flex flex-col gap-3 rounded-xl border border-lightGray bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 text-base font-semibold text-primary">{branch.name}</p>
                {branch.is_default && <Pill tone="info">Default</Pill>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Detail label="Location" value={branch.location || "—"} />
                <Detail
                  label="Members"
                  value={typeof branch.member_count === "number" ? branch.member_count.toLocaleString() : "—"}
                />
                <Detail label="Pastor in charge" value={branch.pastor_in_charge?.name || "—"} wide />
              </div>
              {(canEdit || canDelete) && mine(branch) && (
                <div className="flex flex-wrap gap-1 border-t border-gray-200 pt-3">
                  {canEdit && <LinkButton onClick={() => setDialog({ branch })}>Edit</LinkButton>}
                  {canEdit && !branch.is_default && (
                    <LinkButton onClick={() => void makeDefault(branch)}>Make default</LinkButton>
                  )}
                  {canDelete && (
                    <LinkButton danger onClick={() => void remove(branch)}>
                      Delete
                    </LinkButton>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <BranchDialog
        open={!!dialog}
        branch={dialog?.branch ?? null}
        people={members}
        onClose={() => setDialog(null)}
        onSaved={() => void reload()}
      />
    </>
  );
};
