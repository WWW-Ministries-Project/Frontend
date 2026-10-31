import { useEffect, useRef, useState } from "react";

import { Modal } from "@/components/Modal";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { showNotification } from "@/pages/HomePage/utils";
import { ALL_BRANCHES, useBranchStore } from "@/store/useBranchStore";
import { useStore } from "@/store/useStore";
import { api } from "@/utils";
import type { IMarket } from "@/utils/api/marketPlace/interface";
import { AddMarketForm } from "../forms/AddMarketForm";

export type MarketModalMode =
  | { kind: "create" }
  | { kind: "edit"; market: IMarket }
  | { kind: "duplicate"; market: IMarket };

interface IProps {
  mode: MarketModalMode | null;
  onClose: () => void;
  /** Called after a successful create / update / duplicate. */
  onSaved: () => void;
}

/** Create, edit or duplicate a market in the design-system modal. */
export function MarketFormModal({ mode, onClose, onSaved }: IProps) {
  const { events } = useStore();
  const { activeBranchId } = useBranchStore();

  const create = usePost(api.post.createMarket);
  const update = usePut(api.put.updateMarket);
  const duplicate = usePost(api.post.duplicateMarket);

  // Only surface API errors raised by a submit in the current session.
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => setSubmitted(false), [mode]);

  // Handle each response exactly once.
  const handled = useRef<unknown>(null);
  useEffect(() => {
    const done = create.data || update.data || duplicate.data;
    if (!done || handled.current === done) return;
    handled.current = done;
    if (duplicate.data) {
      showNotification(
        `Market duplicated with ${duplicate.data.data?.products_count ?? 0} product(s)`,
        "success"
      );
    } else {
      showNotification(
        update.data ? "Market updated" : "Market created",
        "success"
      );
    }
    onSaved();
    onClose();
  }, [create.data, update.data, duplicate.data, onSaved, onClose]);

  const editData: IMarket | null =
    mode?.kind === "edit"
      ? mode.market
      : mode?.kind === "duplicate"
        ? { ...mode.market, id: "", name: `${mode.market.name} (copy)` }
        : null;

  const handleSubmit = async (market: IMarket) => {
    const { id, event_id, event_name: _eventName, branch_id, ...rest } = market;
    if (activeBranchId === ALL_BRANCHES && !branch_id) {
      showNotification("Please select a branch", "error");
      return;
    }
    const branchPayload =
      branch_id !== "" && branch_id !== undefined
        ? { branch_id: Number(branch_id) }
        : {};
    setSubmitted(true);
    const base = { ...rest, ...branchPayload, event_id: Number(event_id) };

    if (mode?.kind === "edit" && id) {
      await update.updateData({ ...base, id }, { id });
    } else if (mode?.kind === "duplicate") {
      await duplicate.postData({
        ...base,
        source_market_id: mode.market.id,
      });
    } else {
      await create.postData(base);
    }
  };

  const loading = create.loading || update.loading || duplicate.loading;
  const serverError = submitted
    ? (create.error || update.error || duplicate.error)?.message
    : undefined;

  return (
    <Modal
      open={Boolean(mode)}
      onClose={onClose}
      title={mode?.kind === "edit" ? "Edit market" : "Create market"}
    >
      {mode && (
        <AddMarketForm
          key={mode.kind + (editData?.id || "")}
          onClose={onClose}
          editData={editData}
          onSubmit={handleSubmit}
          loading={loading}
          events={events}
          isDuplicate={mode.kind === "duplicate"}
          serverError={serverError}
        />
      )}
    </Modal>
  );
}
