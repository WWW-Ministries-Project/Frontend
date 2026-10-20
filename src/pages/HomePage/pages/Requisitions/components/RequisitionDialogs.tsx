import { useEffect, useId, useMemo, useRef, useState } from "react";

import { notify } from "@/components/feedback";
import type { RequisitionFormPayload, RequisitionOverviewDetail } from "@/utils/api/requisitions/interfaces";
import { cn } from "@/utils/cn";

import {
  Field,
  SelectInput,
  TextArea,
  TextInput,
  UiButton,
} from "../../MembershipManagement/components/membershipUi";
import { useViewportWidth } from "../../ChurchCommunication/ui/commUtils";
import {
  type Row,
  type SimilarGroup,
  addDaysKey,
  fileNameOf,
  firstName,
  money,
  todayKey,
} from "../utils/requisitionModel";
import { uploadRequisitionFile } from "../utils/useRequisitionsData";
import { Points, RequisitionDialog, SignatureField, SimilarBox } from "./requisitionUi";

export interface Option {
  value: string;
  label: string;
}

/* -------------------------------------------------------------------------- */
/*                                    Form                                    */
/* -------------------------------------------------------------------------- */

type ItemDraft = { id?: number; name: string; quantity: string; price: string };
type FileDraft = { id?: number; url: string };

export interface FormSeed {
  /** Existing requisition being edited (undefined for a new one or a revision). */
  editing?: RequisitionOverviewDetail;
  /** Rejected requisition this new draft revises. */
  revisedFrom?: RequisitionOverviewDetail;
  defaultDepartmentId?: number | null;
}

