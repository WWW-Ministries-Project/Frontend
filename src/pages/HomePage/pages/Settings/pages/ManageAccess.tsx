import { Button } from "@/components";
import MultiSelect from "@/components/MultiSelect";
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
import { useStore } from "@/store/useStore";
import { api } from "@/utils/api/apiCalls";
import {
  ACCESS_LEVEL_DOMAINS,
  createDefaultPermissionMatrix,
  ensureRequiredPermissionKeys,
  EXCLUSION_SUPPORTED_DOMAINS,
  ExclusionsMap,
  normalizePermissionPayload,
  PermissionDomain,
  PermissionMap,
  PermissionValue,
} from "@/utils/accessControl";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ACCESS_OPTIONS: Array<{
  value: PermissionValue;
  label: string;
  chipClass: string;
}> = [
  {
    value: "No_Access",
    label: "No Access",
    chipClass: "border border-lightGray bg-gray-100 text-primary",
  },
  {
    value: "Can_View",
    label: "View",
    chipClass: "border border-primary/15 bg-primary/10 text-primary",
  },
  {
    value: "Can_Manage",
    label: "Manage",
    chipClass: "border border-secondary/20 bg-secondary/10 text-secondary",
  },
  {
    value: "Super_Admin",
    label: "Admin",
    chipClass: "border border-accent/20 bg-accent/10 text-accent",
  },
];

const isExclusionEnabled = (domain: PermissionDomain) =>
  EXCLUSION_SUPPORTED_DOMAINS.includes(domain);

const createManagerPreset = () => {
  const preset = createDefaultPermissionMatrix("Can_View");

  const managedDomains: PermissionDomain[] = [
    "Members",
    "Visitors",
    "Appointments",
    "Events",
    "Asset",
    "Requisition",
    "Program",
    "Life Center",
    "Marketplace",
    "Financials",
    "School_of_ministry",
  ];

  managedDomains.forEach((domain) => {
    preset[domain] = "Can_Manage";
  });

  return preset;
};

const createAdminPreset = () => createDefaultPermissionMatrix("Super_Admin");

const PRESETS: Array<{
  key: string;
  title: string;
  subtitle: string;
  factory: () => Record<PermissionDomain, PermissionValue>;
}> = [
  {
    key: "observer",
    title: "Read-Only Assistant",
    subtitle: "Safe visibility across modules with no write actions",
    factory: () => createDefaultPermissionMatrix("Can_View"),
  },
  {
    key: "manager",
    title: "Team Manager",
    subtitle: "Full operational control for day-to-day team execution",
    factory: createManagerPreset,
  },
  {
    key: "admin",
    title: "Platform Admin",
    subtitle: "Complete system control across all modules",
    factory: createAdminPreset,
  },
];

