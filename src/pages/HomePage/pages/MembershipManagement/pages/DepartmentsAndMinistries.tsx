import { FormHeader, FormLayout } from "@/components/ui";
import { Button, ProfilePicture } from "@/components";
import { Badge } from "@/components/Badge";
import EmptyState from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { SearchBar } from "@/components/SearchBar";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { useDelete } from "@/CustomHooks/useDelete";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { InputDiv } from "@/pages/HomePage/Components/reusable/InputDiv";
import { SelectField } from "@/pages/HomePage/Components/reusable/SelectField";
import {
  encodeQuery,
  showDeleteDialog,
  showNotification,
} from "@/pages/HomePage/utils";
import useSettingsStore from "@/pages/HomePage/pages/Settings/utils/settingsStore";
import { useStore } from "@/store/useStore";
import { useUserStore } from "@/store/userStore";
import { api, DepartmentType, relativePath } from "@/utils";
import { QueryType } from "@/utils/interfaces";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

type MembershipOutletContext = {
  refetchDepartments: (query?: QueryType) => Promise<unknown>;
};

type DepartmentFormState = {
  id?: number;
  name: string;
  description: string;
  department_head?: number;
};

const EMPTY_FORM_STATE: DepartmentFormState = {
  name: "",
  description: "",
  department_head: undefined,
};

const resolveDepartmentFormState = (
  department?: DepartmentType
): DepartmentFormState => {
  if (!department) {
    return EMPTY_FORM_STATE;
  }

  return {
    id: department.id,
    name: department.name,
    description: department.description ?? "",
    department_head: department.department_head_info?.id ?? department.department_head,
  };
};

const getDepartmentHeadName = (department: DepartmentType) =>
  department.department_head_info?.name?.trim() || "Head not assigned";

const DepartmentFormModal = ({
  open,
  isEditMode,
  formState,
  memberOptions,
  loading,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  isEditMode: boolean;
  formState: DepartmentFormState;
  memberOptions: { label: string; value: string }[];
  loading: boolean;
  onChange: (name: keyof DepartmentFormState, value: string | number) => void;
  onClose: () => void;
  onSubmit: () => void;
}) => {
  return (
    <Modal open={open} persist={false} onClose={onClose}>
      <FormHeader>
        <div>
          <p className="text-lg font-semibold">
            {isEditMode ? "Edit Department / Ministry" : "Create Department / Ministry"}
          </p>
          <p className="mt-1 text-sm text-white/80">
            Set the department name, assign a head, and add a short description for members.
          </p>
        </div>
      </FormHeader>

      <div className="space-y-6 p-6">
        <FormLayout $columns={1}>
          <InputDiv
            id="name"
            label="Department / Ministry Name"
            value={formState.name}
            placeholder="e.g. Ushering Ministry"
            onChange={(name, value) =>
              onChange(name as keyof DepartmentFormState, value)
            }
          />

          <SelectField
            id="department_head"
            label="Department Head"
            value={formState.department_head}
            options={memberOptions}
            placeholder="Select member"
            searchable
            onChange={(name, value) =>
              onChange(
                name as keyof DepartmentFormState,
                value ? Number(value) : ""
              )
            }
            helperText="Optional. This can be updated later from the membership area."
          />

          <InputDiv
            id="description"
            type="textarea"
            label="Description"
            value={formState.description}
            placeholder="Describe the department's purpose or responsibilities."
            onChange={(name, value) =>
              onChange(name as keyof DepartmentFormState, value)
            }
          />
        </FormLayout>

        <div className="flex flex-wrap justify-end gap-3 border-t border-lightGray pt-4">
          <Button value="Cancel" variant="ghost" onClick={onClose} />
          <Button
            value={isEditMode ? "Save Changes" : "Create Department"}
            onClick={onSubmit}
            loading={loading}
            disabled={!formState.name.trim()}
          />
        </div>
      </div>
    </Modal>
  );
};