const CURRENCIES: Option[] = [
  { value: "GHS", label: "Ghana Cedi (GHS)" },
  { value: "USD", label: "US Dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "GBP", label: "British Pound (GBP)" },
];


export const RequisitionFormDialog = ({
  open,
  seed,
  departments,
  events,
  onClose,
  onSave,
}: {
  open: boolean;
  seed: FormSeed;
  departments: Option[];
  events: Option[];
  onClose: () => void;
  /** Saves, then (when thenSign) the parent opens the sign dialog for the returned id. */
  onSave: (payload: RequisitionFormPayload, thenSign: boolean) => Promise<void>;
}) => {
  const phone = useViewportWidth() < 640;
  const source = seed.editing ?? seed.revisedFrom;
  const [dept, setDept] = useState("");
  const [event, setEvent] = useState("");
  const [needed, setNeeded] = useState("");
  const [currency, setCurrency] = useState("GHS");
  const [why, setWhy] = useState("");
  const [items, setItems] = useState<ItemDraft[]>([{ name: "", quantity: "1", price: "" }]);
  const [files, setFiles] = useState<FileDraft[]>([]);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const fileInputId = useId();

  useEffect(() => {
    if (!open) return;
    setDept(source ? String(source.department.id) : seed.defaultDepartmentId ? String(seed.defaultDepartmentId) : "");
    setEvent(source?.event ? String(source.event.id) : "");
    setNeeded(
      seed.editing?.needed_by ? seed.editing.needed_by.slice(0, 10) : addDaysKey(todayKey(), 7)
    );
    setCurrency(source?.currency || "GHS");
    setWhy(source?.purpose || "");
    setItems(
      source?.products.length
        ? source.products.map((product) => ({
            id: seed.editing ? product.id : undefined,
            name: product.name,
            quantity: String(product.quantity),
            price: String(product.unit_price),
          }))
        : [{ name: "", quantity: "1", price: "" }]
    );
    setFiles(
      source?.attachments.map((attachment) => ({
        id: seed.editing ? attachment.id : undefined,
        url: attachment.url,
      })) ?? []
    );
    setTried(false);
  }, [open, source, seed.editing, seed.defaultDepartmentId]);

  const named = items.filter((item) => item.name.trim());
  const total = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);

  const errors = useMemo(() => {
    const out: string[] = [];
    if (!dept) out.push("Choose the department this is for.");
    if (!named.length) out.push("Add at least one item.");
    if (named.some((item) => !(Number(item.quantity) > 0) || !(Number(item.price) > 0)))
      out.push("Every item needs a quantity and a unit price above zero.");
    else if (named.some((item) => !Number.isInteger(Number(item.quantity))))
      out.push("Quantities must be whole numbers.");
    if (!why.trim()) out.push("Say why this is needed. Approvers read it first.");
    if (!needed) out.push("Add the date you need this by.");
    return out;
  }, [dept, named, why, needed]);

  const shown = tried ? errors : [];
  const editingSubmitted = !!seed.editing && seed.editing.status !== "DRAFT";

  const save = async (thenSign: boolean) => {
    setTried(true);
    if (errors.length) return;
    setBusy(true);
    try {
      await onSave(
        {
          ...(seed.editing ? { id: seed.editing.id } : {}),
          ...(seed.revisedFrom ? { revised_from_id: seed.revisedFrom.id } : {}),
          department_id: Number(dept),
          event_id: event ? Number(event) : null,
          request_date: seed.editing?.request_date?.slice(0, 10) || todayKey(),
          needed_by: needed,
          purpose: why.trim(),
          currency,
          products: named.map((item) => ({
            ...(item.id ? { id: item.id } : {}),
            name: item.name.trim(),
            quantity: Number(item.quantity),
            unitPrice: Number(item.price),
          })),
          attachmentLists: files.map((file) => ({ ...(file.id ? { id: file.id } : {}), URL: file.url })),
        },
        thenSign
      );
    } finally {
      setBusy(false);
    }
  };

  const addFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setUploading(true);
    for (const file of Array.from(list)) {
      try {
        const url = await uploadRequisitionFile(file);
        setFiles((prev) => [...prev, { url }]);
      } catch (error) {
        notify.fromError(error, { title: `Couldn’t attach ${file.name}` });
      }
    }
    setUploading(false);
  };

  const setItem = (index: number, patch: Partial<ItemDraft>) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const bad = (flag: boolean) => tried && flag;

  return (
    <RequisitionDialog
      open={open}
      onClose={onClose}
      busy={busy}
      width={760}
      title={seed.editing ? `Edit ${seed.editing.generated_id}` : "New requisition"}
      subtitle={
        seed.editing
          ? "Changes are logged in the history."
          : seed.revisedFrom
            ? `Revising ${seed.revisedFrom.generated_id}. Saved as a draft until you sign and submit.`
            : "Saved as a draft until you sign and submit."
      }
      errors={shown}
      footerLead={`Total ${money(total, currency)}`}
      buttons={
        editingSubmitted
          ? [
              { label: "Cancel", onClick: onClose },
              { label: "Save changes", tone: "primary", onClick: () => save(false), disabled: uploading },
            ]
          : [
              { label: "Cancel", onClick: onClose },
              { label: "Save draft", onClick: () => save(false), disabled: uploading },
              { label: "Continue to sign", tone: "primary", onClick: () => save(true), disabled: uploading },
            ]
      }
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4">
        <Field label="Department">
          <SelectInput
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            hasError={bad(!dept)}
            options={[{ value: "", label: "Choose department" }, ...departments]}
          />
        </Field>
        <Field label="Event or programme">
          <SelectInput
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            options={[{ value: "", label: "None" }, ...events]}
          />
        </Field>
        <Field label="Needed by">
          <TextInput type="date" value={needed} onChange={(e) => setNeeded(e.target.value)} hasError={bad(!needed)} />
        </Field>
        <Field label="Currency">
          <SelectInput value={currency} onChange={(e) => setCurrency(e.target.value)} options={CURRENCIES} />
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-base font-semibold text-primary">Items</h3>
          <span className="text-sm text-[#4B5563]">
            {named.length} of {items.length} named
          </span>
        </div>
        {!phone && (
          <div className="flex gap-2 px-1 text-xs font-semibold text-[#4B5563]">
            <span className="flex-[1_1_220px]">ITEM</span>
            <span className="flex-[0_0_80px]">QTY</span>
            <span className="flex-[0_0_120px]">UNIT PRICE</span>
            <span className="flex-[0_0_120px] text-right">TOTAL</span>
            <span className="flex-[0_0_36px]" />
          </div>
        )}
        {items.map((item, index) => {
          const isNamed = !!item.name.trim();
          return (
            <div
              key={index}
              className={cn("flex flex-wrap items-center gap-2 rounded-lg", phone && "border border-lightGray p-3")}
            >
              <TextInput
                value={item.name}
                onChange={(e) => setItem(index, { name: e.target.value })}
                placeholder="Item name"
                aria-label={`Item ${index + 1} name`}
                hasError={bad(index === 0 && !named.length)}
                className="min-w-0 flex-[1_1_220px]"
              />
              <TextInput
                type="number"
                min={1}
                step={1}
                value={item.quantity}
                onChange={(e) => setItem(index, { quantity: e.target.value })}
                placeholder="Qty"
                aria-label={`Item ${index + 1} quantity`}
                hasError={bad(isNamed && !(Number(item.quantity) > 0 && Number.isInteger(Number(item.quantity))))}
                className="!w-20 flex-[0_0_80px]"
              />
              <TextInput
                type="number"
                min={0}
                step="0.01"
                value={item.price}
                onChange={(e) => setItem(index, { price: e.target.value })}
                placeholder="Unit price"
                aria-label={`Item ${index + 1} unit price`}
                hasError={bad(isNamed && !(Number(item.price) > 0))}
                className={cn("flex-[1_0_120px]", !phone && "max-w-[120px]")}
              />
              <span className="ml-auto flex-[0_0_120px] text-right text-sm font-semibold text-primary">
                {money((Number(item.quantity) || 0) * (Number(item.price) || 0), currency)}
              </span>
              <button
                type="button"
                onClick={() => setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))}
                disabled={items.length === 1}
                aria-label={`Remove item ${index + 1}`}
                className="h-9 w-9 flex-[0_0_36px] rounded-lg border border-lightGray bg-white text-lg text-[#B91C1C] disabled:opacity-40"
              >
                ×
              </button>
            </div>
          );
        })}
        <UiButton
          className="self-start border-dashed"
          onClick={() => setItems((prev) => [...prev, { name: "", quantity: "1", price: "" }])}
        >
          + Add item
        </UiButton>
      </div>

      <Field label="Why it’s needed">
        <TextArea
          value={why}
          onChange={(e) => setWhy(e.target.value)}
          rows={3}
          maxLength={600}
          placeholder="What it’s for and what happens if it isn’t bought"
          hasError={bad(!why.trim())}
        />
        <span className="text-xs text-[#6B7280]">Approvers read this first.</span>
      </Field>

      <div className="flex flex-col gap-1">
        <span className="text-sm text-primary">Quotes and photos</span>
        <label
          htmlFor={fileInputId}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void addFiles(e.dataTransfer.files);
          }}
          className={cn(
            "cursor-pointer rounded-lg border border-dashed p-5 text-center text-sm text-[#4B5563]",
            dragging ? "border-primary bg-primary/5" : "border-lightGray bg-[#F9FAFB]"
          )}
        >
          {uploading ? (
            "Uploading…"
          ) : (
            <>
              Drag files here or <span className="font-semibold text-primary">browse</span>. PDF, JPG or PNG up to 5MB.
            </>
          )}
        </label>
        <input
          id={fileInputId}
          ref={fileInput}
          type="file"
          multiple
          accept=".pdf,image/png,image/jpeg"
          className="sr-only"
          onChange={(e) => {
            void addFiles(e.target.files);
            if (fileInput.current) fileInput.current.value = "";
          }}
        />
        {files.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {files.map((file) => (
              <span
                key={file.url}
                className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-lightGray bg-[#F8F9FC] px-3 py-1.5 text-sm text-primary"
              >
                <span className="max-w-[200px] truncate">{fileNameOf(file.url)}</span>
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((x) => x.url !== file.url))}
                  aria-label={`Remove ${fileNameOf(file.url)}`}
                  className="text-[#B91C1C]"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </RequisitionDialog>
  );
};

/* -------------------------------------------------------------------------- */
/*                                Sign & submit                               */
/* -------------------------------------------------------------------------- */

export const SignDialog = ({
  open,
  row,
  requesterName,
  onClose,
  onSubmit,
}: {
  open: boolean;
  row: Row | null;
  requesterName: string;
  onClose: () => void;
  onSubmit: (signature: string) => Promise<void>;
}) => {
  const [sign, setSign] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setSign("");
      setTried(false);
    }
  }, [open]);

  if (!row) return null;
  const missing = !sign.trim();
  const go = async () => {
    setTried(true);
    if (missing) return;
    setBusy(true);
    try {
      await onSubmit(sign.trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <RequisitionDialog
      open={open}
      onClose={onClose}
      busy={busy}
      title={`Sign and submit ${row.generated_id}`}
      subtitle={`${row.items[0]?.name ?? "Requisition"} · ${money(row.total_amount, row.currency)}`}
      errorTitle="Your signature is needed"
      errors={tried && missing ? ["Type your full name to sign."] : []}
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: "Submit requisition", tone: "primary", onClick: go },
      ]}
    >
      <Points
        points={[
          "It goes to each approver in turn, starting with the head of department.",
          "Each approver is notified when it reaches them, and you’re notified at every step.",
          "You can still edit it until the first approver acts.",
        ]}
      />
      <SignatureField value={sign} onChange={setSign} placeholder={requesterName} hasError={tried && missing} />
    </RequisitionDialog>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   Approve                                  */
