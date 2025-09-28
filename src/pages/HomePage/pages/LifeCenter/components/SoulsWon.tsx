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

import { LifeCenterMemberType } from "@/utils";
import { ISoulsWonForm, SoulsWonForm } from "./SoulsWonForm";
import { matchRoutes, useLocation } from "react-router-dom";
import { routes } from "@/routes/appRoutes";

interface IProps {
  soulsWon: ISoulsWonForm[];
  lifeCenterId: string;
  handleSuccess: () => void;
  hasMembers: boolean;
  leader: LifeCenterMemberType | undefined;
}

export const SoulsWon = ({
  soulsWon,
  lifeCenterId,
  handleSuccess,
  hasMembers,
  leader,
}: IProps) => {
  const [selectedId, setSelectedId] = useState<number | string>("");
  const [openModal, setOpenModal] = useState(false);
  const [soulWon, setSoulWon] = useState<ISoulsWonForm | null>(null);
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
  const [accessDeniedAction, setAccessDeniedAction] = useState<'edit' | 'delete' | ''>('');

  const location = useLocation();
  
  const matches = matchRoutes(routes, location);
  const routeName = matches?.find((m) => m.route.name)?.route.name;

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
      if (routeName === "member") {
        setAccessDeniedAction('delete');
        setShowAccessDeniedModal(true);
        return;
      }

      showDeleteDialog({ id, name }, async () => {
        await executeDelete({ id });
        handleSuccess();
        showNotification("Soul deleted successfully", "success");
      });
    },
    [executeDelete, routeName]
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
    if (routeName === "member") {
      setAccessDeniedAction('edit');
      setShowAccessDeniedModal(true);
      return;
    }

    setSoulWon(soul);
    setOpenModal(true);
  };

  const handleAddSoul = () => {
    setSoulWon(null);
    setOpenModal(true);
  };

  const handleCloseAccessDeniedModal = () => {
    setShowAccessDeniedModal(false);
    setAccessDeniedAction('');
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
    [selectedId, handleDeleteSoul, handleShowOptions, handleEdit]
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
        btnName={hasMembers ? "Add Record" : ""}
        handleClick={handleAddSoul}
      />
      {!hasMembers && (
        <p>
          <span className="font-semibold">Notice:</span> Please add a leader to
          this center first. Once a leader is assigned, the{" "}
          <span className="font-medium">Add Soul</span> button will appear.
        </p>
      )}

      <hr />

      {soulsWon.length > 0 ? (
        <TableComponent
          columns={tableColumns}
          data={soulsWon}
          displayedCount={10}
          className="relative"
        />
      ) : (
        <div className=" flex flex-col items-center justify-center py-12rounded-lg ">
          <h3 className="text-xl font-medium text-gray-500 mb-2">
            No Souls Records Yet
          </h3>
          <p className="text-gray-400 mb-6 max-w-md text-center">
            You haven&apos;t recorded any souls yet. Start by adding your first
            record.
          </p>
        </div>
      )}

      {/* Form Modal */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <SoulsWonForm
          onSubmit={handleSave}
          onClose={() => setOpenModal(false)}
          editData={soulWon}
          loading={isPosting || isUpdating}
          leader={leader}
        />
      </Modal>

      {/* Access Denied Modal */}
      <Modal open={showAccessDeniedModal} onClose={handleCloseAccessDeniedModal}>
        <div className="p-6 max-w-md mx-auto bg-white rounded-lg">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">
                Access Denied
              </h3>
            </div>
          </div>
          <div className="mb-6">
            <p className="text-sm text-gray-700">
              You do not have access to {accessDeniedAction} this data. Please contact the Ministry's IT Directorate for assistance.
            </p>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md"
              onClick={handleCloseAccessDeniedModal}
            >
              Understood
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};