import Button from "@/components/Button";
import { useFetch } from "@/CustomHooks/useFetch";
import {usePost} from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import InputDiv from "@/pages/HomePage/Components/reusable/InputDiv";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { showNotification } from "@/pages/HomePage/utils/helperFunctions";
import api from "@/utils/apiCalls";
import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useState from "react-usestateref";
import { AccessRight } from "../utils/settingsInterfaces";

const CreateAccess = () => {
  const navigate = useNavigate();
  const [name, setName, nameRef] = useState<string>("");
  const query = location.search;
  const params = new URLSearchParams(query);
  const id = params.get("access_id");
  const [data, setData] = useState<Record<string, string>>({
    Dashboard: "",
    Members: "",
    Events: "",
    Requests: "",
    Asset: "",
    Users: "",
    Positions: "",
    Departments: "",
    Access_rights: "",
  });
  const { data: accessLevel } = useFetch<{ data: { data: AccessRight } }>(
    api.fetch.fetchAnAccess,
    {
      id: id!,
    }
  );
  const {
    postData,
    loading,
    error,
    data: response,
  } = usePost(api.post.createAccessRight);
  const {
    loading: updateLoading,
    error: updateError,
    updateData,
  } = usePut(api.put.updateAccessRight);

  const displayedData = useMemo(
    () =>
      Object.entries(data).map(([name, accessLevel]) => ({
        name: name.replace(/_/g, " "),
        accessLevel,
      })),
    [data]
  );

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

  useEffect(() => {
    if (id) {
      setData((prev) => ({ ...prev, ...accessLevel?.data.data.permissions! }));
      setName(accessLevel?.data.data.name!);
    }
  }, [accessLevel, id]);
  const handleAccessLevelChange = (
    moduleName: string,
    newAccessLevel: string
  ) => {
    const module = moduleName.split(" ").join("_");
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
      const body = {
        name: nameRef.current,
        permissions: data,
      };
      if (id) {
        updateData(body);
      } else {
        postData(body);
      }
    }
  };

  return (
    <PageOutline>
      <PageHeader title={`${id ? "Update" : "Create"} Access Right`} />
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
          value={name}
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
          <Button
            value="Cancel"
            className="secondary"
            onClick={() => {
              navigate(-1);
            }}
          />
          <Button
            value="Save"
            className="primary"
            disabled={loading || !nameRef.current}
            onClick={handleSubmit}
          />
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
    { value: "Super_Admin", label: "Admin" },
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
            onChange={() => {}}
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
