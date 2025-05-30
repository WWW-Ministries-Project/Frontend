import { HeaderControls } from "@/components/HeaderControls";
import Modal from "@/components/Modal";
import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import ActionButton from "@/pages/HomePage/Components/reusable/ActionButton";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { api, formatDate, VisitType } from "@/utils";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IVisitForm, VisitForm } from "./VisitForm";

interface IProps {
  visitorId: string;
  visits: Visit[];
}
export const Visits = ({ visitorId, visits }: IProps) => {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<number | string>(""); // Track selected row for actions
  const [isModalOpen, setIsModalOpen] = useState(false); // Track modal open state
  const [selectedVisit, setSelectedVisit] = useState<
    (IVisitForm & { id: string | number }) | undefined
  >(undefined); // Store selected visit for editing

  //API
  const { refetch: fetchVisits } = useFetch(
    api.fetch.fetchAllVisitsByVisitorId,
    { id: visitorId },
    true
  );
  const { postData: postVisit, loading: postLoading } = usePost(
    api.post.createVisit
  );
  const { updateData: updateVisit, loading: putLoading } = usePut(
    api.put.updateVisit
  );
  const { executeDelete, loading: deleteLoading } = useDelete(
    api.delete.deleteVisit
  );

  // Function to toggle the options menu for each row
  const handleShowOptions = (id: number | string) => {
    setSelectedId((prevSelectedId) => (prevSelectedId === id ? "" : id));
  };

  // Function to delete a visit
  const deleteVisit = async (id: number) => {
    executeDelete({ id: String(id) });
  };
  const handleSubmit = async (data: IVisitForm) => {
    const payload = {
      ...data,
      visitorId: visitorId,
    };
    if (selectedVisit) {
      await updateVisit(payload, { id: String(selectedVisit.id) }).then(() =>
        fetchVisits()
      );
    } else await postVisit(payload).then(() => fetchVisits());
    setIsModalOpen(false);
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
            onView={() => {
              navigate(`visitor/${row.original.id}`);
            }}
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
      />

      <TableComponent data={visits} columns={header} />

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <VisitForm
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
          initialData={selectedVisit} // Pass the selected visit data for editing
          loading={postLoading || putLoading}
        />
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
