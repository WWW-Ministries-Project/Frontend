import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { BranchSelectField } from "@/components/BranchSelectField";
import { notify } from "@/components/feedback";
import { useRouteAccess } from "@/context/RouteAccessContext";
import { api } from "@/utils/api/apiCalls";
import type { GivingOption, GivingOptionPayload } from "@/utils/api/finance/interface";
import { relativePath } from "@/utils/const";
import { cn } from "@/utils/cn";

import PageOutline from "../../Components/PageOutline";
import { confirmAction } from "../../utils/helperFunctions";
import { CommDialog, FieldGrid, FullRow } from "../ChurchCommunication/ui/commUi";
import { errorText } from "../ChurchCommunication/ui/commUtils";
import { Field, PageHeading, Pill, TextInput, UiButton } from "../MembershipManagement/components/membershipUi";
import { EmptyNote, Fact, Kpi, KpiGrid } from "./Components/financeUi";
import { SettlementAccountFields } from "./Components/SettlementAccountFields";
import { type AccountDraft, EMPTY_ACCOUNT, accountErrors, useBanks } from "./utils/settlementAccount";
import { MON, MONF, fmtS, fromMinor, money, moneyS } from "./utils/financeModel";
import { useContributions, useGivingOptions, useIsAllBranches, useToday } from "./utils/useFinanceData";

interface OptDraft {
  id: string | null;
  name: string;
  description: string;
  account: AccountDraft;
}

