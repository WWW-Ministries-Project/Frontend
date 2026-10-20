import { useEffect, useMemo, useState } from "react";

import { notify } from "@/components/feedback";
import type { AssetDepartment, AssetRow, AssetStatus } from "@/utils/api/assets/interfaces";

import { FieldGrid, FullRow, ImageDropField } from "../../ChurchCommunication/ui/commUi";
import { Field, SelectInput, TextArea, TextInput } from "../../MembershipManagement/components/membershipUi";
import { Points, RequisitionDialog, SignatureField } from "../../Requisitions/components/requisitionUi";
import {
  CATEGORIES,
  STATUS,
  STATUS_ORDER,
  addDaysKey,
  dayOf,
  isOut,
  money,
  plural,
  todayKey,
} from "../utils/assetModel";
import { uploadAssetPhoto } from "../utils/useAssetsData";

const statusOptions = STATUS_ORDER.map((key) => ({ value: key, label: STATUS[key].label }));
const deptOptions = (departments: AssetDepartment[], placeholder = "Choose department") => [
  { value: "", label: placeholder },
  ...departments.map((d) => ({ value: String(d.id), label: d.name })),
];

/** Runs a dialog's save; keeps the dialog open (the API toast explains) when it fails. */
const useBusy = () => {
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
    } catch {
      // ApiErrorHandler has already raised a toast with the server's reason.
    } finally {
      setBusy(false);
    }
  };
  return { busy, run };
};

/* -------------------------------------------------------------------------- */
/*                               Add / edit asset                             */
/* -------------------------------------------------------------------------- */

type FormValues = {
  name: string;
  category: string;
  bought: string;
  supplier: string;
  price: string;
  status: AssetStatus;
  desc: string;
  dept: string;
  assigned: string;
  note: string;
  photo: string | null;
};

const formErrors = (v: FormValues) => {
  const e: string[] = [];
  if (!v.name.trim()) e.push("Give the asset a name.");
  if (!v.category) e.push("Choose a category.");
  if (!v.bought) e.push("Add the date it was bought.");
  if (!(Number(v.price) > 0)) e.push("Enter what it cost.");
  if (!v.desc.trim()) e.push("Add a short description so others can recognise it.");
  if (v.status === "ASSIGNED" && !v.dept) e.push("Choose the department it’s assigned to.");
  if (v.status === "ASSIGNED" && v.assigned && v.bought && v.assigned < v.bought) {
    e.push("It can’t be assigned before the date it was bought.");
  }
  return e;
};

