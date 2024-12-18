import Button from "@/components/Button";
import UsePost from "@/CustomHooks/usePost";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import InputDiv from "@/pages/HomePage/Components/reusable/InputDiv";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { showNotification } from "@/pages/HomePage/utils/helperFunctions";
import api from "@/utils/apiCalls";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useState from "react-usestateref";

const CreateAccess = () => {
  const navigate = useNavigate();
  const [, setName, nameRef] = useState<string>("");
  const [data, setData] = useState<Record<string, string>>({
    Dashboard: "Super_Admin",
    Members: "Can_View",
    Events: "Can_Manage",
    Requests: "",
    Asset: "Can_View",
    Users: "Can_View",
    Positions: "Can_View",
    Departments: "Can_View",
    Access_rights: "Super_Admin",
  });
  const {
    postData,
    loading,
    error,
    data: response,
  } = UsePost(api.post.createAccessRight);

  const displayedData = Object.entries(data).map(([name, accessLevel]) => ({
    name,
    accessLevel,
  }));
  const columns = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "accessLevel",
      header: "Access Level",
      cell: ({ row }: any) => (
        <span>
          <RadioGroup
            selectedValue={row.original.accessLevel}
            onChange={(val) => handleAccessLevelChange(row.original.name, val)}
            moduleName={row.original.name}
          />
        </span>
      ),
    },
  ];

  useEffect(() => {
    if (response) {
      showNotification("Access Right created successfully");
    }
    if (error) {
      showNotification("Something went wrong", "error");
    }
  }, [response, error]);
  const handleAccessLevelChange = (module: string, newAccessLevel: string) => {
    setData((prevData) => {
      const currentAccessLevel = prevData[module];
      return {
        ...prevData,
        [module]: currentAccessLevel === newAccessLevel ? "" : newAccessLevel,
      };
    });
  };

  const handleSubmit = () => {
    if (nameRef.current) {
      const body = { permissions:data, name: nameRef.current };
      postData(body);
    }
  };

  return (
    <PageOutline>
      <PageHeader title="Create Access Right" />
      <div className="text-lighterBlack">
        Fill in the form below with the rights this access should have
      </div>
      <section>
        <InputDiv
          label="Role"
          type="text"
          id="name"
          placeholder="Enter name of access"
          required={true}
          className="max-w-[450px] my-4"
          onChange={(_, val) => {
            setName(val + "");
          }}
        />
        <TableComponent
          data={displayedData}
          columns={columns}
          rowClass="even:bg-white odd:bg-[#F2F4F7]"
          className={"shadow-md"}
        />
        <div className="flex justify-end gap-x-2 mt-4">
          <Button value="Cancel" className="secondary" onClick={() => {navigate(-1)}} />
          <Button value="Save" className="primary" disabled={loading || !nameRef.current} onClick={handleSubmit} />
        </div>
      </section>
    </PageOutline>
  );
};

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  selectedValue: string;
  moduleName: string;
  onChange: (value: string) => void;
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  selectedValue,
  onChange,
  moduleName,
}) => {
  const options: RadioOption[] = [
    { value: "Can_View", label: "Can View" },
    { value: "Can_Manage", label: "Can Manage" },
    { value: "Super_Admin", label: "Super Admin" },
  ];

  const handleChange = (value: string) => {
    onChange(value);
  };

  return (
    <div className="flex items-center space-x-6">
      {options.map((option, index) => (
        <label
          key={option.value + index}
          className="flex items-center cursor-pointer"
        >
          <input
            type="radio"
            name={moduleName}
            value={selectedValue}
            checked={selectedValue === option.value}
            onClick={() => handleChange(option.value)}
            onChange={()=>{}}
            className="hidden peer"
          />
          <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center peer-checked:border-red-500 peer-checked:before:bg-red-500 peer-checked:before:w-3 peer-checked:before:h-3 peer-checked:before:rounded-full peer-checked:before:block"></div>
          <span className="ml-2 text-gray-600">{option.label}</span>
        </label>
      ))}
    </div>
  );
};

export default CreateAccess;
