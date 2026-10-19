import { useState } from "react";

import { DialogShell } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { showNotification } from "@/pages/HomePage/utils";

import { deleteDepartment } from "./departmentMutations";
import { apiErrorMessage, type DepartmentRecord } from "./departmentShared";

export const DepartmentDeleteDialog = ({
  department,
  onClose,
  onDeleted,
}: {
  department: DepartmentRecord | null;
  onClose: () => void;
  onDeleted: () => void;
}) => {
  const [deleting, setDeleting] = useState(false);

  const confirm = async () => {
    if (!department) return;
    setDeleting(true);
    try {
      await deleteDepartment(department.id);
      showNotification(`${department.name} deleted`, "success");
      onDeleted();
    } catch (error) {
      showNotification(apiErrorMessage(error, "Unable to delete department."), "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DialogShell
      open={Boolean(department)}
      onClose={onClose}
      title={`Delete ${department?.name ?? "department"}?`}
      subtitle="Members will be removed from this department and pending requests cancelled. This can’t be undone."
      ctaLabel="Delete"
      ctaTone="danger"
      onConfirm={() => void confirm()}
      loading={deleting}
    />
  );
};