export const AssetFormDialog = ({
  open,
  asset,
  departments,
  onClose,
  onSave,
}: {
  open: boolean;
  asset: AssetRow | null;
  departments: AssetDepartment[];
  onClose: () => void;
  onSave: (values: {
    name: string;
    category: string;
    date_purchased: string;
    supplier: string;
    price: number;
    status: AssetStatus;
    description: string;
    department_id: number | null;
    date_assigned: string | null;
    status_note?: string;
    photo: string | null;
  }) => Promise<unknown>;
}) => {
  const seed = (): FormValues =>
    asset
      ? {
          name: asset.name,
          category: asset.category,
          bought: dayOf(asset.date_purchased),
          supplier: asset.supplier || "",
          price: asset.price ? String(asset.price) : "",
          status: asset.status,
          desc: asset.description || "",
          dept: asset.department ? String(asset.department.id) : "",
          assigned: dayOf(asset.date_assigned) || todayKey(),
          note: asset.status_note || "",
          photo: asset.photo,
        }
      : {
          name: "",
          category: "",
          bought: todayKey(),
          supplier: "",
          price: "",
          status: "UNASSIGNED",
          desc: "",
          dept: "",
          assigned: todayKey(),
          note: "",
          photo: null,
        };
  const [v, setV] = useState<FormValues>(seed);
  const [tried, setTried] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { busy, run } = useBusy();

  useEffect(() => {
    if (open) {
      setV(seed());
      setTried(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, asset?.id]);

  const set = <K extends keyof FormValues>(key: K) => (value: FormValues[K]) => setV((prev) => ({ ...prev, [key]: value }));
  const errors = tried ? formErrors(v) : [];
  const bad = (cond: boolean) => tried && cond;
  const showDept = v.status === "ASSIGNED" || isOut(v.status);

  const takePhoto = async (file: File) => {
    setUploading(true);
    try {
      set("photo")(await uploadAssetPhoto(file));
    } catch (error) {
      notify.fromError(error, { title: "Couldn’t upload the photo" });
    }
    setUploading(false);
  };

  const submit = () => {
    if (formErrors(v).length) return setTried(true);
    void run(async () => {
      await onSave({
        name: v.name.trim(),
        category: v.category,
        date_purchased: v.bought,
        supplier: v.supplier.trim(),
        price: Number(v.price),
        status: v.status,
        description: v.desc.trim(),
        department_id: showDept && v.dept ? Number(v.dept) : null,
        date_assigned: v.status === "ASSIGNED" ? v.assigned || todayKey() : null,
        ...(isOut(v.status) ? { status_note: v.note.trim() } : {}),
        photo: v.photo,
      });
    });
  };

  return (
    <RequisitionDialog
      open={open}
      onClose={onClose}
      busy={busy || uploading}
      width={672}
      title={asset ? `Edit ${asset.name}` : "Add asset"}
      subtitle={asset ? `${asset.code} · changes are recorded in the history.` : "An asset ID is created when you save."}
      errorTitle={errors.length === 1 ? "Fix this before saving" : "Fix these before saving"}
      errors={errors}
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: asset ? "Save changes" : "Add asset", onClick: submit, tone: "primary" },
      ]}
    >
      <ImageDropField
        label="Photo"
        help="JPG or PNG up to 5MB."
        previewUrl={v.photo}
        onFile={(file) => void takePhoto(file)}
        onClear={() => set("photo")(null)}
        clearLabel="Remove photo"
        busy={uploading}
      />
      <FieldGrid>
        <Field label="Asset name">
          <TextInput
            value={v.name}
            onChange={(e) => set("name")(e.target.value)}
            placeholder="e.g. Wireless microphone set"
            hasError={bad(!v.name.trim())}
            maxLength={191}
          />
        </Field>
        <Field label="Category">
          <SelectInput
            value={v.category}
            onChange={(e) => set("category")(e.target.value)}
            options={[{ value: "", label: "Choose category" }, ...CATEGORIES.map((c) => ({ value: c.key, label: c.label }))]}
            hasError={bad(!v.category)}
          />
        </Field>
        <Field label="Asset ID">
          <TextInput value={asset ? asset.code : "Created on save"} disabled />
        </Field>
        <Field label="Date bought">
          <TextInput type="date" value={v.bought} max={todayKey()} onChange={(e) => set("bought")(e.target.value)} hasError={bad(!v.bought)} />
        </Field>
        <Field label="Bought from (supplier)">
          <TextInput value={v.supplier} onChange={(e) => set("supplier")(e.target.value)} placeholder="e.g. Musicland Accra" maxLength={191} />
        </Field>
        <Field label="Amount paid (GHS)">
          <TextInput
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={v.price}
            onChange={(e) => set("price")(e.target.value)}
            placeholder="0.00"
            hasError={bad(!(Number(v.price) > 0))}
          />
        </Field>
        <Field label="Status">
          <SelectInput value={v.status} onChange={(e) => set("status")(e.target.value as AssetStatus)} options={statusOptions} />
        </Field>
        {showDept && (
          <Field label={v.status === "ASSIGNED" ? "Assigned to" : "Last held by"}>
            <SelectInput
              value={v.dept}
              onChange={(e) => set("dept")(e.target.value)}
              options={deptOptions(departments, v.status === "ASSIGNED" ? "Choose department" : "Not assigned")}
              hasError={bad(v.status === "ASSIGNED" && !v.dept)}
            />
          </Field>
        )}
        {v.status === "ASSIGNED" && (
          <Field label="Date of assignment">
            <TextInput type="date" value={v.assigned} onChange={(e) => set("assigned")(e.target.value)} />
          </Field>
        )}
        {isOut(v.status) && (
          <FullRow>
            <Field label="What happened (optional)">
              <TextArea value={v.note} onChange={(e) => set("note")(e.target.value)} placeholder="The fault, who is repairing it, or where it was last seen" />
            </Field>
          </FullRow>
        )}
        <FullRow>
          <Field label="Description">
            <TextArea
              value={v.desc}
              onChange={(e) => set("desc")(e.target.value)}
              placeholder="Model, serial number, colour, where it’s kept"
              hasError={bad(!v.desc.trim())}
            />
          </Field>
        </FullRow>
      </FieldGrid>
    </RequisitionDialog>
  );
};

