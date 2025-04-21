import HeaderControls from "@/components/HeaderControls";
import Modal from "@/components/Modal";
import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { VisitorType } from "@/utils";
import { api } from "@/utils/api/apiCalls";
import { formatDate } from "@/utils/helperFunctions";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageOutline from "../../Components/PageOutline";
import ActionButton from "../../Components/reusable/ActionButton";
import TableComponent from "../../Components/reusable/TableComponent";
import SkeletonLoader from "../../Components/TableSkeleton";
import { showDeleteDialog, showNotification } from "../../utils";
import { IVisitorForm, VisitorForm } from "./Components/VisitorForm";
import { mapVisitorToForm } from "./utils/mapping";
import EmptyState from "@/components/EmptyState";

export function VisitorManagement() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<number | string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<
    IVisitorForm | undefined
  >(undefined);
  const { data, loading, refetch } = useFetch(api.fetch.fetchAllVisitors);
  const { executeDelete, success } = useDelete(api.delete.deleteVisitor);
  const { postData, loading: postLoading } = usePost(api.post.createVisitor);
  const { updateData, loading: putLoading } = usePut(api.put.updateVisitor);

  const visitors = useMemo(() => data?.data || [], [data]);

  useEffect(() => {
    if (success) {
      refetch();
      showNotification("Visitor deleted successfully", "success");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  const handleShowOptions = (id: number | string) => {
    setSelectedId((prevSelectedId) => (prevSelectedId === id ? "" : id));
  };
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedVisitor(undefined);
  };
  const handleSubmit = (visitor: IVisitorForm) => {
    if (selectedVisitor) updateData(visitor);
    else postData(visitor);
    setIsModalOpen(false);
  };

  const deleteVisitor = async (visitorId: number | string) => {
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
      cell: ({ row }) => (
        <div onClick={() => handleShowOptions(row.original.id)}>
          <ActionButton
            showOptions={row.original.id == selectedId}
            hideDelete={false}
            onView={() => {
              navigate(`visitor/${row.original.id}`);
            }}
            onEdit={() => {
              setSelectedVisitor(mapVisitorToForm(row.original));
              setIsModalOpen(true);
            }}
            onDelete={() => {
              showDeleteDialog(
                {
                  name:
                    row.original.lastName + " " + row.original?.firstName || "",
                  id: row.original.id,
                },
                deleteVisitor
              );
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-4">
      <PageOutline>
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
            <HeaderControls
              title="Visitor Management"
              showSubtitle={true}
              subtitle="Register, track, and analyze visitor information"
              btnName="Register visitor"
              screenWidth={window.innerWidth}
              handleNavigation={() => {
                setIsModalOpen(true);
                setSelectedVisitor(undefined);
              }}
            />
            <div>
              {
                visitors.length === 0 ? (
                  <div className="text-center py-8 w-1/4 mx-auto">
                    <EmptyState msg={"No visitor found"} />
                  </div>
                )
                :
                <TableComponent data={visitors} columns={headings} />}
            </div>
          </div>
        )}
        
      </PageOutline>
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <VisitorForm
            onClose={handleModalClose}
            selectedVisitor={selectedVisitor}
            onSubmit={handleSubmit}
            loading={postLoading || putLoading}
          />
        </Modal>
    </div>
  );
}
