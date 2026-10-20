import { useEffect, useState } from "react";

import type { AssetHistoryEntry, AssetRow } from "@/utils/api/assets/interfaces";
import { cn } from "@/utils/cn";

import type { CommDialogButton } from "../../ChurchCommunication/ui/commUi";
import { DrawerSection, RequisitionDrawerShell } from "../../Requisitions/components/requisitionUi";
import {
  REQ_STATUS,
  STATUS,
  ago,
  categoryLabel,
  daysSince,
  fmtD,
  initials,
  money,
} from "../utils/assetModel";

const TONE_TEXT: Record<string, string> = {
  success: "#15803D",
  warning: "#B45309",
  danger: "#B91C1C",
  info: "#1D4ED8",
  neutral: "#374151",
};
const ALERT_CLASS: Record<string, string> = {
  success: "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]",
  warning: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
  danger: "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
  info: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]",
  neutral: "border-[#E5E7EB] bg-[#F3F4F6] text-[#374151]",
};

const alertOf = (a: AssetRow, today: string, staleDays: number): { text: string; tone: string } | null => {
  const note = a.status_note ? ` ${a.status_note}` : "";
  const r = a.repair_requisition;
  switch (a.status) {
    case "LOST_OR_STOLEN":
      return {
        text: `Reported lost or stolen on ${fmtD(a.status_since)}.${note}${
          a.lost_confirmed_at ? ` Confirmed as lost on ${fmtD(a.lost_confirmed_at)}.` : " Still being searched for."
        }`,
        tone: "danger",
      };
    case "NOT_FIXABLE":
      return { text: `Beyond repair since ${fmtD(a.status_since)}.${note} Consider a requisition for a replacement.`, tone: "danger" };
    case "NEEDS_REPAIR":
      return {
        text: `Needs repair since ${fmtD(a.status_since)}.${note}${
          r ? ` Repair requisition ${r.generated_id} is ${REQ_STATUS[r.status].label.toLowerCase()}.` : " No repair requisition raised yet."
        }`,
        tone: r?.status === "APPROVED" ? "success" : "warning",
      };
    case "OUT_OF_REPAIRS":
      return { text: `Under repair for ${ago(a.status_since, today)}.${note}`, tone: daysSince(a.status_since, today) > staleDays ? "warning" : "info" };
    case "UNASSIGNED":
      return daysSince(a.status_since, today) > 90
        ? { text: `In the store for ${ago(a.status_since, today)} with no department using it.`, tone: "neutral" }
        : null;
    default:
      return null;
  }
};

export const AssetDrawer = ({
  asset,
  today,
  staleDays,
  buttons,
  busy,
  version,
  loadHistory,
  onClose,
}: {
  asset: AssetRow | null;
  today: string;
  staleDays: number;
  buttons: CommDialogButton[];
  busy?: boolean;
  /** Bumped after a change so the history reloads. */
  version: number;
  loadHistory: (id: number) => Promise<AssetHistoryEntry[]>;
  onClose: () => void;
}) => {
  const [history, setHistory] = useState<AssetHistoryEntry[] | null>(null);
  const id = asset?.id;

  useEffect(() => {
    if (!id) return;
    let live = true;
    setHistory(null);
    loadHistory(id)
      .then((rows) => live && setHistory(rows))
      .catch(() => live && setHistory([]));
    return () => {
      live = false;
    };
  }, [id, version, loadHistory]);

  if (!asset) {
    return (
      <RequisitionDrawerShell open={false} onClose={onClose} title="" buttons={[]}>
        {null}
      </RequisitionDrawerShell>
    );
  }

  const alert = alertOf(asset, today, staleDays);
  const r = asset.repair_requisition;
  const facts: [string, string][] = [
    ["Category", categoryLabel(asset.category)],
    ["Held by", asset.department?.name || "Not assigned"],
    ["Date assigned", asset.date_assigned ? fmtD(asset.date_assigned) : "—"],
    ["Bought", asset.date_purchased ? `${fmtD(asset.date_purchased)} · ${ago(asset.date_purchased, today)} ago` : "—"],
    ["Supplier", asset.supplier || "—"],
    ["Amount paid", money(asset.price)],
    ["Last counted", asset.last_counted_at ? fmtD(asset.last_counted_at) : "Never counted"],
    ...(r ? ([["Repair requisition", `${r.generated_id} · ${REQ_STATUS[r.status].label}`]] as [string, string][]) : []),
  ];

  return (
    <RequisitionDrawerShell
      open
      onClose={onClose}
      pill={{ label: STATUS[asset.status].label, tone: STATUS[asset.status].tone }}
      gid={asset.code}
      title={asset.name}
      meta={`${categoryLabel(asset.category)} · ${money(asset.price)}`}
      buttons={buttons}
      busy={busy}
    >
      {asset.photo ? (
        <img src={asset.photo} alt={asset.name} className="h-[180px] w-full rounded-xl border border-lightGray object-cover" />
      ) : (
        <div className="flex h-[180px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-lightGray bg-[#F3F5FA] text-[#6B7280]">
          <span className="text-2xl font-semibold text-[#4B5563]">{initials(asset.name)}</span>
          <span className="text-xs">No photo yet · add one when editing</span>
        </div>
      )}
      {alert && (
        <p role="status" className={cn("rounded-lg border px-4 py-3 text-sm", ALERT_CLASS[alert.tone])}>
          {alert.text}
        </p>
      )}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,160px),1fr))] gap-4">
        {facts.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-xs text-[#6B7280]">{label}</span>
            <span className="text-sm font-medium text-primary">{value}</span>
          </div>
        ))}
      </div>
      <DrawerSection title="Description">
        <p className="whitespace-pre-line text-sm text-[#374151]">{asset.description || "—"}</p>
      </DrawerSection>
      <DrawerSection title="History">
        {history === null ? (
          <div className="space-y-2">
            {[0, 1, 2].map((n) => (
              <div key={n} className="h-8 animate-pulse rounded bg-[#F3F4F6]" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-[#6B7280]">No history recorded yet.</p>
        ) : (
          <ol className="m-0 flex list-none flex-col p-0">
            {history
              .slice()
              .reverse()
              .map((entry) => (
                <li key={`${entry.id}-${entry.at}`} className="flex gap-3 pb-3">
                  <span
                    className="mt-[5px] h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ background: TONE_TEXT[entry.tone] ?? TONE_TEXT.neutral }}
                  />
                  <div>
                    <p className="text-sm text-primary">{entry.text}</p>
                    <p className="text-xs text-[#6B7280]">{fmtD(entry.at)}</p>
                  </div>
                </li>
              ))}
          </ol>
        )}
      </DrawerSection>
    </RequisitionDrawerShell>
  );
};
