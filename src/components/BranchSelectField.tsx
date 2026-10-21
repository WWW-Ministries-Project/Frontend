import { useEffect } from "react";
import clsx from "clsx";

import { useBranchFieldState } from "@/CustomHooks/useBranchFieldState";
import { FieldMessage } from "@/components/feedback";
import type { Branch } from "@/utils/api/settings/branchInterfaces";

const LockIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
    className="mt-px shrink-0"
  >
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

interface LockedBranchFieldProps {
  branch: Branch;
  reason: string;
  label?: string;
  id?: string;
  className?: string;
}

/** A read-only branch field with the reason it can't be changed beneath it. */
export function LockedBranchField({
  branch,
  reason,
  label = "Branch",
  id = "branch-locked-field",
  className,
}: LockedBranchFieldProps) {
  return (
    <div className={clsx("flex flex-col gap-1", className)}>
      <label htmlFor={id} className="text-sm font-medium text-primary">
        {label}
      </label>
      <input
        id={id}
        type="text"
        readOnly
        aria-readonly="true"
        aria-describedby={`${id}-reason`}
        value={branch.name}
        className="h-10 w-full cursor-default rounded-lg border border-lightGray bg-background px-3 text-sm text-primaryGray focus:outline-none"
      />
      <p id={`${id}-reason`} className="flex items-start gap-1.5 text-xs text-primaryGray">
        <LockIcon />
        <span>{reason}</span>
      </p>
    </div>
  );
}

interface BranchSelectFieldProps {
  value: number | "";
  onChange: (branchId: number | "") => void;
  required?: boolean;
  error?: string;
  className?: string;
  label?: string;
}

/**
 * The branch a record belongs to. A choice among the user's branches, or
 * read-only (and set) when the user's access or the top-bar branch fixes it.
 */
export function BranchSelectField({
  value,
  onChange,
  required,
  error,
  className,
  label = "Branch",
}: BranchSelectFieldProps) {
  const { options, lockedBranch, lockedReason } = useBranchFieldState();
  const lockedId = lockedBranch?.id;

  // Keep the form value in step with the fixed branch so it is submitted.
  useEffect(() => {
    if (lockedId && value !== lockedId) onChange(lockedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedId, value]);

  if (lockedBranch && lockedReason) {
    return (
      <LockedBranchField
        branch={lockedBranch}
        reason={lockedReason}
        label={label}
        className={className}
      />
    );
  }

  return (
    <div className={clsx("flex flex-col gap-1", className)}>
      <label htmlFor="branch-select-field" className="text-sm font-medium text-primary">
        {label}
        {required && <span className="text-error"> *</span>}
      </label>

      <select
        id="branch-select-field"
        name="branch_id"
        value={value}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "branch-select-field-error" : undefined}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === "" ? "" : Number(raw));
        }}
        className={clsx(
          "app-input",
          error && "border-error focus:border-error focus:ring-error/20"
        )}
      >
        <option value="">Select Branch</option>
        {options.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>

      {error && <FieldMessage id="branch-select-field-error">{error}</FieldMessage>}
    </div>
  );
}
