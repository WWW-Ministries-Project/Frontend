import { Button } from "@/components";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { InputDiv } from "@/pages/HomePage/Components/reusable/InputDiv";
import {
  decodeQuery,
  showNotification,
} from "@/pages/HomePage/utils/helperFunctions";
import { api } from "@/utils/api/apiCalls";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useState from "react-usestateref";
import { ModuleAccessAccordion } from "../Components/ModuleAccessAccordion";
import { initialAccess } from "../utils/consts";
import { AccessState } from "../utils/settingsInterfaces";

export function ManageAccess() {
  const navigate = useNavigate();
  const [name, setName, nameRef] = useState<string>("");
  const query = location.search;
  const params = new URLSearchParams(query);
  const id = decodeQuery(params.get("access_id") || "");
  const [accessState, setAccessState] = useState<AccessState>(() => {
    const state: AccessState = {};
    initialAccess.forEach((module) => {
      state[module.name] = {
        topPermission: module.topPermission ?? "Can_View",
        access: module.access
          ? JSON.parse(JSON.stringify(module.access))
          : undefined,
      };
    });
    return state;
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

  const handleTopPermissionChange = (moduleName: string, value: string) => {
    setAccessState((prev) => ({
      ...prev,
      [moduleName]: {
        ...prev[moduleName],
        topPermission: value,
      },
    }));
  };

  const handleToggleChange = (
    moduleName: string,
    subModule: string,
    field: string,
    value: boolean
  ) => {
    setAccessState((prev) => ({
      ...prev,
      [moduleName]: {
        ...prev[moduleName],
        access: {
          ...prev[moduleName].access,
          [subModule]: {
            ...prev[moduleName].access?.[subModule],
            [field]: value,
          },
        },
      },
    }));
  };

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
    if (id && accessLevel?.data) {
      const { name: fetchedName, permissions } = accessLevel.data;

      setName(fetchedName || "");

      if (permissions && typeof permissions === "object") {
        //TODO once once BE is ready CHANGE returned data to A PROPER TYPE accessType
        // @ts-expect-error type assertion to AccessState needs to update BE
        const typedPermissions = permissions as AccessState;
        const newAccessState: AccessState = {};

        for (const [moduleName, moduleData] of Object.entries(
          typedPermissions
        )) {
          newAccessState[moduleName] = {
            topPermission: moduleData.topPermission || "Can_View",
            access: moduleData.access,
          };
        }

        setAccessState(newAccessState);
      }
    }
  }, [accessLevel]);

  const handleSubmit = () => {
    if (nameRef.current) {
      const body = {
        name: nameRef.current,
        id,
        permissions: accessState,
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
        <ModuleAccessAccordion
          onTopPermissionChange={handleTopPermissionChange}
          accessLevels={accessState}
          onAccessChange={handleToggleChange}
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