/* -------------------------------------------------------------------------- */

export const ApproveDialog = ({
  open,
  row,
  myName,
  similar,
  lookbackDays,
  onClose,
  onApprove,
}: {
  open: boolean;
  row: Row | null;
  myName: string;
  similar: SimilarGroup[];
  lookbackDays: number;
  onClose: () => void;
  onApprove: (signature: string, comment: string) => Promise<void>;
}) => {
  const [comment, setComment] = useState("");
  const [sign, setSign] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setComment("");
      setSign("");
      setTried(false);
    }
  }, [open]);

  if (!row) return null;
  const current = row.steps.find((step) => step.status === "PENDING");
  const next = current ? row.steps.find((step) => step.order === current.order + 1) : undefined;
  const isFinal = !next;
  const missing = !sign.trim();

  const go = async () => {
    setTried(true);
    if (missing) return;
    setBusy(true);
    try {
      await onApprove(sign.trim(), comment);
    } finally {
      setBusy(false);
    }
  };

  return (
    <RequisitionDialog
      open={open}
      onClose={onClose}
      busy={busy}
      title={`${isFinal ? "Give final approval for" : "Approve"} ${row.generated_id}`}
      subtitle={`${row.requester.name} · ${money(row.total_amount, row.currency)}`}
      errorTitle="Your signature is needed"
      errors={tried && missing ? ["Type your full name to sign this approval."] : []}
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: isFinal ? "Give final approval" : "Approve and send on", tone: "primary", onClick: go },
      ]}
    >
      <Points
        points={[
          next
            ? `It moves to ${next.approver.name} (${next.label}) next.`
            : "This is the last step. Finance is told to release funds.",
          `${row.requester.name} is notified.`,
        ]}
      />
      {similar.length > 0 && <SimilarBox groups={similar} lookbackDays={lookbackDays} compact />}
      <Field label="Comment (optional)">
        <TextArea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Anything the requester or next approver should know"
        />
      </Field>
      <SignatureField value={sign} onChange={setSign} placeholder={myName} hasError={tried && missing} />
    </RequisitionDialog>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   Reject                                   */
