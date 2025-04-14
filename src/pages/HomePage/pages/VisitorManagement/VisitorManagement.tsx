import Modal from "@/components/Modal";
import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { VisitorType } from "@/utils";
import { api } from "@/utils/api/apiCalls";
import { formatDate } from "@/utils/helperFunctions";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageOutline from "../../Components/PageOutline";
import TableComponent from "../../Components/reusable/TableComponent";
import SkeletonLoader from "../../Components/TableSkeleton";
import { showNotification } from "../../utils";
import { IVisitorForm, VisitorForm } from "./Components/VisitorForm";

export function VisitorManagement() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<number | string>("");
  const [, setVisitors] = useState<VisitorType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<
    IVisitorForm | undefined
  >(undefined);
  const { data, loading } = useFetch(api.fetch.fetchAllVisitors);
  const { executeDelete, success } = useDelete(api.delete.deleteVisitor);
  const { postData, loading: postLoading } = usePost(api.post.createVisitor);

  const visitors = useMemo(() => data?.data || [], [data]);

  useEffect(() => {
    if (success) {
      setVisitors((prevVisitors) =>
        prevVisitors.filter((visitor) => visitor.id !== selectedId.toString())
      );
      showNotification("Visitor deleted successfully", "success");
    }
  }, [success]);

  const handleShowOptions = (id: number | string) => {
    setSelectedId((prevSelectedId) => (prevSelectedId === id ? "" : id));
  };
  const handleSubmit = (visitor: IVisitorForm) => {
    console.log(visitor, "aha");
    postData(visitor);
  };

  const deleteVisitor = async (visitorId: number) => {
    executeDelete(visitorId);
  };

  const headings: ColumnDef<VisitorType>[] = [
    {
      header: "Full Name",
      cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "visitDate",
      header: "Visit Date",
      cell: ({ row }) => formatDate(row.original.visitDate),
    },

    {
      accessorKey: "eventName",
      header: "Event Name",
    },
    {
      accessorKey: "howHeard",
      header: "How Heard",
    },
    {
      accessorKey: "followUpStatus",
      header: "Follow-Up Status",
    },
    {
      accessorKey: "visitCount",
      header: "Visits",
    },
    {
      header: "Actions",
      accessorKey: "actions",
      // cell: ({ row }: { row: { original: (typeof visitors)[number] } }) => (
      //   <div onClick={() => handleShowOptions(row.original.id)}>
      //     <ActionButton
      //       showOptions={row.original.id == selectedId}
      //       hideDelete={false}
      //       onView={() => {
      //         navigate(`visitor/${row.original.id}`);
      //       }}
      //       onEdit={() => {
      //         setSelectedVisitor(row.original);
      //         setIsModalOpen(true);
      //       }}
      //       onDelete={() => {
      //         deleteVisitor(Number(row.original.id));
      //       }}
      //     />
      //   </div>
      // ),
    },
  ];

  return (
    <div className="p-4">
      <PageOutline>
        {/* {showFeedback && (
          <AlertComp
            message={feedback}
            type={"success"}
            onClose={() => setShowFeedback(false)}
          />
        )} */}
        {loading ? (
          <div className="space-y-4">
            <div className="animate-pulse space-y-2  w-[40rem] ">
              <div className="h-8 bg-lightGray rounded w-2/6"></div>
              <div className="h-6 bg-lightGray rounded w-4/6"></div>
            </div>
            <SkeletonLoader />
          </div>
        ) : (
          <div className="space-y-8">
            {/* <HeaderControls
              title="Visitor Management"
              showSubtitle={true}
              subtitle="Register, track, and analyze visitor information"
              btnName="Register visitor"
              handleNavigation={() => setIsModalOpen(true)}
            /> */}

            <div>
              <TableComponent data={visitors} columns={headings} />
            </div>
          </div>
        )}
        <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <VisitorForm
            onClose={() => setIsModalOpen(false)}
            selectedVisitor={selectedVisitor}
            onSubmit={handleSubmit}
            loading={postLoading}
          />
        </Modal>
      </PageOutline>
    </div>
  );
}