/* -------------------------------------------------------------------------- */
/*                                Change status                               */
/* -------------------------------------------------------------------------- */

const NOTE_REQUIRED: AssetStatus[] = ["NEEDS_REPAIR", "NOT_FIXABLE", "LOST_OR_STOLEN"];

export const StatusDialog = ({
  open,
  assets,
  initialStatus,
  departments,
  onClose,
  onSave,
}: {
  open: boolean;
  assets: AssetRow[];
  initialStatus?: AssetStatus | null;
  departments: AssetDepartment[];
  onClose: () => void;
  onSave: (values: { status: AssetStatus; department_id: number | null; date: string; note: string }) => Promise<unknown>;
}) => {
  const one = assets.length === 1 ? assets[0] : null;
  const [status, setStatus] = useState<AssetStatus>("ASSIGNED");
  const [dept, setDept] = useState("");
  const [date, setDate] = useState(todayKey());
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const { busy, run } = useBusy();

  useEffect(() => {
    if (!open) return;
    setStatus(initialStatus || one?.status || "ASSIGNED");
    setDept(one?.department ? String(one.department.id) : "");
    setDate(todayKey());
    setNote("");
    setTried(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const needNote = NOTE_REQUIRED.includes(status);
  const errs = [
    status === "ASSIGNED" && !dept && "Choose the department.",
    needNote && !note.trim() && "Add a note on what happened. It stays in the history.",
  ].filter(Boolean) as string[];

  const submit = () => {
    if (errs.length) return setTried(true);
    void run(() => onSave({ status, department_id: status === "ASSIGNED" ? Number(dept) : null, date, note: note.trim() }));
  };

  return (
    <RequisitionDialog
      open={open}
      onClose={onClose}
      busy={busy}
      width={520}
      title={one ? `Update ${one.name}` : `Update ${assets.length} assets`}
      subtitle={
        one
          ? `${one.code} · now ${STATUS[one.status].label.toLowerCase()}${one.department ? `, ${one.department.name}` : ""}`
          : "The same change is applied to every selected asset."
      }
      errorTitle="Almost there"
      errors={tried ? errs : []}
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: status === "ASSIGNED" ? "Assign" : "Save status", onClick: submit, tone: "primary" },
      ]}
    >
      <FieldGrid>
        <FullRow>
          <Field label="New status">
            <SelectInput value={status} onChange={(e) => setStatus(e.target.value as AssetStatus)} options={statusOptions} />
          </Field>
        </FullRow>
        {status === "ASSIGNED" && (
          <Field label="Assign to">
            <SelectInput value={dept} onChange={(e) => setDept(e.target.value)} options={deptOptions(departments)} hasError={tried && !dept} />
          </Field>
        )}
        <Field label={status === "LOST_OR_STOLEN" ? "Date noticed" : "Effective date"}>
          <TextInput type="date" value={date} max={todayKey()} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <FullRow>
          <Field label={needNote ? "What happened" : "Note (optional)"}>
            <TextArea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                status === "OUT_OF_REPAIRS"
                  ? "Who is repairing it and the fault"
                  : status === "LOST_OR_STOLEN"
                    ? "Where and when it was last seen"
                    : "Anything worth recording"
              }
              hasError={tried && needNote && !note.trim()}
            />
            <span className="text-xs text-[#6B7280]">Saved in the asset’s history.</span>
          </Field>
        </FullRow>
      </FieldGrid>
    </RequisitionDialog>
  );
};

/* -------------------------------------------------------------------------- */
/*                           Raise repair requisition                         */
/* -------------------------------------------------------------------------- */

