import { Button } from "@/components/Button";
import EmptyState from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import {
  getDomainLabel,
  normalizePermissionPayload,
  PermissionMap,
  PermissionValue,
} from "@/utils/accessControl";
import { useEffect, useMemo, useState } from "react";
import {
  AccessLevelAssignedUser,
  AccessLevelExclusionUser,
  AccessRight,
} from "../utils/settingsInterfaces";
import { ActiveAccess } from "./ActiveAccess";

type ViewTab = "access_info" | "assigned_members";

interface AccessLevelViewModalProps {
  open: boolean;
  accessRight: AccessRight | null;
  canManageAccessRights: boolean;
  onClose: () => void;
  onEdit: (accessRight: AccessRight) => void;
  onDelete: (accessRight: AccessRight) => void;
}

const isPermissionValue = (value: unknown): value is PermissionValue =>
  value === "No_Access" ||
  value === "Can_View" ||
  value === "Can_Manage" ||
  value === "Super_Admin";

const getAssignedUserName = (user: AccessLevelAssignedUser): string =>
  user.name || user.full_name || `User #${user.id}`;

const getExclusionUserName = (user: AccessLevelExclusionUser): string =>
  user.full_name || user.name || `User #${user.id}`;

const getInitials = (value: string): string =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "U";

export const AccessLevelViewModal = ({
  open,
  accessRight,
  canManageAccessRights,
  onClose,
  onEdit,
  onDelete,
}: AccessLevelViewModalProps) => {
  const [activeTab, setActiveTab] = useState<ViewTab>("access_info");

  useEffect(() => {
    if (open) {
      setActiveTab("access_info");
    }
  }, [open, accessRight?.id]);

  const assignedUsers = useMemo(
    () => accessRight?.users_assigned || [],
    [accessRight]
  );

  const configuredModules = useMemo(() => {
    if (!accessRight) return 0;
    const normalized = normalizePermissionPayload(
      (accessRight.permissions || {}) as PermissionMap
    );

    return Object.entries(normalized).filter(
      ([key, value]) => key !== "Exclusions" && isPermissionValue(value)
    ).length;
  }, [accessRight]);

  const exclusionGroups = useMemo(() => {
    if (!accessRight?.exclusion_users) return [];

    return Object.entries(accessRight.exclusion_users)
      .filter(([, users]) => Array.isArray(users) && users.length > 0)
      .map(([domain, users]) => ({
        domain,
        domainLabel: getDomainLabel(domain),
        users,
      }));
  }, [accessRight]);

  const exclusionUserCount = useMemo(
    () =>
      exclusionGroups.reduce((acc, group) => {
        return acc + group.users.length;
      }, 0),
    [exclusionGroups]
  );

  return (
    <Modal open={open} persist={false} onClose={onClose} className="max-w-5xl">
      {accessRight && (
        <div className="flex h-full min-h-[32rem] flex-col">
          <div className="sticky top-0 z-10 border-b border-lightGray bg-white px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-primaryGray">
                  Access Level
                </p>
                <h3 className="text-2xl font-semibold text-primary">
                  {accessRight.name}
                </h3>
                <p className="mt-1 text-sm text-primaryGray">
                  {configuredModules} configured modules • {assignedUsers.length}{" "}
                  assigned member{assignedUsers.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {canManageAccessRights && (
                  <>
                    <Button
                      value="Edit"
                      variant="secondary"
                      onClick={() => onEdit(accessRight)}
                      className="!min-h-9 !px-3 !py-1 text-xs"
                    />
                    <Button
                      value="Delete"
                      variant="ghost"
                      onClick={() => onDelete(accessRight)}
                      className="!min-h-9 !px-3 !py-1 text-xs text-error hover:bg-error/10"
                    />
                  </>
                )}
                <Button
                  value="Close"
                  variant="secondary"
                  onClick={onClose}
                  className="!min-h-9 !px-3 !py-1 text-xs"
                />
              </div>
            </div>

            <div className="mt-4 inline-flex rounded-lg border border-lightGray bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setActiveTab("access_info")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  activeTab === "access_info"
                    ? "bg-white text-primary shadow-sm"
                    : "text-primaryGray hover:bg-white"
                }`}
              >
                Access Level Information
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("assigned_members")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  activeTab === "assigned_members"
                    ? "bg-white text-primary shadow-sm"
                    : "text-primaryGray hover:bg-white"
                }`}
              >
                Assign Members
              </button>
            </div>
          </div>

          <div className="app-scrollbar flex-1 overflow-y-auto px-6 py-5">
            {activeTab === "access_info" ? (
              <div className="space-y-6">
                {accessRight.description ? (
                  <div className="rounded-xl border border-lightGray bg-gray-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-primaryGray">
                      Description
                    </p>
                    <p className="mt-1 text-sm text-primaryGray">
                      {accessRight.description}
                    </p>
                  </div>
                ) : null}

                <ActiveAccess
                  name={accessRight.name}
                  permissions={accessRight.permissions || {}}
                />

                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-primary">
                      Excluded Users
                    </h4>
                    <span className="rounded-full bg-error/10 px-3 py-1 text-xs font-medium text-error">
                      {exclusionUserCount} excluded
                    </span>
                  </div>

                  {exclusionGroups.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-lightGray bg-gray-50 p-4 text-sm text-primaryGray">
                      No exclusion users configured for this access level.
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {exclusionGroups.map((group) => (
                        <article
                          key={group.domain}
                          className="rounded-xl border border-lightGray bg-white p-4 shadow-sm"
                        >
                          <p className="font-semibold text-primary">
                            {group.domainLabel}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {group.users.map((user) => (
                              <span
                                key={`${group.domain}-${user.id}`}
                                className="inline-flex rounded-full bg-error/10 px-2.5 py-1 text-xs font-medium text-error"
                              >
                                {getExclusionUserName(user)}
                              </span>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            ) : (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-primary">
                    Assigned Members
                  </h4>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {assignedUsers.length} members
                  </span>
                </div>

                {assignedUsers.length === 0 ? (
                  <EmptyState
                    scope="section"
                    msg="No members assigned"
                    description="This access level has not been assigned to any users yet."
                  />
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {assignedUsers.map((user) => {
                      const displayName = getAssignedUserName(user);
                      const avatarUrl = user.user_info?.photo;

                      return (
                        <article
                          key={user.id}
                          className="flex items-center gap-3 rounded-xl border border-lightGray bg-white p-4 shadow-sm"
                        >
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={displayName}
                              className="h-11 w-11 rounded-full border border-lightGray object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                              {getInitials(displayName)}
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-primary">
                              {displayName}
                            </p>
                            <p className="text-xs text-primaryGray">
                              User ID: {user.id}
                            </p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
