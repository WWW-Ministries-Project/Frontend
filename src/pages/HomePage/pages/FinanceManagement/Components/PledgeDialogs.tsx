import { useMemo, useState } from "react";

import { BranchSelectField } from "@/components/BranchSelectField";
import { notify } from "@/components/feedback";
import { useStore } from "@/store/useStore";
import { api } from "@/utils/api/apiCalls";
import type {
  PledgeDetail,
  PledgeMutationPayload,
  PledgePerson,
  PledgerInput,
  PledgerRow,
} from "@/utils/api/pledges/interface";

import { uploadAssetPhoto } from "../../AssetsManagement/utils/useAssetsData";
import { MemberPicker } from "../../AppointmentsManagement/Components/appointmentUi";
import { CommDialog, FieldGrid, FullRow, ImageDropField } from "../../ChurchCommunication/ui/commUi";
import { errorText } from "../../ChurchCommunication/ui/commUtils";
import { Field, SelectInput, TextInput, UiButton } from "../../MembershipManagement/components/membershipUi";
import { addDays, money, num, todayKey } from "../utils/financeModel";
import { useIsAllBranches, useMemberNames, useWriteBranchId } from "../utils/useFinanceData";
import { Hint } from "./financeUi";
import { type AccountDraft, EMPTY_ACCOUNT, accountErrors, useBanks } from "../utils/settlementAccount";
import { SettlementAccountFields } from "./SettlementAccountFields";

/** A member (by id) or a guest (by name). */
interface Person {
  user_id?: number;
  name: string;
}

const personPayload = (p: Person): PledgePerson =>
  p.user_id ? { user_id: p.user_id } : { guest_name: p.name.trim() };

/* -------------------------------------------------------------------------- */
/*                              Create / edit pledge                           */
/* -------------------------------------------------------------------------- */

interface GroupDraft {
  label: string;
  called: string;
}

