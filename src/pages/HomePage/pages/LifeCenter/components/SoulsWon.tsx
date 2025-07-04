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

interface IProps {
  soulsWon: ISoulsWonForm[];
  lifeCenterId: string;
  handleSuccess: () => void;
}

export const SoulsWon = ({
  soulsWon,
  lifeCenterId,
  handleSuccess,
}: IProps) => {
  const [selectedId, setSelectedId] = useState<number | string>("");
  const [openModal, setOpenModal] = useState(false);
  const [soulWon, setSoulWon] = useState<ISoulsWonForm | null>(null);

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
    <>
      <HeaderControls
        title={`Souls won (${soulsWon.length})`}
        subtitle=""
        screenWidth={window.innerWidth}
        btnName="Add Record"
        handleClick={handleAddSoul}
      />

      <TableComponent
        columns={tableColumns}
        data={soulsWon}
        displayedCount={10}
      />

      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <SoulsWonForm
          onSubmit={handleSave}
          onClose={() => setOpenModal(false)}
          editData={soulWon}
          loading={isPosting || isUpdating}
        />
      </Modal>
    </>
  );
};
