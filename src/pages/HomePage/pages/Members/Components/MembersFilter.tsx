import type { ISelectOption } from "@/pages/HomePage/utils/homeInterfaces";
import Filter from "@/pages/HomePage/Components/reusable/Filter";

type MembersFilterValues = {
  membership_type?: string;
  is_user?: string;
  department_id?: string;
  status?: string;
  is_active?: string;
};

interface MembersFilterProps {
  onChange: (name: string, value: string) => void;
  values: MembersFilterValues;
  departmentOptions: ISelectOption[];
}

const membershipOptions: ISelectOption[] = [
  { label: "In Person", value: "IN_HOUSE" },
  { label: "Online", value: "ONLINE" },
];

const workerOptions: ISelectOption[] = [
  { label: "Workers", value: "true" },
  { label: "Non-workers", value: "false" },
];

const statusOptions: ISelectOption[] = [
  { label: "Unconfirmed", value: "UNCONFIRMED" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Functional Member", value: "MEMBER" },
];

const activeStateOptions: ISelectOption[] = [
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

const MembersFilter = ({
  onChange,
  values,
  departmentOptions,
}: MembersFilterProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <Filter
        name="membership_type"
        className="w-full"
        label="Membership Type"
        placeholder="All membership types"
        options={membershipOptions}
        onChange={onChange}
        value={values.membership_type ?? ""}
      />

      <Filter
        name="is_user"
        className="w-full"
        label="Ministry Role"
        placeholder="All members"
        options={workerOptions}
        onChange={onChange}
        value={values.is_user ?? ""}
      />

      <Filter
        name="department_id"
        className="w-full"
        label="Department"
        placeholder="All departments"
        options={departmentOptions}
        onChange={onChange}
        value={values.department_id ?? ""}
      />

      <Filter
        name="status"
        className="w-full"
        label="Membership Status"
        placeholder="All statuses"
        options={statusOptions}
        onChange={onChange}
        value={values.status ?? ""}
      />

      <Filter
        name="is_active"
        className="w-full"
        label="Activity"
        placeholder="Active and inactive"
        options={activeStateOptions}
        onChange={onChange}
        value={values.is_active ?? ""}
      />
    </div>
  );
};

export default MembersFilter;
