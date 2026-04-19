import EmptyState from "@/components/EmptyState";
import {
  ACCESS_LEVEL_DOMAINS,
  EXCLUSION_SUPPORTED_DOMAINS,
  ExclusionsMap,
  getDomainLabel,
  normalizePermissionPayload,
  PermissionDomain,
  PermissionMap,
  PermissionValue,
  ScopesMap,
} from "@/utils/accessControl";
import { useMemo } from "react";

interface IProps {
  name: string;
  permissions: Record<string, unknown>;
}

const LEVEL_META: Record<
  PermissionValue,
  { label: string; className: string }
> = {
  No_Access: {
    label: "No Access",
    className: "border border-lightGray bg-gray-100 text-primary",
  },
  Can_View: {
    label: "Can View",
    className: "border border-primary/15 bg-primary/10 text-primary",
  },
  Can_Manage: {
    label: "Can Manage",
    className: "border border-secondary/20 bg-secondary/10 text-secondary",
  },
  Super_Admin: {
    label: "Super Admin",
    className: "border border-accent/20 bg-accent/10 text-accent",
  },
};

const supportsExclusions = (domain: string) =>
  EXCLUSION_SUPPORTED_DOMAINS.includes(domain as PermissionDomain);

export const ActiveAccess = ({ name, permissions }: IProps) => {
  const normalized = useMemo(
    () => normalizePermissionPayload(permissions as PermissionMap),
    [permissions]
  );

  const modules = useMemo(() => {
    const exclusions = (normalized.Exclusions || {}) as ExclusionsMap;
    const scopes = (normalized.Scopes || {}) as ScopesMap;

    const knownModules = ACCESS_LEVEL_DOMAINS.map((domain) => {
      const value = normalized[domain.key] as PermissionValue | undefined;
      return {
        key: domain.key,
        label: domain.label,
        description: domain.description,
        value,
        scope: scopes[domain.key] || null,
        excludedUsers: supportsExclusions(domain.key)
          ? exclusions[domain.key] || []
          : [],
      };
    });

    const knownKeys = new Set([
      ...ACCESS_LEVEL_DOMAINS.map((domain) => domain.key),
      "Exclusions",
    ]);

    const customModules = Object.entries(normalized)
      .filter(
        ([key, value]) =>
          key !== "Exclusions" &&
          !knownKeys.has(key) &&
          (value === "No_Access" ||
            value === "Can_View" ||
            value === "Can_Manage" ||
            value === "Super_Admin")
      )
      .map(([key, value]) => ({
        key,
        label: getDomainLabel(key),
        description: "Additional configured domain",
        value: value as PermissionValue,
        scope: scopes[key] || null,
        excludedUsers: supportsExclusions(key) ? exclusions[key] || [] : [],
      }));

    return [...knownModules, ...customModules];
  }, [normalized]);

  const configuredModules = modules.filter((module) => Boolean(module.value));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{name}</h2>
        <span className="rounded-full border border-lightGray bg-gray-100 px-3 py-1 text-xs font-medium text-primary">
          {configuredModules.length} configured modules
        </span>
      </div>

      {configuredModules.length === 0 ? (
        <EmptyState
          scope="section"
          msg="No module permissions found"
          description="This access right does not have any module permissions configured."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {configuredModules.map((module) => {
            const meta = module.value ? LEVEL_META[module.value] : null;

            return (
              <article
                key={module.key}
                className="rounded-xl border border-lightGray bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-primary">{module.label}</p>
                    <p className="mt-1 text-sm text-primaryGray">
                      {module.description}
                    </p>
                  </div>

                  {meta && (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}
                    >
                      <span className="mr-2 inline-block h-2 w-2 rounded-full bg-current" />
                      {meta.label}
                    </span>
                  )}
                </div>

                {module.excludedUsers.length > 0 && (
                  <div className="mt-3 rounded-lg bg-error/10 p-2 text-xs text-error">
                    Excluded user IDs: {module.excludedUsers.join(", ")}
                  </div>
                )}

                {module.scope === "assigned_departments" && (
                  <div className="mt-3 rounded-lg bg-primary/10 p-2 text-xs text-primary">
                    Scope: Assigned departments only (HOD access)
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
