import { Button } from "@/components/Button";
import EmptyState from "@/components/EmptyState";
import { SearchBar } from "@/components/SearchBar";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { encodeQuery, showDeleteDialog } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import {
  EXCLUSION_SUPPORTED_DOMAINS,
  ExclusionsMap,
  normalizePermissionPayload,
  PermissionMap,
  PermissionValue,
} from "@/utils/accessControl";
import { ColumnDef } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AccessLevelViewModal } from "../Components/AccessLevelViewModal";
import { AccessRight } from "../utils/settingsInterfaces";

type AccessRightRow = AccessRight & {
  configuredModules: number;
  hasExclusions: boolean;
};

const isPermissionValue = (value: unknown): value is PermissionValue =>
  value === "No_Access" ||
  value === "Can_View" ||
  value === "Can_Manage" ||
  value === "Super_Admin";

export function AccessRights() {
  const { canManage } = useAccessControl();
  const canManageAccessRights = canManage("Access_rights");
  const { data, refetch } = useFetch(api.fetch.fetchAccessLevels);
  const { executeDelete: deleteAccess, success: deleteSuccess } = useDelete(
    api.delete.deleteAccess
  );

  const [filter, setFilter] = useState("");
  const [viewingAccessRight, setViewingAccessRight] =
    useState<AccessRightRow | null>(null);
  const navigate = useNavigate();

  const accessRights = useMemo(() => data?.data || [], [data]);

  const rows = useMemo<AccessRightRow[]>(() => {
    return accessRights.map((accessRight) => {
      const normalized = normalizePermissionPayload(
        (accessRight.permissions || {}) as PermissionMap
      );

      const configuredModules = Object.entries(normalized).filter(
        ([key, value]) => key !== "Exclusions" && isPermissionValue(value)
      ).length;

      const exclusions = (normalized.Exclusions || {}) as ExclusionsMap;
      const hasExclusions = EXCLUSION_SUPPORTED_DOMAINS.some(
        (domain) =>
          Array.isArray(exclusions[domain]) && exclusions[domain].length > 0
      );

      return {
        ...accessRight,
        configuredModules,
        hasExclusions,
      };
    });
  }, [accessRights]);

  const handleDelete = useCallback(
    (accessRight: AccessRight) => {
      showDeleteDialog(accessRight, () => {
        deleteAccess({ id: String(accessRight.id) });
      });
    },
    [deleteAccess]
  );

  const openCreate = useCallback(() => {
    navigate("manage-access");
  }, [navigate]);

  const openEdit = useCallback(
    (accessRight: AccessRight) => {
      navigate(`manage-access?access_id=${encodeQuery(accessRight.id)}`);
    },
    [navigate]
  );

  const openViewModal = useCallback((accessRight: AccessRightRow) => {
    setViewingAccessRight(accessRight);
  }, []);

  const closeViewModal = useCallback(() => {
    setViewingAccessRight(null);
  }, []);

  const columns: ColumnDef<AccessRightRow>[] = useMemo(
    () => [
      {
        header: "Access Level Name",
        accessorKey: "name",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-semibold text-primary">{row.original.name}</p>
            <p className="text-xs text-gray-500">
              {row.original.configuredModules} configured modules
            </p>
          </div>
        ),
      },
      {
        header: "Exclusions",
        accessorKey: "hasExclusions",
        cell: ({ row }) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
              row.original.hasExclusions
                ? "bg-error/10 text-error"
                : "bg-success/10 text-success"
            }`}
          >
            {row.original.hasExclusions ? "Configured" : "None"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Button
              value="View"
              variant="secondary"
              onClick={() => openViewModal(row.original)}
              className="!px-3 !py-1 !min-h-8 text-xs"
            />
            <Button
              value="Edit"
              variant="secondary"
              onClick={() => openEdit(row.original)}
              disabled={!canManageAccessRights}
              className="!px-3 !py-1 !min-h-8 text-xs"
            />
            <Button
              value="Delete"
              variant="ghost"
              onClick={() => handleDelete(row.original)}
              disabled={!canManageAccessRights}
              className="!min-h-8 !px-3 !py-1 text-xs text-error hover:bg-error/10"
            />
          </div>
        ),
      },
    ],
    [canManageAccessRights, handleDelete, openEdit, openViewModal]
  );

  useEffect(() => {
    if (deleteSuccess) {
      refetch();
      setViewingAccessRight(null);
    }
  }, [deleteSuccess, refetch]);

  return (
    <PageOutline>
      <PageHeader title="Access Level Studio" />

      <section className="space-y-6">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-secondary/10 to-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-primary">
                Create and manage access levels
              </h3>
              <p className="text-sm text-primaryGray">
                Design roles, update permissions, and retire old access levels
                from one screen.
              </p>
            </div>

            <Button
              value="Create Access Level"
              onClick={openCreate}
              disabled={!canManageAccessRights}
              className="w-full sm:w-auto"
            />
          </div>

          {!canManageAccessRights && (
            <p className="mt-3 rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
              You currently have view-only access for Access Rights. Edit/Delete
              controls are visible but disabled.
            </p>
          )}
        </div>

        <section className="space-y-3">
          <SearchBar
            placeholder="Search access levels..."
            className="max-w-md"
            onChange={(event) => setFilter(event.target.value)}
            value={filter}
          />

          {rows.length === 0 ? (
            <EmptyState
              scope="page"
              msg="No access levels found"
              description="Create an access level to assign permission templates to users."
            />
          ) : (
            <TableComponent
              columns={columns}
              data={rows}
              filter={filter}
              setFilter={setFilter}
              rowClass="even:bg-white odd:bg-gray-50"
              className="shadow-sm"
              showNumberColumn={false}
            />
          )}
        </section>
      </section>

      <AccessLevelViewModal
        open={Boolean(viewingAccessRight)}
        accessRight={viewingAccessRight}
        canManageAccessRights={canManageAccessRights}
        onClose={closeViewModal}
        onEdit={(accessRight) => {
          closeViewModal();
          openEdit(accessRight);
        }}
        onDelete={(accessRight) => {
          handleDelete(accessRight);
        }}
      />
    </PageOutline>
  );
}