/* -------------------------------------------------------------------------- */

export const RejectDialog = ({
  open,
  row,
  onClose,
  onReject,
}: {
  open: boolean;
  row: Row | null;
  onClose: () => void;
  onReject: (reason: string) => Promise<void>;
}) => {
  const [reason, setReason] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setTried(false);
    }
  }, [open]);

  if (!row) return null;
  const who = firstName(row.requester.name);
  const missing = !reason.trim();
  const go = async () => {
    setTried(true);
    if (missing) return;
    setBusy(true);
    try {
      await onReject(reason.trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <RequisitionDialog
      open={open}
      onClose={onClose}
      busy={busy}
      title={`Reject ${row.generated_id}?`}
      subtitle={`${row.requester.name} · ${money(row.total_amount, row.currency)}`}
      errorTitle="A reason is needed"
      errors={tried && missing ? [`Tell ${who} why, so they can fix it.`] : []}
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: "Reject requisition", tone: "danger", solid: true, onClick: go },
      ]}
    >
      <Points
        points={[
          "The requisition closes and no one after you sees it.",
          `${who} is notified with your reason and can revise it as a new draft.`,
        ]}
      />
      <Field label={`Reason (shared with ${who})`}>
        <TextArea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="What needs to change for this to be approved"
          hasError={tried && missing}
        />
      </Field>
    </RequisitionDialog>
  );
};