export const PledgeFormDialog = ({
  pledge,
  onClose,
  onSaved,
}: {
  /** Edit when set; only details, callers and the account can change. */
  pledge?: PledgeDetail | null;
  onClose: () => void;
  onSaved: (id: number) => void;
}) => {
  const editing = Boolean(pledge);
  const eventsOptions = useStore((s) => s.eventsOptions);
  const { options: memberOptions } = useMemberNames();
  const banks = useBanks();
  const allBranches = useIsAllBranches();
  const writeBranchId = useWriteBranchId();

  const [title, setTitle] = useState(pledge?.title ?? "");
  const [eventId, setEventId] = useState(pledge?.event?.id ? String(pledge.event.id) : "");
  const [target, setTarget] = useState(pledge?.target_amount ? String(pledge.target_amount) : "");
  const [deadline, setDeadline] = useState(pledge?.deadline ? String(pledge.deadline).slice(0, 10) : addDays(todayKey(), 60));
  const [callers, setCallers] = useState<Person[]>(
    () =>
      pledge?.callers.map((c) =>
        c.user?.id ? { user_id: c.user.id, name: c.user.name ?? `Member ${c.user.id}` } : { name: c.guest_name ?? "" }
      ) ?? []
  );
  const [guestCaller, setGuestCaller] = useState("");
  const [groups, setGroups] = useState<GroupDraft[]>([{ label: "", called: "" }]);
  const [changeAccount, setChangeAccount] = useState(!editing);
  const [account, setAccount] = useState<AccountDraft>(EMPTY_ACCOUNT);
  const [branchId, setBranchId] = useState<number | "">("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);

  const errors = [
    !title.trim() && "Give the pledge a title.",
    !eventId && "Choose the event the pledge was called at.",
    !callers.length && "Add who called for the pledge.",
    !editing && groups.some((g) => !g.label.trim() || !(num(g.called) > 0)) && "Every group needs a name and a called amount.",
    ...(changeAccount ? accountErrors(account) : []),
    !editing && allBranches && !branchId && "Choose the branch this pledge belongs to.",
  ].filter(Boolean) as string[];

  const save = async () => {
    if (errors.length) {
      setTried(true);
      return;
    }
    const bank = banks.find((b) => b.code === account.settlement_bank);
    const payload: PledgeMutationPayload = {
      event_id: Number(eventId),
      title: title.trim(),
      target_amount: num(target) || null,
      deadline: deadline || null,
      callers: callers.map(personPayload),
      ...(!editing
        ? { groups: groups.map((g) => ({ label: g.label.trim(), called_amount: num(g.called), pledgers: [] })) }
        : {}),
      ...(changeAccount
        ? {
            currency: "GHS",
            account_type: account.account_type,
            settlement_bank: account.settlement_bank,
            bank_name: bank?.name ?? account.settlement_bank,
            account_number: account.account_number.replace(/\s/g, ""),
            account_name: account.account_name.trim(),
          }
        : {}),
      ...(!editing ? { branch_id: allBranches ? Number(branchId) || "" : writeBranchId ?? "" } : {}),
    };
    setBusy(true);
    try {
      const res = editing
        ? await api.put.updatePledge(payload, { id: String(pledge!.id) })
        : await api.post.createPledge(payload);
      const id = Number(res?.data?.id ?? pledge?.id);
      notify.success(
        editing
          ? { title: "Pledge updated", message: payload.title }
          : { title: "Pledge created", message: "Now add the pledgers to each group." }
      );
      onSaved(id);
    } catch (e) {
      notify.error({ title: editing ? "Couldn’t update the pledge" : "Couldn’t create the pledge", message: errorText(e, "Check the details and try again.") });
    } finally {
      setBusy(false);
    }
  };

  return (
    <CommDialog
      open
      onClose={onClose}
      title={editing ? "Edit pledge" : "Create pledge"}
      subtitle={editing ? "Groups and pledgers are managed on the pledge itself." : "Set up the groups now. Add pledgers once it’s created."}
      busy={busy}
      width={672}
      errors={tried ? errors : undefined}
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: editing ? "Save changes" : "Create pledge", onClick: () => void save(), tone: "primary" },
      ]}
    >
      <FieldGrid>
        <FullRow>
          <Field label="Title">
            <TextInput
              value={title}
              hasError={tried && !title.trim()}
              placeholder="e.g. Harvest Thanksgiving 2026"
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
        </FullRow>
        <Field label="Event">
          <SelectInput
            value={eventId}
            hasError={tried && !eventId}
            onChange={(e) => setEventId(e.target.value)}
            options={[
              { value: "", label: "Choose an event" },
              ...eventsOptions.map((o) => ({ value: String(o.value), label: String(o.label) })),
            ]}
          />
        </Field>
        <Field label="Deadline">
          <TextInput type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
        <Field label="Target (GHS, optional)">
          <TextInput type="number" min={0} inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} />
        </Field>
        {!editing && (
          <BranchSelectField
            value={branchId}
            onChange={setBranchId}
            required
            error={tried && !branchId ? "Choose the branch this pledge belongs to." : undefined}
          />
        )}
        <FullRow>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-primary">Called by</span>
            <div className="flex flex-wrap gap-2">
              {callers.map((c, i) => (
                <span key={`${c.user_id ?? c.name}-${i}`} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-primary bg-primary px-3 text-sm text-white">
                  {c.name}
                  {!c.user_id && <span className="text-xs text-white/70">guest</span>}
                  <button
                    type="button"
                    aria-label={`Remove ${c.name}`}
                    onClick={() => setCallers(callers.filter((_, j) => j !== i))}
                    className="text-base leading-none text-white/80 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
              {!callers.length && <Hint tone={tried ? "danger" : "muted"}>No one yet.</Hint>}
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-2">
              <MemberPicker
                options={memberOptions}
                value={null}
                exclude={callers.filter((c) => c.user_id).map((c) => String(c.user_id))}
                onChange={(v) => v && setCallers([...callers, { user_id: Number(v.id), name: v.name }])}
                placeholder="Add a member"
              />
              <div className="flex gap-2">
                <TextInput
                  value={guestCaller}
                  placeholder="Or a guest’s name"
                  onChange={(e) => setGuestCaller(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && guestCaller.trim()) {
                      e.preventDefault();
                      setCallers([...callers, { name: guestCaller.trim() }]);
                      setGuestCaller("");
                    }
                  }}
                />
                <UiButton
                  disabled={!guestCaller.trim()}
                  onClick={() => {
                    setCallers([...callers, { name: guestCaller.trim() }]);
                    setGuestCaller("");
                  }}
                >
                  Add
                </UiButton>
              </div>
            </div>
          </div>
        </FullRow>

        {!editing && (
          <>
            <FullRow>
              <p className="border-t border-gray-200 pt-2 text-base font-semibold text-primary">Groups</p>
            </FullRow>
            {groups.map((g, i) => (
              <FullRow key={i}>
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2">
                  <Field label={`Group ${i + 1} name`}>
                    <TextInput
                      value={g.label}
                      hasError={tried && !g.label.trim()}
                      placeholder="e.g. Gold"
                      onChange={(e) => setGroups(groups.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                    />
                  </Field>
                  <Field label="Called amount (GHS)">
                    <TextInput
                      type="number"
                      min={0}
                      inputMode="decimal"
                      value={g.called}
                      hasError={tried && !(num(g.called) > 0)}
                      onChange={(e) => setGroups(groups.map((x, j) => (j === i ? { ...x, called: e.target.value } : x)))}
                    />
                  </Field>
                  <button
                    type="button"
                    aria-label={`Remove group ${i + 1}`}
                    disabled={groups.length === 1}
                    onClick={() => setGroups(groups.filter((_, j) => j !== i))}
                    className="h-10 w-10 rounded-lg border border-lightGray bg-white text-lg text-red-700 hover:bg-red-50 disabled:opacity-40"
                  >
                    ×
                  </button>
                </div>
              </FullRow>
            ))}
            <FullRow>
              <UiButton className="border-dashed" onClick={() => setGroups([...groups, { label: "", called: "" }])}>
                + Add group
              </UiButton>
            </FullRow>
          </>
        )}

        <FullRow>
          <p className="border-t border-gray-200 pt-2 text-base font-semibold text-primary">Settlement account for online payments</p>
          {editing && pledge && !changeAccount && (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-inputBackground p-3 text-sm">
              <span>
                {pledge.bank_name ? `${pledge.bank_name} · ${pledge.masked_account_number ?? ""}` : "Not set up"}
                {pledge.account_name ? ` · ${pledge.account_name}` : ""}
              </span>
              <UiButton size="sm" onClick={() => setChangeAccount(true)}>
                {pledge.bank_name ? "Change account" : "Set up account"}
              </UiButton>
            </div>
          )}
        </FullRow>
        {changeAccount && <SettlementAccountFields value={account} onChange={setAccount} tried={tried} banks={banks} />}
      </FieldGrid>
    </CommDialog>
  );
};

/* -------------------------------------------------------------------------- */
/*                                Add pledgers                                 */
/* -------------------------------------------------------------------------- */

interface PledgerDraft {
  name: string;
  phone: string;
  amount: string;
}

export const AddPledgersDialog = ({
  pledge,
  onClose,
  onSaved,
}: {
  pledge: PledgeDetail;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const { options: memberOptions } = useMemberNames();
  const groups = pledge.groups;
  const [gid, setGid] = useState(String(groups[0]?.id ?? ""));
  const group = groups.find((g) => String(g.id) === gid) ?? groups[0];
  const called = group ? String(num(group.called_amount)) : "";
  const [rows, setRows] = useState<PledgerDraft[]>([{ name: "", phone: "", amount: called }]);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);

  const byName = useMemo(() => {
    const map = new Map<string, number>();
    memberOptions.forEach((o) => map.set(String(o.label).trim().toLowerCase(), Number(o.value)));
    return map;
  }, [memberOptions]);

  const bad = rows.some((r) => !r.name.trim() || !(num(r.amount) > 0));
  const setRow = (i: number, patch: Partial<PledgerDraft>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const save = async () => {
    if (bad || !group?.id) {
      setTried(true);
      return;
    }
    const pledgers: PledgerInput[] = rows.map((r) => {
      const uid = byName.get(r.name.trim().toLowerCase());
      return uid
        ? { user_id: uid, pledged_amount: num(r.amount) }
        : { guest_name: r.name.trim(), guest_phone: r.phone.trim() || null, pledged_amount: num(r.amount) };
    });
    setBusy(true);
    try {
      await api.post.addPledgers({ group_id: Number(group.id), pledgers });
      notify.success({
        title: `${rows.length === 1 ? "1 pledger" : `${rows.length} pledgers`} added to ${group.label ?? "the group"}`,
      });
      onSaved();
    } catch (e) {
      notify.error({ title: "Couldn’t add pledgers", message: errorText(e, "Try again.") });
    } finally {
      setBusy(false);
    }
  };

  const listId = "fn-member-names";

  return (
    <CommDialog
      open
      onClose={onClose}
      title="Add pledgers"
      subtitle={pledge.title ?? "Pledge"}
      busy={busy}
      width={640}
      errors={tried && bad ? ["Every pledger needs a name and an amount above zero."] : undefined}
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: `Add ${rows.length === 1 ? "1 pledger" : `${rows.length} pledgers`}`, onClick: () => void save(), tone: "primary" },
      ]}
    >
      <datalist id={listId}>
        {memberOptions.map((o) => (
          <option key={String(o.value)} value={String(o.label)} />
        ))}
      </datalist>
      <Field label="Group">
        <SelectInput
          value={gid}
          onChange={(e) => {
            const next = groups.find((g) => String(g.id) === e.target.value);
            setGid(e.target.value);
            if (next) setRows(rows.map((r) => ({ ...r, amount: r.amount || String(num(next.called_amount)) })));
          }}
          options={groups.map((g) => ({
            value: String(g.id),
            label: `${g.label ?? "Group"} · called at ${money(num(g.called_amount))}`,
          }))}
        />
      </Field>
      {rows.map((r, i) => {
        const isMember = byName.has(r.name.trim().toLowerCase());
        return (
          <div key={i} className="flex flex-col gap-2 border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-primary">Pledger {i + 1}</p>
              {rows.length > 1 && (
                <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="text-sm text-red-700 underline">
                  Remove
                </button>
              )}
            </div>
            <FieldGrid>
              <Field label="Name">
                <TextInput
                  list={listId}
                  value={r.name}
                  hasError={tried && !r.name.trim()}
                  placeholder="Member or guest name"
                  onChange={(e) => setRow(i, { name: e.target.value })}
                />
              </Field>
              <Field label={isMember ? "Phone (member’s on file)" : "Phone (for guests)"}>
                <TextInput
                  value={r.phone}
                  disabled={isMember}
                  placeholder="024 555 0100"
                  onChange={(e) => setRow(i, { phone: e.target.value })}
                />
              </Field>
              <Field label="Pledged amount (GHS)">
                <TextInput
                  type="number"
                  min={0}
                  inputMode="decimal"
                  value={r.amount}
                  hasError={tried && !(num(r.amount) > 0)}
                  onChange={(e) => setRow(i, { amount: e.target.value })}
                />
              </Field>
            </FieldGrid>
            {r.name.trim() && <Hint>{isMember ? "Member — they’ll see it under My pledges." : "Guest — not linked to a member account."}</Hint>}
          </div>
        );
      })}
      <UiButton className="self-start border-dashed" onClick={() => setRows([...rows, { name: "", phone: "", amount: called }])}>
        + Add another pledger
      </UiButton>
    </CommDialog>
  );
};

