import Filter from "@/pages/HomePage/Components/reusable/Filter";
import useSettingsStore from "../../Settings/utils/settingsStore";

//TODO: get BE to return columns needed for filtering

const MembersFilter = ({onChange}:{onChange:(name: string, value: string) => void}) => {
    const departments = useSettingsStore((state) => state.departments);
    const departmentOptions = departments.map((department) => ({
      label: department.name,
      value: department.name,
    }));
    const handleChange = function (name: string, value: string) {
        onChange(name, value);
    }
  return (
    <div>
      <div className={` w-full flex gap-2`}>
        <div className={` w-full flex flex-col gap-2`}>
            <span className="text-sm">Membership</span>
        <Filter
          name="name"
          className="w-52"
          options={[
            { label: "All", value: "" },
            { label: "Member", value: "amena" },
            { label: "Visitor", value: "Visitor" },
          ]}
          onChange={handleChange}
        />
        </div>
        <div className={` flex flex-col gap-2`}>
        <div className="text-sm">Ministry workers</div>
        <Filter
          name="UserType"
          className="w-52"
          options={[
            { label: "All", value: "Amena" },
            { label: "Worker", value: "worker" },
            { label: "Member", value: "member" },
          ]}
          onChange={handleChange}
        />
        </div>
        <div className={` w-full flex flex-col gap-2`}>
        <span className="text-sm">Department</span>    
        <Filter
          name="department"
          className="w-52"
          options={departmentOptions}
          onChange={handleChange}
        />
        </div>
      </div>
    </div>
  );
};

export default MembersFilter;