export const DepartmentsAndMinistries = () => {
  const navigate = useNavigate();
  const { canManage } = useAccessControl();
  const canManageDepartments = canManage("Departments");
  const { refetchDepartments } =
    useOutletContext<MembershipOutletContext>();
  const userId = useUserStore((state) => state.id);
  const departments = useSettingsStore((state) => state.departments);
  const departmentTotal = useSettingsStore((state) => state.departmentTotal);
  const membersOptions = useStore((state) => state.membersOptions);

  const [searchValue, setSearchValue] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formState, setFormState] = useState<DepartmentFormState>(
    EMPTY_FORM_STATE
  );

  const {
    postData: createDepartment,
    data: createdDepartment,
    error: createDepartmentError,
    loading: createDepartmentLoading,
  } = usePost(api.post.createDepartment);
  const {
    updateData: updateDepartment,
    data: updatedDepartment,
    error: updateDepartmentError,
    loading: updateDepartmentLoading,
  } = usePut(api.put.updateDepartment);
  const {
    executeDelete: removeDepartment,
    success: deleteDepartmentSuccess,
    error: deleteDepartmentError,
    loading: deleteDepartmentLoading,
  } = useDelete(api.delete.deleteDepartment);

  useEffect(() => {
    if (departments.length === 0) {
      void refetchDepartments();
    }
  }, [departments.length, refetchDepartments]);

  useEffect(() => {
    if (!createdDepartment && !updatedDepartment) {
      return;
    }

    showNotification(
      isEditMode
        ? "Department updated successfully."
        : "Department created successfully.",
      "success"
    );
    void refetchDepartments();
    setIsModalOpen(false);
    setIsEditMode(false);
    setFormState(EMPTY_FORM_STATE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdDepartment, updatedDepartment, refetchDepartments]);

  useEffect(() => {
    if (!createDepartmentError && !updateDepartmentError) {
      return;
    }

    showNotification(
      createDepartmentError?.message ||
        updateDepartmentError?.message ||
        "Unable to save department.",
      "error"
    );
  }, [createDepartmentError, updateDepartmentError]);

  useEffect(() => {
    if (!deleteDepartmentSuccess) {
      return;
    }

    showNotification("Department deleted successfully.", "success");
    void refetchDepartments();
  }, [deleteDepartmentSuccess, refetchDepartments]);

  useEffect(() => {
    if (!deleteDepartmentError) {
      return;
    }

    showNotification(
      deleteDepartmentError.message || "Unable to delete department.",
      "error"
    );
  }, [deleteDepartmentError]);

  const filteredDepartments = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) {
      return departments;
    }

    return departments.filter((department) => {
      const fields = [
        department.name,
        department.description,
        department.department_head_info?.name,
      ];

      return fields.some((field) =>
        field?.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [departments, searchValue]);

  const pageStats = useMemo(
    () => [
      {
        label: "Departments",
        value: String(departmentTotal || departments.length),
      },
      {
        label: "Heads Assigned",
        value: String(
          departments.filter((department) => department.department_head_info?.name)
            .length
        ),
      },
      {
        label: "Needs Head",
        value: String(
          departments.filter((department) => !department.department_head_info?.name)
            .length
        ),
      },
    ],
    [departmentTotal, departments]
  );

  const handleFormChange = useCallback(
    (name: keyof DepartmentFormState, value: string | number) => {
      setFormState((prev) => ({
        ...prev,
        [name]:
          name === "department_head"
            ? value === ""
              ? undefined
              : Number(value)
            : value,
      }));
    },
    []
  );

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setFormState(EMPTY_FORM_STATE);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (department: DepartmentType) => {
    setIsEditMode(true);
    setFormState(resolveDepartmentFormState(department));
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setFormState(EMPTY_FORM_STATE);
  };

  const handleSubmit = () => {
    const payload = {
      ...formState,
      created_by: userId,
      name: formState.name.trim(),
      description: formState.description.trim(),
    };

    if (isEditMode) {
      void updateDepartment(payload);
      return;
    }

    void createDepartment(payload);
  };

  const handleDelete = (department: DepartmentType) => {
    showDeleteDialog(department, (id) => {
      void removeDepartment({ id: String(id) });
    });
  };

  const handleOpenDepartment = (departmentId: number) => {
    navigate(
      `${relativePath.home.main}/${relativePath.home.membership.main}/${relativePath.home.membership.departments.main}/${encodeQuery(
        departmentId
      )}`
    );
  };

  return (
    <PageOutline
      crumbs={[
        { label: "Home", link: relativePath.home.main },
        { label: "Membership", link: `${relativePath.home.main}/${relativePath.home.membership.main}` },
        { label: "Departments and Ministries" },
      ]}
    >
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[1.75rem] bg-primary px-6 py-7 text-white shadow-lg">
          <div className="absolute -right-10 top-0 h-48 w-48 rounded-full bg-secondary/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-36 w-36 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl space-y-2">
                <p className="text-xs uppercase tracking-[0.24em] text-white/70">
                  Membership
                </p>
                <h1 className="text-3xl font-semibold">
                  Departments and Ministries
                </h1>
                <p className="max-w-2xl text-sm text-white/80 md:text-base">
                  Move department management closer to membership operations, then
                  open any department to see the people serving in it.
                </p>
              </div>

              {canManageDepartments && (
                <Button
                  value="New Department"
                  onClick={handleOpenCreateModal}
                  className="bg-white text-primary hover:bg-white/90"
                />
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {pageStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-white/65">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="app-card space-y-4 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-primary">
                Department Directory
              </h2>
              <p className="text-sm text-primaryGray">
                Search the ministry structure and jump into a department&apos;s member list.
              </p>
            </div>

            <div className="w-full md:max-w-md">
              <SearchBar
                id="department-search"
                placeholder="Search departments or heads"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {filteredDepartments.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredDepartments.map((department) => (
                <article
                  key={department.id}
                  className="app-card flex h-full flex-col justify-between rounded-2xl border border-lightGray/80 p-5 shadow-none"
                >
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.16em] text-primaryGray">
                          Department / Ministry
                        </p>
                        <h3 className="text-xl font-semibold text-primary">
                          {department.name}
                        </h3>
                      </div>

                      <Badge
                        className={`px-3 py-1 text-xs ${
                          department.department_head_info?.name
                            ? "border-success/20 bg-success/10 text-success"
                            : "border-warning/20 bg-warning/10 text-warning"
                        }`}
                      >
                        {department.department_head_info?.name
                          ? "Head assigned"
                          : "Needs head"}
                      </Badge>
                    </div>

                    <p className="min-h-[72px] text-sm leading-6 text-primaryGray">
                      {department.description?.trim() ||
                        "No description added yet for this department or ministry."}
                    </p>

                    <div className="rounded-2xl border border-lightGray/70 bg-lightGray/20 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-primaryGray">
                        Department Head
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <ProfilePicture
                          className="h-11 w-11 rounded-full border border-lightGray bg-white"
                          textClass="text-sm font-semibold text-primary"
                          alt={`${department.name} department head`}
                          name={getDepartmentHeadName(department)}
                        />
                        <div>
                          <p className="font-medium text-primary">
                            {getDepartmentHeadName(department)}
                          </p>
                          <p className="text-sm text-primaryGray">
                            {typeof department.member_count === "number"
                              ? `${department.member_count} member${
                                  department.member_count === 1 ? "" : "s"
                                }`
                              : "Member list available on details page"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <Button
                      value="Open Directory"
                      variant="secondary"
                      onClick={() => handleOpenDepartment(department.id)}
                      className="min-w-[10rem]"
                    />

                    {canManageDepartments && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(department)}
                          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-lightGray px-4 py-2 text-sm font-medium text-primary transition hover:border-primary/30 hover:bg-primary/5"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(department)}
                          disabled={deleteDepartmentLoading}
                          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-error/25 px-4 py-2 text-sm font-medium text-error transition hover:bg-error/5 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              scope="section"
              msg="No departments found"
              description={
                searchValue.trim()
                  ? "Try a different search term."
                  : "Create a department or ministry to get started."
              }
            />
          )}
        </section>
      </div>

      <DepartmentFormModal
        open={isModalOpen}
        isEditMode={isEditMode}
        formState={formState}
        memberOptions={membersOptions}
        loading={createDepartmentLoading || updateDepartmentLoading}
        onChange={handleFormChange}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      />
    </PageOutline>
  );
};

export default DepartmentsAndMinistries;