export const RepairDialog = ({
  open,
  assets,
  skipped,
  departments,
  signerName,
  onClose,
  onSubmit,
}: {
  open: boolean;
  assets: AssetRow[];
  skipped: string[];
  departments: AssetDepartment[];
  signerName: string;
  onClose: () => void;
  onSubmit: (values: {
    estimates: Record<number, number>;
    needed_by: string;
    purpose: string;
    user_sign: string;
    fallback_department_id: number | null;
  }) => Promise<unknown>;
}) => {
  const [est, setEst] = useState<Record<number, string>>({});
  const [needed, setNeeded] = useState(addDaysKey(todayKey(), 7));
  const [why, setWhy] = useState("");
  const [sign, setSign] = useState("");
  const [fallback, setFallback] = useState("");
  const [tried, setTried] = useState(false);
  const { busy, run } = useBusy();

  useEffect(() => {
    if (!open) return;
    setEst({});
    setNeeded(addDaysKey(todayKey(), 7));
    setWhy(
      `Repair of ${assets.length === 1 ? `${assets[0].name} (${assets[0].code})` : `${assets.length} assets`} marked as needing repair. ` +
        assets.map((a) => `${a.name}: ${a.status_note || "fault not described"}`).join(" ")
    );
    setSign("");
    setFallback("");
    setTried(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const storeItems = assets.filter((a) => !a.department);
  const groups = useMemo(() => {
    const map = new Map<string, number>();
    assets.forEach((a) => {
      const name = a.department?.name || departments.find((d) => String(d.id) === fallback)?.name || "Department to choose";
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries());
  }, [assets, departments, fallback]);
  const total = assets.reduce((t, a) => t + (Number(est[a.id]) || 0), 0);

  const errs = [
    assets.some((a) => !(Number(est[a.id]) > 0)) && "Enter an estimated repair cost for every asset.",
    !why.trim() && "Say why the repair is needed.",
    !needed && "Add the date it’s needed by.",
    !sign.trim() && "Type your full name to sign.",
    storeItems.length > 0 && !fallback && "Choose which department raises the repair for items in the store.",
  ].filter(Boolean) as string[];

  const submit = () => {
    if (errs.length) return setTried(true);
    void run(() =>
      onSubmit({
        estimates: Object.fromEntries(assets.map((a) => [a.id, Number(est[a.id])])),
        needed_by: needed,
        purpose: why.trim(),
        user_sign: sign.trim(),
        fallback_department_id: fallback ? Number(fallback) : null,
      })
    );
  };

  return (
    <RequisitionDialog
      open={open}
      onClose={onClose}
      busy={busy}
      width={672}
      title="Raise repair requisition"
      subtitle={`${plural(assets.length, "asset")} · estimated total ${money(total)}`}
      errorTitle={errs.length === 1 ? "Fix this before submitting" : "Fix these before submitting"}
      errors={tried ? errs : []}
      footerLead={money(total)}
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: groups.length > 1 ? `Submit ${groups.length} requisitions` : "Submit requisition", onClick: submit, tone: "primary" },
      ]}
    >
      <div className="rounded-lg bg-[#F8F9FC] px-4 py-3">
        <Points
          points={[
            groups.length > 1
              ? `Creates ${groups.length} requisitions, one per department: ${groups.map(([n, c]) => `${n} (${c})`).join(", ")}.`
              : `Creates one requisition for ${groups[0]?.[0] ?? "the department"}.`,
            "Each goes through the usual approval chain for that department.",
            "Department, items, asset IDs and fault notes are filled in from the register.",
            ...(skipped.length ? [`Left out (not marked “Needs repair” or already has a requisition): ${skipped.join(", ")}.`] : []),
          ]}
        />
      </div>
      <FieldGrid>
        {assets.map((a) => (
          <FullRow key={a.id}>
            <Field label={`Estimated repair cost (GHS) · ${a.name} · ${a.code}`}>
              <TextInput
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={est[a.id] ?? ""}
                onChange={(e) => setEst((prev) => ({ ...prev, [a.id]: e.target.value }))}
                placeholder="0.00"
                hasError={tried && !(Number(est[a.id]) > 0)}
              />
              <span className="text-xs text-[#6B7280]">
                {a.department?.name || "Store"} · {a.status_note || "No fault note"}
              </span>
            </Field>
          </FullRow>
        ))}
        {storeItems.length > 0 && (
          <Field label="Department raising it for store items">
            <SelectInput value={fallback} onChange={(e) => setFallback(e.target.value)} options={deptOptions(departments)} hasError={tried && !fallback} />
          </Field>
        )}
        <Field label="Needed by">
          <TextInput type="date" value={needed} min={todayKey()} onChange={(e) => setNeeded(e.target.value)} hasError={tried && !needed} />
        </Field>
        <FullRow>
          <Field label="Why it’s needed">
            <TextArea value={why} onChange={(e) => setWhy(e.target.value)} hasError={tried && !why.trim()} />
            <span className="text-xs text-[#6B7280]">Pre-filled from the fault notes. Approvers read this first.</span>
          </Field>
        </FullRow>
        <FullRow>
          <SignatureField value={sign} onChange={setSign} placeholder={signerName || "Your full name"} hasError={tried && !sign.trim()} />
        </FullRow>
      </FieldGrid>
    </RequisitionDialog>
  );
};
