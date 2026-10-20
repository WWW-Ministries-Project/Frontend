import { useState } from "react";

import { api } from "@/utils/api/apiCalls";
import type { GivingAccountType, PaystackBank } from "@/utils/api/finance/interface";

import { FullRow } from "../../ChurchCommunication/ui/commUi";
import { Field, SelectInput, TextInput, UiButton } from "../../MembershipManagement/components/membershipUi";
import { type AccountDraft, accountNumberOk } from "../utils/settlementAccount";
import { Hint } from "./financeUi";

/**
 * Account type, provider, number and a Paystack name check. Paystack's lookup
 * has patchy coverage in Ghana, so a miss lets the person type the name.
 */
export const SettlementAccountFields = ({
  value,
  onChange,
  tried,
  banks,
}: {
  value: AccountDraft;
  onChange: (next: AccountDraft) => void;
  tried: boolean;
  banks: PaystackBank[];
}) => {
  const [checking, setChecking] = useState(false);
  const options = banks
    .filter((b) => (value.account_type === "mobile_money" ? b.type === "mobile_money" : b.type !== "mobile_money"))
    .map((b) => ({ value: b.code, label: b.name }));

  const reset = (patch: Partial<AccountDraft>) =>
    onChange({ ...value, ...patch, verified: false, manual: false, account_name: "" });

  const verify = async () => {
    if (!value.settlement_bank || !accountNumberOk(value.account_number)) return;
    setChecking(true);
    try {
      const res = await api.fetch.resolveBankAccount({
        account_number: value.account_number.replace(/\s/g, ""),
        bank_code: value.settlement_bank,
      });
      const name = res?.data?.account_name;
      if (name) onChange({ ...value, account_name: name, verified: true, manual: false });
      else onChange({ ...value, verified: false, manual: true });
    } catch {
      onChange({ ...value, verified: false, manual: true });
    } finally {
      setChecking(false);
    }
  };

  const numberBad = tried && !accountNumberOk(value.account_number);
  const canVerify = Boolean(value.settlement_bank) && accountNumberOk(value.account_number);

  return (
    <>
      <Field label="Account type">
        <SelectInput
          value={value.account_type}
          onChange={(e) => reset({ account_type: e.target.value as GivingAccountType, settlement_bank: "" })}
          options={[
            { value: "ghipss", label: "Bank account" },
            { value: "mobile_money", label: "Mobile money" },
          ]}
        />
      </Field>
      <Field label={value.account_type === "ghipss" ? "Bank" : "Provider"}>
        <SelectInput
          value={value.settlement_bank}
          hasError={tried && !value.settlement_bank}
          onChange={(e) => reset({ settlement_bank: e.target.value })}
          options={[{ value: "", label: banks.length ? "Choose" : "Loading…" }, ...options]}
        />
      </Field>
      <Field label={value.account_type === "ghipss" ? "Account number" : "Mobile money number"}>
        <TextInput
          inputMode="numeric"
          value={value.account_number}
          hasError={numberBad}
          placeholder={value.account_type === "ghipss" ? "1021004471" : "0244123908"}
          onChange={(e) => reset({ account_number: e.target.value })}
        />
      </Field>
      <FullRow>
        <div className="flex flex-col gap-1">
          {value.manual ? (
            <Field label="Account name">
              <TextInput
                value={value.account_name}
                hasError={tried && !value.account_name.trim()}
                placeholder="Exactly as the bank has it"
                onChange={(e) => onChange({ ...value, account_name: e.target.value, verified: Boolean(e.target.value.trim()) })}
              />
            </Field>
          ) : (
            <UiButton className="self-start" disabled={!canVerify || checking} onClick={() => void verify()}>
              {checking ? "Checking…" : value.verified ? `✓ Verified · ${value.account_name}` : "Verify account"}
            </UiButton>
          )}
          <Hint tone={value.verified && !value.manual ? "success" : tried && !value.account_name.trim() ? "danger" : "muted"}>
            {value.manual
              ? "Paystack couldn’t confirm this account. Type the account name exactly as the bank has it."
              : value.verified
                ? "Paystack confirmed this account name."
                : "We check the account with Paystack before money can be paid into it."}
          </Hint>
        </div>
      </FullRow>
    </>
  );
};