/* -------------------------------------------------------------------------- */
/*                               Record payment                                */
/* -------------------------------------------------------------------------- */

export const RecordPaymentDialog = ({
  pledge,
  pledger,
  name,
  onClose,
  onSaved,
}: {
  pledge: PledgeDetail;
  pledger: PledgerRow;
  name: string;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const rem = Math.max(0, num(pledger.remaining));
  const [amount, setAmount] = useState(String(rem));
  const [date, setDate] = useState(todayKey());
  const [method, setMethod] = useState("Cash");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);

  const a = num(amount);
  const errors = [
    !(a > 0) && "Enter the amount paid.",
    a > rem + 0.001 && `That’s more than the ${money(rem)} left on this pledge.`,
    !date && "Add the date it was paid.",
  ].filter(Boolean) as string[];

  const upload = async (file: File) => {
    setUploading(true);
    try {
      setPhoto(await uploadAssetPhoto(file));
    } catch (e) {
      notify.error({ title: "Couldn’t upload the photo", message: errorText(e, "Try a smaller image.") });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (errors.length) {
      setTried(true);
      return;
    }
    setBusy(true);
    try {
      await api.post.createRedemption({
        pledger_id: pledger.id,
        amount: a,
        date,
        method,
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(photo ? { image_url: photo } : {}),
      });
      notify.success({
        title: `${money(a)} recorded for ${name}`,
        message: a >= rem ? "Pledge paid in full." : `${money(rem - a)} still to pay. It shows in that week’s “Pledges Redeemed”.`,
      });
      onSaved();
    } catch (e) {
      notify.error({ title: "Couldn’t record the payment", message: errorText(e, "Try again.") });
    } finally {
      setBusy(false);
    }
  };

  return (
    <CommDialog
      open
      onClose={onClose}
      title={`Record payment · ${name}`}
      subtitle={`${pledge.title ?? "Pledge"} · ${money(rem)} left of ${money(num(pledger.pledged_amount))}`}
      busy={busy || uploading}
      width={560}
      errors={tried ? errors : undefined}
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: "Record payment", onClick: () => void save(), tone: "primary" },
      ]}
    >
      <FieldGrid>
        <Field label="Amount paid (GHS)">
          <TextInput
            type="number"
            min={0}
            inputMode="decimal"
            value={amount}
            hasError={tried && (!(a > 0) || a > rem + 0.001)}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label="Date paid">
          <TextInput type="date" value={date} max={todayKey()} hasError={tried && !date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Method">
          <SelectInput
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            options={["Cash", "Mobile money", "Bank transfer", "Cheque"].map((x) => ({ value: x, label: x }))}
          />
        </Field>
        <Field label="Note (optional)">
          <TextInput value={note} placeholder="Receipt number or reference" onChange={(e) => setNote(e.target.value)} />
        </Field>
        <FullRow>
          <ImageDropField
            label="Receipt photo (optional)"
            help="Drag a photo here or browse. JPG or PNG."
            previewUrl={photo}
            busy={uploading}
            onFile={(f) => void upload(f)}
            onClear={() => setPhoto(null)}
          />
        </FullRow>
      </FieldGrid>
    </CommDialog>
  );
};
