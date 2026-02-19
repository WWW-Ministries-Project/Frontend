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
import { ActiveAccess } from "../Components/ActiveAccess";
import { AccessRight } from "../utils/settingsInterfaces";

type AccessRightRow = AccessRight & {
  configuredModules: number;
  hasExclusions: boolean;
};

const isPermissionValue = (value: unknown): value is PermissionValue =>
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
  const [selectedAccessRight, setSelectedAccessRight] =
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
    (accessRight: AccessRightRow) => {
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
    (accessRight: AccessRightRow) => {
      navigate(`manage-access?access_id=${encodeQuery(accessRight.id)}`);
    },
    [navigate]
  );

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
                ? "bg-red-100 text-red-700"
                : "bg-emerald-100 text-emerald-700"
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
              onClick={() => setSelectedAccessRight(row.original)}
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
              className="!px-3 !py-1 !min-h-8 text-xs text-red-600 hover:bg-red-50"
            />
          </div>
        ),
      },
    ],
    [canManageAccessRights, handleDelete, openEdit]
  );

  useEffect(() => {
    if (!selectedAccessRight && rows.length > 0) {
      setSelectedAccessRight(rows[0]);
    }
  }, [rows, selectedAccessRight]);

  useEffect(() => {
    if (deleteSuccess) {
      refetch();
      setSelectedAccessRight(null);
    }
  }, [deleteSuccess, refetch]);

  return (
    <PageOutline>
      <PageHeader title="Access Level Studio" />

      <section className="space-y-6">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-orange-50 to-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-primary">
                Create and manage access levels
              </h3>
              <p className="text-sm text-gray-600">
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
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              You currently have view-only access for Access Rights. Edit/Delete
              controls are visible but disabled.
            </p>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="space-y-3 lg:col-span-2">
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
                rowClass="even:bg-white odd:bg-[#F7F8FA]"
                className="shadow-sm"
                showNumberColumn={false}
                onRowClick={(row: AccessRightRow) => setSelectedAccessRight(row)}
              />
            )}
          </section>

          <section className="space-y-4">
            {selectedAccessRight ? (
              <>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Selected Access Level
                  </p>
                  <p className="mt-1 text-lg font-semibold text-primary">
                    {selectedAccessRight.name}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      value="Edit"
                      variant="secondary"
                      onClick={() => openEdit(selectedAccessRight)}
                      disabled={!canManageAccessRights}
                      className="!min-h-8 !px-3 !py-1 text-xs"
                    />
                    <Button
                      value="Delete"
                      variant="ghost"
                      onClick={() => handleDelete(selectedAccessRight)}
                      disabled={!canManageAccessRights}
                      className="!min-h-8 !px-3 !py-1 text-xs text-red-600 hover:bg-red-50"
                    />
                  </div>
                </div>

                <ActiveAccess
                  name={selectedAccessRight.name}
                  permissions={selectedAccessRight.permissions || {}}
                />
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                <p className="font-semibold text-primary">No access level selected</p>
                <p className="mt-1 text-sm text-gray-600">
                  Select a row to preview details, or create a new access level.
                </p>
                <Button
                  value="Create Access Level"
                  onClick={openCreate}
                  disabled={!canManageAccessRights}
                  className="mt-3"
                />
              </div>
            )}
          </section>
        </div>
      </section>
    </PageOutline>
  );
}
