import Filter from "@/pages/HomePage/Components/reusable/Filter";


//NOTE: name of filters should be == accessor key of column

const MembersFilter = ({
  onChange,
}: {
  onChange: (name: string, value: string) => void;
}) => {
  // const departments = useSettingsStore((state) => state.departments);
  // const departmentOptions = departments.map((department) => ({
  //   label: department.name,
  //   value: department.name,
  // }));
  const handleChange = function (name: string, value: string) {
    onChange(name, value);
  };
  return (
    <div>
      <div className={` w-full flex gap-2`}>
        <div className={` w-full flex flex-col gap-2`}>
          <span className="text-sm">Membership</span>
          <Filter
            name="membership_type"
            className="w-52"
            options={[
              { label: "All", value: "" },
              { label: "In House", value: "IN_HOUSE" },
              { label: "Online", value: "ONLINE" },
            ]}
            onChange={handleChange}
          />
        </div>
        <div className={` flex flex-col gap-2`}>
          <div className="text-sm">Ministry workers</div>
          <Filter
            name="is_user"
            className="w-52"
            options={[
              { label: "All", value: "" },
              { label: "Worker", value: "true" },
              { label: "Member", value: "false" },
            ]}
            onChange={handleChange}
          />
        </div>
        {/* <div className={` w-full flex flex-col gap-2`}>
          <span className="text-sm">Department</span>
          <Filter
            name="department_id"
            className="w-52"
            options={departmentOptions}
            onChange={handleChange}
          />
        </div> */}
      </div>
    </div>
  );
};

export default MembersFilter;
