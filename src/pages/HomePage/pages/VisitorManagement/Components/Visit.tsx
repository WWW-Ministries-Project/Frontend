import { HeaderControls } from "@/components/HeaderControls";
import { Modal } from "@/components/Modal";
import EmptyState from "@/components/EmptyState";
import { useDelete } from "@/CustomHooks/useDelete";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import ActionButton from "@/pages/HomePage/Components/reusable/ActionButton";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { api, formatDate, VisitType } from "@/utils";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { IVisitForm, VisitForm } from "./VisitForm";
import AddAnotherConfirmation from "@/pages/HomePage/Components/reusable/AddAnotherConfirmation";

interface IProps {
  visitorId: string;
  visits: Visit[];
  onRefetch?: () => Promise<void>;
}
export const Visits = ({ visitorId, visits, onRefetch }: IProps) => {
  const [selectedId, setSelectedId] = useState<number | string>(""); // Track selected row for actions
  const [isModalOpen, setIsModalOpen] = useState(false); // Track modal open state
  const [selectedVisit, setSelectedVisit] = useState<
    (IVisitForm & { id: string | number }) | undefined
  >(undefined); // Store selected visit for editing

  const [showRegisterAnother, setShowRegisterAnother] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);

  const { postData: postVisit, loading: postLoading } = usePost(
    api.post.createVisit
  );
  const { updateData: updateVisit, loading: putLoading } = usePut(
    api.put.updateVisit
  );
  const { executeDelete } = useDelete(api.delete.deleteVisit);

  // Function to toggle the options menu for each row
  const handleShowOptions = (id: number | string) => {
    setSelectedId((prevSelectedId) => (prevSelectedId === id ? "" : id));
  };

  // Function to delete a visit
  const deleteVisit = async (id: number) => {
    await executeDelete({ id: String(id) });
    if (onRefetch) {
      await onRefetch();
    }
  };
  const handleSubmit = async (data: IVisitForm) => {
    const payload = {
      ...data,
      visitorId: visitorId,
    };

    if (selectedVisit) {
      await updateVisit(payload, { id: String(selectedVisit.id) });
      if (onRefetch) {
        await onRefetch();
      }

      setIsModalOpen(false);
      setSelectedVisit(undefined);
      setShowRegisterAnother(false);
    } else {
      await postVisit(payload);
      if (onRefetch) {
        await onRefetch();
      }

      setShowRegisterAnother(true);
    }
  };
  // Table columns configuration
  const header: ColumnDef<VisitType>[] = [
    { accessorFn: (row) => formatDate(row.date), header: "Date" },
    { accessorKey: "eventName", header: "Event Name" },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }: { row: { original: (typeof visits)[number] } }) => (
        <div onClick={() => handleShowOptions(row.original.id)}>
          <ActionButton
            showOptions={row.original.id == selectedId}
            hideDelete={true}
            onEdit={() => {
              setSelectedVisit({
                id: row.original.id,
                date: row.original.date,
                eventId: row.original.eventId || "1",
                notes: row.original.notes || "",
              });
              setIsModalOpen(true);
            }}
            onDelete={() => deleteVisit(Number(row.original.id))}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <HeaderControls
        title="Visitor History"
        subtitle="Record of all visits to services and events"
        btnName="Record Visit"
        handleClick={() => setIsModalOpen(true)}
        screenWidth={window.innerWidth}
      />
      <div className="relative">
        {visits.length === 0 ? (
          <EmptyState
            scope="section"
            msg="No visit history yet"
            description="This visitor does not have any recorded visits yet."
          />
        ) : (
          <TableComponent data={visits} columns={header} />
        )}
      </div>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {showRegisterAnother ? (
          <AddAnotherConfirmation
            content={
              <div>
                <h3 className="text-lg font-semibold">
                  Record another visit?
                </h3>
                <p className="text-sm text-gray-600">
                  The visit was recorded successfully. Would you like to add another?
                </p>
              </div>
            }
            confirmationAction={() => {
              setShowRegisterAnother(false);
              setSelectedVisit(undefined);
              setFormResetKey((k) => k + 1);
              setIsModalOpen(true);
            }}
            cancelAction={() => {
              setShowRegisterAnother(false);
              setIsModalOpen(false);
              setSelectedVisit(undefined);
            }}
          />
        ) : (
          <VisitForm
            key={formResetKey}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleSubmit}
            initialData={selectedVisit}
            loading={postLoading || putLoading}
          />
        )}
      </Modal>
    </>
  );
};

interface Visit {
  id: number | string;
  visitorId: number | string;
  date: string;
  eventName?: string;
  eventId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
