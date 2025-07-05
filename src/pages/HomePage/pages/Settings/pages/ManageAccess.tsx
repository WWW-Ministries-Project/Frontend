import { Button } from "@/components";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { InputDiv } from "@/pages/HomePage/Components/reusable/InputDiv";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import {
  decodeQuery,
  showNotification,
} from "@/pages/HomePage/utils/helperFunctions";
import { api } from "@/utils/api/apiCalls";
import { ColumnDef } from "@tanstack/react-table";
import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useState from "react-usestateref";

export function ManageAccess() {
  const navigate = useNavigate();
  const [name, setName, nameRef] = useState<string>("");
  const query = location.search;
  const params = new URLSearchParams(query);
  const id = decodeQuery(params.get("access_id") || "");
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
    Life_Center: "",
    Visitors:""
  });
  const { data: accessLevel, refetch } = useFetch(
    api.fetch.fetchAnAccess,
    {
      id: id!,
    },
    true
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
    data: updatedData,
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

  const columns: ColumnDef<(typeof displayedData)[0]>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "accessLevel",
      header: "Access Level",
      cell: ({ row }) => (
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
      navigate("/home/settings/access-rights");
    }
    if (updatedData) {
      showNotification("Access Right updated successfully");
      navigate("/home/settings/access-rights");
    }
    if (error || updateError) {
      showNotification("Something went wrong", "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response, error, updateError]);

  useEffect(() => {
    if (id) {
      refetch();
    }
  }, [id]);
  useEffect(() => {
    if (id) {
      setData((prev) =>
        accessLevel?.data.permissions
          ? { ...prev, ...accessLevel.data.permissions! }
          : prev
      );
      setName((prev) =>
        accessLevel?.data.name ? accessLevel.data.name : prev
      );
    }
  }, [accessLevel]);
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
        id,
        permissions: data,
      };
      if (id) {
        updateData(body, { id });
      } else {
        postData(body);
      }
    }
  };

  return (
    <PageOutline className="">
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
            variant="secondary"
            onClick={() => {
              navigate(-1);
            }}
          />
          <Button
            value="Save"
            variant="primary"
            disabled={loading || !nameRef.current || updateLoading}
            loading={loading || updateLoading}
            onClick={handleSubmit}
          />
        </div>
      </section>
    </PageOutline>
  );
}

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
