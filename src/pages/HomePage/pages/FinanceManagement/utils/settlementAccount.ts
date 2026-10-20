import { useMemo } from "react";

import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils/api/apiCalls";
import type { GivingAccountType, PaystackBank } from "@/utils/api/finance/interface";

export interface AccountDraft {
  account_type: GivingAccountType;
  settlement_bank: string;
  account_number: string;
  account_name: string;
  /** true once Paystack confirmed the name, or the person typed it after a miss */
  verified: boolean;
  /** Paystack couldn't resolve it, so the name is typed by hand */
  manual: boolean;
}

export const EMPTY_ACCOUNT: AccountDraft = {
  account_type: "ghipss",
  settlement_bank: "",
  account_number: "",
  account_name: "",
  verified: false,
  manual: false,
};

const BANKS_QUERY = { currency: "GHS" };

export const accountNumberOk = (v: string) => /^\d{10,13}$/.test(v.replace(/\s/g, ""));

/** Problems with an account draft, worded for the error summary. */
export const accountErrors = (a: AccountDraft): string[] => {
  const out: string[] = [];
  if (!a.settlement_bank) out.push("Choose the bank or mobile money provider.");
  if (!accountNumberOk(a.account_number))
    out.push(a.account_type === "ghipss" ? "Enter a 10–13 digit account number." : "Enter the 10-digit mobile money number.");
  if (!a.account_name.trim()) out.push("Verify the account so we can confirm the account name.");
  return out;
};

export const useBanks = () => {
  const res = useFetch(api.fetch.fetchPaystackBanks, BANKS_QUERY, false, { silent: true });
  return useMemo<PaystackBank[]>(() => {
    const list = res.data?.data;
    return Array.isArray(list) ? list : [];
  }, [res.data]);
};
