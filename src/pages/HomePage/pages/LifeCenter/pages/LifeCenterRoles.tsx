import { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import ActionButton from "@/pages/HomePage/Components/reusable/ActionButton";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { Modal } from "@/components/Modal";
import { RolesForm } from "../components/RolesForm";
import { api } from "@/utils/api/apiCalls";
import { showDeleteDialog, showNotification } from "@/pages/HomePage/utils";

interface Role {
  id: string;
  name: string;
}

export function LifeCenterRoles() {
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);

  const { data: roles, refetch } = useFetch(api.fetch.fetchLifCenterRoles);

  const {
    postData: createRole,
    data: newRole,
    loading: isCreating,
  } = usePost(api.post.createLifeCenterRole);

  const {
    updateData: updateRole,
    data: updatedRole,
    loading: isUpdating,
  } = usePut(api.put.updateLifeCenterRole);

  const { executeDelete, success: isDeleted } = useDelete(
    api.delete.deleteLifeCenterRole
  );

  const handleShowOptions = useCallback((id: string) => {
    setSelectedRoleId((prev) => (prev === id ? "" : id));
  }, []);

  const handleDeleteRole = useCallback(
    (id: string, name: string) => {
      showDeleteDialog({ id, name }, () => executeDelete({ id }));
    },
    [executeDelete]
  );

  const handleSubmitRole = async (role: Role) => {
    if (editRole) {
      await updateRole(role, { id: role.id });
    } else {
      await createRole(role);
    }
  };

  const openCreateModal = () => {
    setEditRole(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditRole(null);
  };

  useEffect(() => {
    if (newRole?.data) {
      showNotification("Role added successfully", "success");
      refetch();
      closeModal();
    }
  }, [newRole, refetch]);

  useEffect(() => {
    if (updatedRole) {
      showNotification("Role updated successfully", "success");
      refetch();
      closeModal();
    }
  }, [updatedRole, refetch]);

  useEffect(() => {
    if (isDeleted) {
      showNotification("Role deleted successfully", "success");
      refetch();
    }
  }, [isDeleted, refetch]);

  const columns = useMemo<ColumnDef<Role>[]>(
    () => [
      {
        header: "Role Name",
        accessorKey: "name",
      },
      {
        header: "Action",
        cell: ({ row }) => {
          const { id, name } = row.original;

          return (
            <div onClick={() => handleShowOptions(id)}>
              <ActionButton
                showOptions={selectedRoleId === id}
                onEdit={() => {
                  setEditRole({ id, name });
                  setIsModalOpen(true);
                }}
                onDelete={() => handleDeleteRole(id, name)}
              />
            </div>
          );
        },
      },
    ],
    [selectedRoleId, handleShowOptions, handleDeleteRole]
  );

  return (
    <PageOutline>
      <PageHeader
        title="Life Center Roles"
        buttonValue="Create Role"
        onClick={openCreateModal}
      />

      <TableComponent
        columns={columns}
        data={roles?.data || []}
        displayedCount={10}
      />

      <Modal open={isModalOpen} persist={false} onClose={closeModal}>
        <RolesForm
          closeModal={closeModal}
          editData={editRole}
          handleMutate={handleSubmitRole}
          loading={isCreating || isUpdating}
        />
      </Modal>
    </PageOutline>
  );
}
