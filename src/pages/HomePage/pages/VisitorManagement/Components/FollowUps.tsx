import { HeaderControls } from "@/components/HeaderControls";
import { Modal } from "@/components/Modal";
import { useDelete } from "@/CustomHooks/useDelete";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { api, formatDate } from "@/utils";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { FollowUpForm, IFollowUpForm } from "./FollowUpForm";
import edit from "/src/assets/edit.svg";

interface IProps {
  followUps: FollowUp[];
  visitorId: string;
}

export const FollowUps = ({ visitorId, followUps }: IProps) => {
  const [selectedFollowUp, setSelectedFollowUp] = useState<
    FollowUp | undefined
  >(undefined); // Store selected visit for editing
  const [isModalOpen, setIsModalOpen] = useState(false); // Track modal open state

  /* api calls */
  const { postData: postFollowUp, loading: postLoading } = usePost(
    api.post.createFollowUp
  );
  const { updateData: updateFollowUp, loading: putLoading } = usePut(
    api.put.updateFollowUp
  );
  const { executeDelete } = useDelete(api.delete.deleteFollowUp);
  const handleSubmit = async (data: IFollowUpForm) => {
    const payload = {
      ...data,
      visitorId: visitorId,
    };
    if (selectedFollowUp)
      await updateFollowUp(payload, { id: String(selectedFollowUp.id) });
    else await postFollowUp(payload);
    setIsModalOpen(false);
  };

  const header: ColumnDef<FollowUp>[] = [
    { accessorFn: (row) => formatDate(row.date), header: "Date" },
    { accessorKey: "type", header: "Type" },
    { accessorKey: "notes", header: "Notes" },
    { accessorKey: "assignedTo", header: "Assigned To" },
    {
      header: "Actions",
      cell: ({ row }) => (
        <div
          className={
            "text-sm h-6 flex items-center  gap-2 rounded-lg text-center text-white "
          }
        >
          <img
            src={edit}
            alt="edit icon"
            className="cursor-pointer"
            onClick={() => {
              // setSelectedFollowUp(row.original);
              setIsModalOpen(true);
            }}
          />
          {/* <img
            src={deleteIcon}
            alt="delete icon"
            className="cursor-pointer"
            onClick={() => {
              showDeleteDialog(
                { id: row.original.id, name: "this record" },
                executeDelete
              );
            }}
          /> */}
        </div>
      ),
    },
  ];
  return (
    <>
      <HeaderControls
        title="Follow-up History"
        subtitle="Record of all visits to services and events"
        btnName="Add Follow-up"
        handleClick={() => {
          setIsModalOpen(true);
        }}
        screenWidth={window.innerWidth}
      />
      <TableComponent data={followUps} columns={header} />
      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFollowUp(undefined);
        }}
      >
        <FollowUpForm
          onSubmit={handleSubmit}
          onClose={() => setIsModalOpen(false)}
          initialData={selectedFollowUp}
          loading={postLoading || putLoading}
        />
      </Modal>
    </>
  );
};

interface FollowUp {
  id: string;
  date: string;
  type: string;
  status: string;
  notes: string;
  assignedTo: string;
}