const GivingOptions = () => {
  const navigate = useNavigate();
  const today = useToday();
  const { canManageCurrentRoute: canManage } = useRouteAccess();
  const { options, loading, error, reload } = useGivingOptions();
  const contribs = useContributions({});
  const banks = useBanks();
  const allBranches = useIsAllBranches();

  const [draft, setDraft] = useState<OptDraft | null>(null);
  const [branchId, setBranchId] = useState<number | "">("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);

  const monthKey = today.slice(0, 7);
  const nowMonth = Number(today.slice(5, 7)) - 1;

  const stats = useMemo(() => {
    const out = new Map<string, { month: number; n: number; last: string }>();
    contribs.rows
      .filter((c) => c.status === "success")
      .forEach((c) => {
        const s = out.get(c.giving_option_id) ?? { month: 0, n: 0, last: "" };
        const at = c.paid_at || c.createdAt;
        if (String(at).startsWith(monthKey)) s.month += fromMinor(c.amount) ?? 0;
        s.n += 1;
        if (!s.last || at > s.last) s.last = at;
        out.set(c.giving_option_id, s);
      });
    return out;
  }, [contribs.rows, monthKey]);

  const active = options.filter((o) => !o.archived_at && o.is_active !== false);
  const live = active.filter((o) => o.is_synced);
  const notReady = active.filter((o) => !o.is_synced);
  const monthTotal = [...stats.values()].reduce((a, s) => a + s.month, 0);

  const giveLink = (o: GivingOption) =>
    `${window.location.origin}${relativePath.member.giving}?option=${encodeURIComponent(o.id)}`;

  const openOpt = (o: GivingOption | null) => {
    setTried(false);
    setBranchId("");
    setDraft(
      o
        ? {
            id: o.id,
            name: o.name,
            description: o.description ?? "",
            account: {
              account_type: o.account_type,
              settlement_bank: o.settlement_bank,
              account_number: o.account_number ?? "",
              account_name: o.account_name ?? "",
              verified: true,
              manual: false,
            },
          }
        : { id: null, name: "", description: "", account: EMPTY_ACCOUNT }
    );
  };

  const draftErrors = (x: OptDraft) => [
    ...(!x.name.trim() ? ["Give the option a name members will recognise."] : []),
    ...accountErrors(x.account),
    ...(!x.id && allBranches && !branchId ? ["Choose the branch this option belongs to."] : []),
  ];

  const saveOpt = async () => {
    if (!draft) return;
    if (draftErrors(draft).length) {
      setTried(true);
      return;
    }
    const bank = banks.find((b) => b.code === draft.account.settlement_bank);
    const payload: GivingOptionPayload = {
      name: draft.name.trim(),
      ...(draft.description.trim() ? { description: draft.description.trim() } : {}),
      account_type: draft.account.account_type,
      settlement_bank: draft.account.settlement_bank,
      bank_name: bank?.name ?? draft.account.settlement_bank,
      account_number: draft.account.account_number.replace(/\s/g, ""),
      account_name: draft.account.account_name.trim(),
      currency: "GHS",
      ...(!draft.id && branchId ? { branch_id: Number(branchId) } : {}),
    };
    setBusy(true);
    try {
      if (draft.id) await api.put.updateGivingOption(payload, { id: draft.id });
      else await api.post.createGivingOption(payload);
      await reload();
      setDraft(null);
      notify.success({
        title: draft.id ? "Giving option updated" : `${payload.name} is live`,
        message: `Paystack settlement account ${draft.id ? "updated" : "created"}. Gifts go straight to ${payload.bank_name} ••••${payload.account_number.slice(-4)}.`,
      });
    } catch (e) {
      notify.error({ title: "Couldn’t save the giving option", message: errorText(e, "Check the account details and try again.") });
    } finally {
      setBusy(false);
    }
  };

  const toggle = (o: GivingOption) => {
    if (o.archived_at) {
      void (async () => {
        try {
          await api.put.restoreGivingOption({}, { id: o.id });
          await reload();
          notify.success({ title: `${o.name} is live again` });
        } catch (e) {
          notify.error({ title: `Couldn’t resume ${o.name}`, message: errorText(e, "Try again.") });
        }
      })();
      return;
    }
    confirmAction({
      title: `Pause ${o.name}?`,
      points: [
        "Members won’t see it on the Give page until you resume it.",
        "Past contributions and the settlement account stay as they are.",
      ],
      confirmLabel: "Pause giving option",
      tone: "danger",
      onConfirm: async () => {
        await api.delete.archiveGivingOption({ id: o.id });
        await reload();
        notify.success({ title: `${o.name} paused` });
      },
    });
  };

  const copyLink = async (o: GivingOption) => {
    try {
      await navigator.clipboard.writeText(giveLink(o));
      notify.success({ title: "Giving link copied", message: "Share it in announcements or on WhatsApp." });
    } catch {
      notify.info({ title: "Copy this link", message: giveLink(o) });
    }
  };

  const errs = draft && tried ? draftErrors(draft) : [];

  return (
    <PageOutline>
      <div className="flex flex-col gap-6">
        <PageHeading
          title="Giving options"
          subtitle="What members can give to online, and the account each one pays into."
          actions={
            canManage && (
              <UiButton tone="primary" onClick={() => openOpt(null)}>
                New giving option
              </UiButton>
            )
          }
        />

        <KpiGrid>
          <Kpi
            label={`Received online in ${MONF[nowMonth]}`}
            value={moneyS(monthTotal)}
            sub="Successful gifts across all options"
          />
          <Kpi label="Live giving options" value={live.length} sub={`${options.length} in total`} />
          <Kpi
            label="Not ready for online giving"
            value={notReady.length}
            sub={
              notReady.length
                ? `${notReady.map((o) => o.name).join(", ")}: settlement account not set up with Paystack`
                : "All accounts are set up"
            }
            tone={notReady.length ? "danger" : "muted"}
            alert={notReady.length ? "danger" : undefined}
          />
        </KpiGrid>

        {error && !options.length && <EmptyNote>Couldn’t load giving options. Refresh to try again.</EmptyNote>}
        {loading && !options.length && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-60 animate-pulse rounded-xl bg-white" />
            ))}
          </div>
        )}
        {!loading && !error && !options.length && (
          <EmptyNote>No giving options yet. Create one so members can give online.</EmptyNote>
        )}

        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4">
          {options.map((o) => {
            const paused = Boolean(o.archived_at) || o.is_active === false;
            const ready = !paused && o.is_synced;
            const s = stats.get(o.id);
            return (
              <div
                key={o.id}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
                  !paused && !o.is_synced ? "border-[#FECACA]" : "border-lightGray",
                  paused && "opacity-70"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xl font-semibold leading-7 text-primary">{o.name}</p>
                    <p className="text-sm text-[#4B5563]">{o.description || "No description"}</p>
                  </div>
                  {paused ? (
                    <Pill tone="neutral">Paused</Pill>
                  ) : o.is_synced ? (
                    <Pill tone="success">Live</Pill>
                  ) : (
                    <Pill tone="danger">Not ready</Pill>
                  )}
                </div>
                <div className="flex flex-col gap-0.5 rounded-lg bg-[#F8F9FC] p-3 text-sm">
                  <p className="text-xs text-[#6B7280]">{o.account_type === "ghipss" ? "Bank account" : "Mobile money"}</p>
                  <p className="font-semibold">
                    {o.bank_name} · {o.masked_account_number || `••••${String(o.account_number ?? "").slice(-4)}`}
                  </p>
                  <p className="text-[#4B5563]">{o.account_name}</p>
                </div>
                {!paused && !o.is_synced && (
                  <p className="text-xs text-[#B91C1C]">
                    Paystack couldn’t create a settlement account. Check the account details and save again.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Fact label={`Received in ${MON[nowMonth]}`} value={money(s?.month ?? 0)} />
                  <Fact label="Gifts · last gift" value={`${s?.n ?? 0}${s?.last ? ` · ${fmtS(s.last)}` : ""}`} />
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  <UiButton
                    className="flex-auto"
                    onClick={() => navigate(`/home/finance/giving-contributions?option=${encodeURIComponent(o.id)}`)}
                  >
                    Contributions
                  </UiButton>
                  {canManage && !o.archived_at && (
                    <UiButton className="flex-auto" onClick={() => openOpt(o)}>
                      Edit
                    </UiButton>
                  )}
                  {ready && (
                    <UiButton className="flex-auto" onClick={() => void copyLink(o)}>
                      Copy link
                    </UiButton>
                  )}
                  {canManage && (
                    <UiButton className="flex-auto" tone={paused ? "secondary" : "danger"} onClick={() => toggle(o)}>
                      {paused ? "Resume" : "Pause"}
                    </UiButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {draft && (
        <CommDialog
          open
          onClose={() => setDraft(null)}
          title={draft.id ? "Edit giving option" : "New giving option"}
          subtitle="Money given to this option is paid straight into the account below."
          busy={busy}
          width={600}
          errors={errs}
          buttons={[
            { label: "Cancel", onClick: () => setDraft(null) },
            { label: draft.id ? "Save changes" : "Create giving option", onClick: () => void saveOpt(), tone: "primary" },
          ]}
        >
          <FieldGrid>
            <Field label="Name">
              <TextInput
                value={draft.name}
                hasError={tried && !draft.name.trim()}
                placeholder="e.g. Building Fund"
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </Field>
            <Field label="Description (optional)">
              <TextInput
                value={draft.description}
                placeholder="What the money is for"
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </Field>
            {!draft.id && allBranches && (
              <FullRow>
                <BranchSelectField
                  value={branchId}
                  onChange={setBranchId}
                  required
                  error={tried && !branchId ? "Choose the branch this option belongs to." : undefined}
                />
              </FullRow>
            )}
            <FullRow>
              <p className="border-t border-[#E5E7EB] pt-2 text-base font-semibold text-primary">Settlement account</p>
            </FullRow>
            <SettlementAccountFields
              value={draft.account}
              onChange={(account) => setDraft({ ...draft, account })}
              tried={tried}
              banks={banks}
            />
          </FieldGrid>
        </CommDialog>
      )}
    </PageOutline>
  );
};

export default GivingOptions;
