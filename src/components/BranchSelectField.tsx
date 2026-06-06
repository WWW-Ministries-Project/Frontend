import { ALL_BRANCHES, useBranchStore } from "@/store/useBranchStore";
import clsx from "clsx";

interface BranchSelectFieldProps {
  value: number | "";
  onChange: (branchId: number | "") => void;
  required?: boolean;
  error?: string;
  className?: string;
}

export function BranchSelectField({
  value,
  onChange,
  required,
  error,
  className,
}: BranchSelectFieldProps) {
  const { activeBranchId, branches } = useBranchStore();

  if (activeBranchId !== ALL_BRANCHES) {
    return null;
  }

  return (
    <div className={clsx("flex flex-col gap-1", className)}>
      <label htmlFor="branch-select-field" className="text-sm font-medium text-primary">
        Branch{required && <span className="text-error"> *</span>}
      </label>

      <select
        id="branch-select-field"
        name="branch_id"
        value={value}
        required={required}
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
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>

      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
