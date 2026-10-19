import {
  Field,
  FilterPanel,
  SelectInput,
  SelectOption,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";

import type { DirectoryFilters } from "./directory/directoryHelpers";

interface MembersFilterProps {
  values: DirectoryFilters;
  departmentOptions: SelectOption[];
  onChange: (name: keyof DirectoryFilters, value: string) => void;
  onReset: () => void;
}

const MEMBERSHIP_OPTIONS: SelectOption[] = [
  { value: "", label: "All membership types" },
  { value: "IN_HOUSE", label: "In person" },
  { value: "ONLINE", label: "Online" },
];

const ROLE_OPTIONS: SelectOption[] = [
  { value: "", label: "All members" },
  { value: "true", label: "Workers" },
  { value: "false", label: "Non-workers" },
];

const ACTIVITY_OPTIONS: SelectOption[] = [
  { value: "", label: "Active and inactive" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

const MembersFilter = ({
  values,
  departmentOptions,
  onChange,
  onReset,
}: MembersFilterProps) => {
  const fields: {
    name: keyof DirectoryFilters;
    label: string;
    options: SelectOption[];
  }[] = [
    { name: "membership_type", label: "Membership type", options: MEMBERSHIP_OPTIONS },
    { name: "is_user", label: "Ministry role", options: ROLE_OPTIONS },
    {
      name: "department_id",
      label: "Department",
      options: [{ value: "", label: "All departments" }, ...departmentOptions],
    },
    { name: "is_active", label: "Activity", options: ACTIVITY_OPTIONS },
  ];
  const hasFilters = fields.some((field) => Boolean(values[field.name]));

  return (
    <FilterPanel
      title="Refine members"
      helper="Combine filters to narrow the directory without losing the search term."
      onReset={onReset}
      resetDisabled={!hasFilters}
    >
      {fields.map((field) => (
        <Field key={field.name} label={field.label}>
          <SelectInput
            value={values[field.name]}
            options={field.options}
            onChange={(event) => onChange(field.name, event.target.value)}
          />
        </Field>
      ))}
    </FilterPanel>
  );
};

export default MembersFilter;
