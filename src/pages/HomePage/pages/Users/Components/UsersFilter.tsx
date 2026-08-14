import type { ISelectOption } from "@/pages/HomePage/utils/homeInterfaces";
import Filter from "@/pages/HomePage/Components/reusable/Filter";

interface UsersFilterProps {
  value: string;
  onChange: (name: string, value: string) => void;
}

const accountStatusOptions: ISelectOption[] = [
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

const UsersFilter = ({ value, onChange }: UsersFilterProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <Filter
        name="is_active"
        className="w-full"
        label="Account Status"
        placeholder="All statuses"
        options={accountStatusOptions}
        onChange={onChange}
        value={value}
      />
    </div>
  );
};

export default UsersFilter;
