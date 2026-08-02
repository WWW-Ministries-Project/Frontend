import * as Yup from "yup";
import type {
  PledgeAccountType,
  PledgeDetail,
  PledgeMutationPayload,
} from "@/utils/api/pledges/interface";

export interface PersonFormValue {
  isGuest: boolean;
  user_id: number | "";
  guest_name: string;
  guest_phone: string;
}

export interface PledgerFormValue extends PersonFormValue {
  id?: number;
  pledged_amount: number | "";
}

export interface GroupFormValue {
  id?: number;
  called_amount: number | "";
  label: string;
  pledgers: PledgerFormValue[];
}

export interface PledgeFormValues {
  id?: number;
  branch_id: number | "";
  event_id: number | "";
  title: string;
  target_amount: number | "";
  deadline: string;
  callers: PersonFormValue[];
  groups: GroupFormValue[];
  // controls whether groups are sent on edit (replacing pledgers wipes redemptions)
  editGroups: boolean;
  // Settlement account. On create these are required — the backend mints a
  // Paystack subaccount from them so members can redeem the pledge online. On
  // edit they are only sent when the account is actually being changed.
  account_type: PledgeAccountType;
  settlement_bank: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  editAccount: boolean;
}

export const CURRENCY = "GHS";

export const personLabel = (p: {
  user?: { name?: string } | null;
  guest_name?: string | null;
}): string => p.user?.name ?? p.guest_name ?? "Unknown";

export const formatMoney = (n: number): string =>
  new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    n ?? 0,
  );

export const emptyPerson = (): PersonFormValue => ({
  isGuest: false,
  user_id: "",
  guest_name: "",
  guest_phone: "",
});

export const emptyPledger = (called_amount: number | "" = ""): PledgerFormValue => ({
  ...emptyPerson(),
  pledged_amount: called_amount,
});

export const emptyGroup = (): GroupFormValue => ({
  called_amount: "",
  label: "",
  pledgers: [emptyPledger()],
});

const personSchema = Yup.object({
  isGuest: Yup.boolean(),
  user_id: Yup.mixed().when("isGuest", {
    is: false,
    then: (s) => s.required("Select a member"),
  }),
  guest_name: Yup.string().when("isGuest", {
    is: true,
    then: (s) => s.required("Guest name required"),
  }),
  guest_phone: Yup.string().when("isGuest", {
    is: true,
    then: (s) => s.required("Guest phone required"),
  }),
});

/**
 * The settlement account fields validate only when they are actually in play:
 * always on create, and on edit only once the user opts into changing the
 * account. `editAccount` carries that decision.
 */
const whenEditingAccount = <T extends Yup.AnySchema>(
  schema: T,
  message: string,
) =>
  Yup.mixed().when("editAccount", {
    is: true,
    then: () => schema.required(message),
    otherwise: () => Yup.mixed().notRequired(),
  });

export const pledgeSchema = Yup.object({
  account_type: Yup.string().oneOf(
    ["ghipss", "mobile_money"],
    "Select a valid account type",
  ),
  settlement_bank: whenEditingAccount(
    Yup.string().trim(),
    "Bank or provider is required",
  ),
  bank_name: whenEditingAccount(Yup.string().trim(), "Bank name is required"),
  account_number: whenEditingAccount(
    Yup.string()
      .trim()
      // excludeEmptyString so a blank field reports only "is required", rather
      // than that plus a format complaint about the empty string.
      .matches(/^[0-9]{5,20}$/, {
        message: "Account number must be 5 to 20 digits",
        excludeEmptyString: true,
      }),
    "Account number is required",
  ),
  account_name: whenEditingAccount(
    Yup.string().trim(),
    "Account name is required",
  ),
  event_id: Yup.mixed().required("Event is required"),
  title: Yup.string(),
  target_amount: Yup.number().nullable().min(0),
  deadline: Yup.string(),
  callers: Yup.array().of(personSchema),
  groups: Yup.array()
    .of(
      Yup.object({
        called_amount: Yup.number()
          .required("Called amount required")
          .positive("Must be greater than 0"),
        label: Yup.string(),
        pledgers: Yup.array()
          .of(
            personSchema.concat(
              Yup.object({
                pledged_amount: Yup.number()
                  .required("Amount required")
                  .positive("Must be greater than 0"),
              }),
            ),
          )
          .min(1, "Add at least one pledger"),
      }),
    )
    .min(1, "Add at least one group"),
});

const stripPerson = (p: PersonFormValue) => ({
  user_id: p.isGuest ? null : p.user_id === "" ? null : Number(p.user_id),
  guest_name: p.isGuest ? p.guest_name : null,
  guest_phone: p.isGuest ? p.guest_phone : null,
});

// Build the API payload. `mode` decides whether groups are included:
// on edit, groups are omitted unless the user opted to edit them (replacing
// groups wipes pledgers and their redemptions).
export const toPayload = (
  values: PledgeFormValues,
  mode: "create" | "edit",
): PledgeMutationPayload => {
  const payload: PledgeMutationPayload = {
    id: values.id,
    branch_id: values.branch_id,
    event_id: values.event_id,
    title: values.title || undefined,
    target_amount: values.target_amount === "" ? null : Number(values.target_amount),
    deadline: values.deadline || null,
    callers: (values.callers ?? []).map(stripPerson),
  };
  // Sent on create, and on edit only when the account is being changed —
  // resending it otherwise would make every meta edit hit Paystack.
  if (mode === "create" || values.editAccount) {
    payload.currency = CURRENCY;
    payload.account_type = values.account_type;
    payload.settlement_bank = values.settlement_bank;
    payload.bank_name = values.bank_name;
    payload.account_number = values.account_number.trim();
    payload.account_name = values.account_name.trim();
  }
  if (mode === "create" || values.editGroups) {
    payload.groups = (values.groups ?? []).map((g) => ({
      called_amount: Number(g.called_amount),
      label: g.label || null,
      pledgers: (g.pledgers ?? []).map((p) => ({
        ...stripPerson(p),
        pledged_amount: Number(p.pledged_amount),
      })),
    }));
  }
  return payload;
};

// Map a fetched pledge detail into editable form values.
export const detailToFormValues = (d: PledgeDetail): PledgeFormValues => ({
  id: d.id,
  branch_id: "",
  event_id: d.event?.id ?? "",
  title: d.title ?? "",
  target_amount: "",
  deadline: d.deadline ? d.deadline.slice(0, 10) : "",
  callers: (d.callers ?? []).map((c) => ({
    isGuest: !c.user,
    user_id: c.user?.id ?? "",
    guest_name: c.guest_name ?? "",
    guest_phone: c.guest_phone ?? "",
  })),
  groups: (d.groups ?? []).map((g) => ({
    id: g.id,
    called_amount: g.called_amount,
    label: g.label ?? "",
    pledgers: (g.pledgers ?? []).map((p) => ({
      id: p.id,
      isGuest: !p.user_id,
      user_id: p.user_id ?? "",
      guest_name: p.guest_name ?? "",
      guest_phone: p.guest_phone ?? "",
      pledged_amount: p.pledged_amount ?? "",
    })),
  })),
  editGroups: false,
  // The API never returns the account number, so the form starts blank and the
  // existing account is described read-only alongside it.
  account_type: (d.account_type as PledgeFormValues["account_type"]) ?? "ghipss",
  settlement_bank: "",
  bank_name: d.bank_name ?? "",
  account_number: "",
  account_name: d.account_name ?? "",
  editAccount: false,
});
