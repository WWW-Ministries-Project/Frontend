import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { Button } from "@/components";
import { Modal } from "@/components/Modal";
import { LifeCenterMemberForm } from "./LifeCenterMemberForm";

import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { useDelete } from "@/CustomHooks/useDelete";

import { api } from "@/utils/api/apiCalls";
import {
  decodeQuery,
  showDeleteDialog,
  showNotification,
} from "@/pages/HomePage/utils";

import DeleteIcon from "@/assets/DeleteIcon";
import EditIcon from "@/assets/EditIcon";
import useWindowSize from "@/CustomHooks/useWindowSize";

export function LifeCenterMembers({
  refetchLifeCenter,
}: {
  refetchLifeCenter: () => void;
}) {
  const { id: lifeCenterParam } = useParams();
  const lifeCenterId = decodeQuery(String(lifeCenterParam));

  const [openForm, setOpenForm] = useState(false);
  const [editData, setEditData] = useState<LifeCenterMemberForm | null>(null);

  const { data: roleResponse } = useFetch(api.fetch.fetchLifCenterRoles);
  const { data: memberResponse, refetch } = useFetch(
    api.fetch.fetchLifCenterMembers,
    { id: lifeCenterId }
  );
  const { screenWidth } = useWindowSize();

  const {
    postData: createMember,
    data: newMember,
    loading: isCreating,
  } = usePost(api.post.createLifeCenterMember);
  const {
    updateData: updateMember,
    data: updatedMember,
    loading: isUpdating,
  } = usePut(api.put.updateLifeCenterMember);
  const { executeDelete, success } = useDelete(
    api.delete.deleteLifeCenterMember
  );

  const lifeCenterRoles = useMemo(
    () =>
      roleResponse?.data.map((role) => ({
        label: role.name,
        value: role.id,
      })) || [],
    [roleResponse?.data]
  );

  const members = useMemo(
    () =>
      memberResponse?.data.map((member) => ({
        id: member.id,
        userId: member.user.id,
        name: member.user.name,
        role: member.role.name,
        roleId: member.role.id,
        lifeCenterId: member.lifeCenterId,
      })) || [],
    [memberResponse?.data]
  );

  const refetchData = useCallback(() => {
    refetch();
    refetchLifeCenter();
  }, [refetch, refetchLifeCenter]);

  const handleFormSubmit = async (formData: LifeCenterMemberForm) => {
    try {
      if (formData.id) {
        updateMember(formData, { id: formData.id });
      } else {
        await createMember({ ...formData, lifeCenterId });
      }
    } catch {
      showNotification("Something went wrong", "error");
    }
  };

  const handleEdit = (
    member: LifeCenterMemberForm & { name: string; role: string }
  ) => {
    setEditData(member);
    setOpenForm(true);
  };

  const handleDelete = useCallback(
    (userId: string, name: string) => {
      showDeleteDialog({ id: lifeCenterId, name }, () =>
        executeDelete({ userId, lifeCenterId })
      );
    },
    [executeDelete, lifeCenterId]
  );

  useEffect(() => {
    if (newMember) {
      showNotification("Member added successfully", "success");
      setOpenForm(false);
      refetchData();
    }
  }, [newMember, refetchData]);

  useEffect(() => {
    if (updatedMember) {
      showNotification("Member role updated successfully", "success");
      setOpenForm(false);
      refetch();
    }
  }, [updatedMember, refetch]);

  useEffect(() => {
    if (success) {
      showNotification("Member deleted successfully", "success");
    }
    refetchData();
  }, [success, refetchData]);

  const addMember = ()=>{
    setOpenForm(true);
    setEditData(null)
  }

  return (
    <div className="p-6 text-[#474D66] font-medium text-xl h-fit">
      <div className="flex items-center justify-between">
        <h4>Membership ({members.length})</h4>
        <Button
          value={screenWidth <= 700 ? "+" : "+ Add"}
          className="text-[#474D66]"
          variant="secondary"
          onClick={addMember}
        />
      </div>

      <div className="mt-3 space-y-2 divide-y-[1px]">
        {members.map((member) => (
          <div
            key={member.userId}
            className="text-base flex justify-between  py-2 "
          >
            <p>
              {member.name} ({member.role})
            </p>
            <div className="flex items-center gap-1 cursor-pointer">
              <div onClick={() => handleEdit(member)}>
                <EditIcon />
              </div>
              <DeleteIcon
                onClick={() => handleDelete(member.userId, member.name)}
              />
            </div>
          </div>
        ))}
      </div>

      <Modal open={openForm} onClose={() => setOpenForm(false)}>
        <LifeCenterMemberForm
          editData={editData}
          loading={isCreating || isUpdating}
          onClose={() => setOpenForm(false)}
          onSubmit={handleFormSubmit}
          roles={lifeCenterRoles}
        />
      </Modal>
    </div>
  );
}