export function ManageAccess() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const query = useMemo(() => new URLSearchParams(search), [search]);
  const id = decodeQuery(query.get("access_id") || "");

  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<
    Record<PermissionDomain, PermissionValue>
  >(createDefaultPermissionMatrix("Can_View"));
  const [exclusionSelections, setExclusionSelections] = useState<
    Record<PermissionDomain, string[]>
  >({
    Members: [],
    Appointments: [],
  } as Record<PermissionDomain, string[]>);

  const membersOptions = useStore((state) => state.membersOptions);
  const setMemberOptions = useStore((state) => state.setMemberOptions);

  const { data: membersOptionsData } = useFetch(
    api.fetch.fetchMembersForOptions,
    undefined,
    membersOptions.length > 0
  );

  const { data: accessLevel, refetch } = useFetch(
    api.fetch.fetchAnAccess,
    id ? { id } : undefined,
    !id
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

  const groupedDomains = useMemo(() => {
    return ACCESS_LEVEL_DOMAINS.reduce<
      Record<"People" | "Operations" | "Engagement" | "Administration", typeof ACCESS_LEVEL_DOMAINS>
    >(
      (acc, module) => {
        acc[module.group] = [...acc[module.group], module];
        return acc;
      },
      {
        People: [],
        Operations: [],
        Engagement: [],
        Administration: [],
      }
    );
  }, []);

  const summary = useMemo(() => {
    const values = Object.values(permissions);
    return {
      noAccess: values.filter((value) => value === "No_Access").length,
      view: values.filter((value) => value === "Can_View").length,
      manage: values.filter((value) => value === "Can_Manage").length,
      admin: values.filter((value) => value === "Super_Admin").length,
    };
  }, [permissions]);

  const exclusionMemberOptions = useMemo(
    () =>
      membersOptions.map((member) => ({
        label: member.label,
        value: String(member.value),
      })),
    [membersOptions]
  );

  useEffect(() => {
    if (membersOptionsData?.data?.length) {
      setMemberOptions(membersOptionsData.data);
    }
  }, [membersOptionsData, setMemberOptions]);

  useEffect(() => {
    if (!id) return;
    refetch();
  }, [id, refetch]);

  useEffect(() => {
    if (!id || !accessLevel?.data) return;

    const normalizedPermissions = normalizePermissionPayload(
      (accessLevel.data.permissions || {}) as PermissionMap
    );
    const nextPermissions = createDefaultPermissionMatrix("Can_View");

    ACCESS_LEVEL_DOMAINS.forEach(({ key }) => {
      const value = normalizedPermissions[key];
      if (
        value === "No_Access" ||
        value === "Can_View" ||
        value === "Can_Manage" ||
        value === "Super_Admin"
      ) {
        nextPermissions[key] = value;
      }
    });

    const exclusions = (normalizedPermissions.Exclusions || {}) as ExclusionsMap;
    const nextExclusions = {
      Members: (exclusions.Members || []).map(String),
      Appointments: (exclusions.Appointments || []).map(String),
    } as Record<PermissionDomain, string[]>;

    setPermissions(nextPermissions);
    setName(accessLevel.data.name || "");
    setExclusionSelections((prev) => ({
      ...prev,
      ...nextExclusions,
    }));
  }, [accessLevel, id]);

  useEffect(() => {
    if (response) {
      showNotification("Access level created successfully", "success");
      navigate("/home/settings/access-rights");
    }
  }, [navigate, response]);

  useEffect(() => {
    if (updatedData) {
      showNotification("Access level updated successfully", "success");
      navigate("/home/settings/access-rights");
    }
  }, [navigate, updatedData]);

  useEffect(() => {
    if (error || updateError) {
      const message =
        error?.message || updateError?.message || "Something went wrong";
      showNotification(message, "error");
    }
  }, [error, updateError]);

  const applyPreset = (
    factory: () => Record<PermissionDomain, PermissionValue>
  ) => {
    setPermissions(factory());
  };

  const handlePermissionChange = (
    domain: PermissionDomain,
    value: PermissionValue
  ) => {
    setPermissions((prev) => ({ ...prev, [domain]: value }));
  };

  const handleExclusionChange = (
    domain: PermissionDomain,
    selectedUserIds: string[]
  ) => {
    setExclusionSelections((prev) => ({
      ...prev,
      [domain]: selectedUserIds,
    }));
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      showNotification("Access level name is required", "error");
      return;
    }

    const ensuredPermissions = ensureRequiredPermissionKeys({ ...permissions });
    const exclusions = EXCLUSION_SUPPORTED_DOMAINS.reduce<ExclusionsMap>(
      (acc, domain) => {
        const selectedValues = exclusionSelections[domain] || [];
        const selectedIds = selectedValues
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0);

        if (selectedIds.length > 0) {
          acc[domain] = Array.from(new Set(selectedIds));
        }

        return acc;
      },
      {}
    );

    const payloadPermissions: Record<string, unknown> = {
      ...ensuredPermissions,
      Exclusions: exclusions,
    };

    const payload = {
      id,
      name: trimmedName,
      permissions: payloadPermissions,
    };

    if (id) {
      updateData(payload, { id });
      return;
    }

    postData(payload);
  };

  return (
    <PageOutline className="!overflow-hidden !p-0">
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="app-page-padding app-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto pb-8">
          <PageHeader title={`${id ? "Update" : "Create"} Access Level`} />

          <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-secondary/10 to-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="w-full lg:max-w-xl">
                <InputDiv
                  id="name"
                  label="Access Level Name"
                  placeholder="e.g. Membership Officer"
                  required
                  value={name}
                  onChange={(_, value) => setName(String(value))}
                  className="w-full"
                />
                <p className="mt-2 text-sm text-primaryGray">
                  Build one clear role template and assign it to users from
                  Settings {">"} Users.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-lightGray bg-gray-100 px-3 py-1 text-xs font-medium text-primary">
                  No Access: {summary.noAccess}
                </span>
                <span className="inline-flex items-center rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  View: {summary.view}
                </span>
                <span className="inline-flex items-center rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
                  Manage: {summary.manage}
                </span>
                <span className="inline-flex items-center rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                  Admin: {summary.admin}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Quick Presets</p>
            <div className="grid gap-3 md:grid-cols-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => applyPreset(preset.factory)}
                  className="rounded-xl border border-lightGray bg-white p-4 text-left transition hover:border-primary/40 hover:shadow-sm"
                >
                  <p className="font-semibold text-primary">{preset.title}</p>
                  <p className="mt-1 text-sm text-primaryGray">{preset.subtitle}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {Object.entries(groupedDomains).map(([group, modules]) => (
              <section key={group} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-primary">{group}</h3>
                  <p className="text-xs text-primaryGray">
                    Required modules are marked and must always have a valid
                    level.
                  </p>
                </div>

                <div className="space-y-3">
                  {modules.map((module) => (
                    <div
                      key={module.key}
                      className="rounded-xl border border-lightGray bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-primary">
                              {module.label}
                            </p>
                            {module.required && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                Required
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-primaryGray">
                            {module.description}
                          </p>
                        </div>

                        <div className="inline-flex rounded-lg border border-lightGray bg-gray-100 p-1">
                          {ACCESS_OPTIONS.map((option) => {
                            const selected = permissions[module.key] === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() =>
                                  handlePermissionChange(module.key, option.value)
                                }
                                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                                  selected
                                    ? `${option.chipClass} shadow-sm`
                                    : "text-primaryGray hover:bg-white"
                                }`}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {isExclusionEnabled(module.key) && (
                        <div className="mt-4 rounded-lg border border-dashed border-lightGray bg-gray-50 p-3">
                          <p className="text-sm font-medium text-primary">
                            Excluded members
                          </p>
                          <p className="mt-1 text-xs text-primaryGray">
                            Excluded users will not be accessible in this
                            module. Selected values are submitted as `user_id`
                            numbers.
                          </p>
                          <MultiSelect
                            className="mt-3"
                            options={exclusionMemberOptions}
                            selectedValues={exclusionSelections[module.key] || []}
                            onChange={(values) =>
                              handleExclusionChange(module.key, values)
                            }
                            placeholder="Select members to exclude"
                            emptyMsg="No excluded members"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="app-page-padding shrink-0 border-t border-lightGray bg-white">
          <div className="flex justify-end gap-2 py-3">
            <Button
              value="Cancel"
              variant="secondary"
              onClick={() => navigate(-1)}
            />
            <Button
              value="Save Access Level"
              variant="primary"
              disabled={!name.trim() || loading || updateLoading}
              loading={loading || updateLoading}
              onClick={handleSubmit}
            />
          </div>
        </div>
      </section>
    </PageOutline>
  );
}
