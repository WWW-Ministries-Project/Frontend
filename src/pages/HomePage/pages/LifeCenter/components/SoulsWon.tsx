import { ColumnDef } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";

import { HeaderControls } from "@/components/HeaderControls";
import { Modal } from "@/components/Modal";
import ActionButton from "@/pages/HomePage/Components/reusable/ActionButton";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";

import { useDelete } from "@/CustomHooks/useDelete";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";

import { showDeleteDialog, showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";

import { ISoulsWonForm, SoulsWonForm } from "./SoulsWonForm";
import { LifeCenterMemberType } from "@/utils";

interface IProps {
  soulsWon: ISoulsWonForm[];
  lifeCenterId: string;
  handleSuccess: () => void;
  hasMembers:boolean
  leader:LifeCenterMemberType | undefined
}

export const SoulsWon = ({
  soulsWon,
  lifeCenterId,
  handleSuccess,
  hasMembers,
  leader
}: IProps) => {
  const [selectedId, setSelectedId] = useState<number | string>("");
  const [openModal, setOpenModal] = useState(false);
  const [soulWon, setSoulWon] = useState<ISoulsWonForm | null>(null);
  console.log("leader", leader);
  

  const { executeDelete } = useDelete(api.delete.deleteSoulWon);
  const {
    postData,
    data: postResponse,
    loading: isPosting,
  } = usePost(api.post.createSoul);
  const {
    updateData,
    data: updateResponse,
    loading: isUpdating,
  } = usePut(api.put.updateSoul);

  const handleShowOptions = useCallback((id: number | string) => {
    setSelectedId((prev) => (prev === id ? "" : id));
  }, []);

  const handleDeleteSoul = useCallback(
    (id: string, name: string) => {
      showDeleteDialog({ id, name }, async () => {
        await executeDelete({ id });
        handleSuccess();
        showNotification("Soul deleted successfully", "success");
      });
    },
    [executeDelete]
  );

  const handleSave = async (formData: ISoulsWonForm) => {
    try {
      if (formData.id) {
        updateData({ ...formData, lifeCenterId }, { id: formData.id });
      } else {
        await postData({ ...formData, lifeCenterId });
      }
    } catch {
      showNotification("Something went wrong", "error");
    }
  };

  const handleEdit = (soul: ISoulsWonForm) => {
    setSoulWon(soul);
    setOpenModal(true);
  };

  const handleAddSoul = () => {
    setSoulWon(null);
    setOpenModal(true);
  };

  const tableColumns: ColumnDef<ISoulsWonForm>[] = useMemo(
    () => [
      {
        header: "NAME",
        cell: ({ row }) => (
          <div>{`${row.original.first_name} ${row.original.last_name}`}</div>
        ),
      },
      {
        header: "CONTACT",
        accessorKey: "contact_number",
      },
      {
        header: "LOCATION",
        accessorKey: "country",
      },
      {
        header: "DATE WON",
        accessorKey: "date_won",
      },
      {
        header: "WON BY",
        accessorKey: "wonByName",
      },
      {
        header: "ACTION",
        cell: ({ row }) => {
          const { id, first_name, last_name } = row.original;
          const name = `${first_name} ${last_name}`;
          return (
            <div onClick={() => handleShowOptions(id)}>
              <ActionButton
                showOptions={id === selectedId}
                onDelete={() => handleDeleteSoul(id, name)}
                onEdit={() => handleEdit(row.original)}
              />
            </div>
          );
        },
      },
    ],
    [selectedId, handleDeleteSoul, handleShowOptions]
  );

  useEffect(() => {
    if (postResponse?.data) {
      handleSuccess();
      showNotification("Soul added successfully", "success");
      setSoulWon(null);
      setOpenModal(false);
    }
    if (updateResponse && soulWon) {
      handleSuccess();
      showNotification("Soul updated successfully", "success");
      setSoulWon(null);
      setOpenModal(false);
    }
  }, [postResponse?.data, updateResponse]);

  return (
    <div className="space-y-6">
  <HeaderControls
    title={`Souls won (${soulsWon.length})`}
    subtitle=""
    screenWidth={window.innerWidth}
    btnName={hasMembers?"Add Record":""}
    handleClick={handleAddSoul}
  />
  {!hasMembers&&<p>
    <span className="font-semibold">Notice:</span> Please add a leader to this center first. Once a leader is assigned, the <span className="font-medium">Add Soul</span> button will appear.
  </p>}

  <hr/>

  {soulsWon.length > 0 ? (
    <TableComponent
      columns={tableColumns}
      data={soulsWon}
      displayedCount={10}
    />
  ) : (
    <div className=" flex flex-col items-center justify-center py-12rounded-lg ">
      <h3 className="text-xl font-medium text-gray-500 mb-2">
        No Souls Records Yet
      </h3>
      <p className="text-gray-400 mb-6 max-w-md text-center">
        You haven&apos;t recorded any souls yet. Start by adding your first record.
      </p>
      
    </div>
  )}

  <Modal open={openModal} onClose={() => setOpenModal(false)}>
    <SoulsWonForm
      onSubmit={handleSave}
      onClose={() => setOpenModal(false)}
      editData={soulWon}
      loading={isPosting || isUpdating}
      leader={leader}
    />
  </Modal>
</div>
  );
};
