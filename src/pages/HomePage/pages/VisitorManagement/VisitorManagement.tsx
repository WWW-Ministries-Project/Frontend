import EmptyState from "@/components/EmptyState";
import { HeaderControls } from "@/components/HeaderControls";
import Modal from "@/components/Modal";
import SearchBar from "@/components/SearchBar";
import { useAuth } from "@/context/AuthWrapper";
import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { api, formatDate, formatPhoneNumber, VisitorType } from "@/utils";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageOutline from "../../Components/PageOutline";
import ActionButton from "../../Components/reusable/ActionButton";
import TableComponent from "../../Components/reusable/TableComponent";
import SkeletonLoader from "../../Components/TableSkeleton";
import { showDeleteDialog, showNotification } from "../../utils";
import { IVisitorForm, VisitorForm } from "./Components/VisitorForm";
import { mapVisitorToForm } from "./utils";

export function VisitorManagement() {
  const {
    user: { permissions },
  } = useAuth();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<number | string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<
    (IVisitorForm & { id: string }) | undefined
  >(undefined);
  const { data, loading, refetch } = useFetch(api.fetch.fetchAllVisitors);
  const { executeDelete, success } = useDelete(api.delete.deleteVisitor);
  const {
    postData,
    loading: postLoading,
    data: postSuccess,
  } = usePost(api.post.createVisitor);
  const {
    updateData,
    loading: putLoading,
    data: putSuccess,
  } = usePut(api.put.updateVisitor);

  const [filterVisitors, setFilterVisitors] = useState("");
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterVisitors(e.target.value);
  };

  const visitors = useMemo(() => data?.data || [], [data]);

  useEffect(() => {
    if (success) {
      refetch();
      showNotification("Visitor deleted successfully", "success");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  useEffect(() => {
    if (postSuccess || putSuccess) {
      showNotification(
        `Visitor ${putSuccess ? "updated" : "added"} successfully`,
        "success"
      );
      refetch().then(() => setIsModalOpen(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postSuccess, putSuccess]);

  const handleShowOptions = (id: number | string) => {
    setSelectedId((prevSelectedId) => (prevSelectedId === id ? "" : id));
  };
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedVisitor(undefined);
  };
  const handleSubmit = (visitor: IVisitorForm & { id?: string }) => {
    if (selectedVisitor) updateData(visitor, { id: selectedVisitor.id });
    else postData(visitor);
  };

  const deleteVisitor = async (visitorId: number | string) => {
    executeDelete({ id: String(visitorId) });
  };

  const headings: ColumnDef<VisitorType>[] = [
    {
      header: "Full Name",
      accessorKey: "lastName",
      cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) =>
        formatPhoneNumber(row.original.country_code, row.original.phone) || "",
    },
    {
      accessorKey: "visitDate",
      header: "Visit Date",
      cell: ({ row }) => formatDate(row.original.visitDate || "") || "",
    },

    {
      accessorKey: "eventName",
      header: "Event Name",
    },
    {
      accessorKey: "howHeard",
      header: "Referral",
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
            subtitle="Register, track, and analyze visitor information"
            btnName={permissions.manage_visitors ? "Register visitor" : ""}
            screenWidth={window.innerWidth}
            handleClick={() => {
              setIsModalOpen(true);
              setSelectedVisitor(undefined);
            }}
          />
          <div>
            {visitors.length === 0 ? (
              <div className="text-center py-8 w-1/4 mx-auto">
                <EmptyState msg={"No visitor found"} />
              </div>
            ) : (
              <>
                <div className={`w-full flex gap-2`}>
                  <SearchBar
                    className="h-10 mb-4 max-w-xs"
                    placeholder="Search visitors here..."
                    value={filterVisitors}
                    onChange={handleSearchChange}
                    id="searchVisitors"
                  />
                </div>
                <TableComponent
                  data={visitors}
                  columns={headings}
                  columnVisibility={{ actions: permissions.manage_visitors }}
                  filter={filterVisitors}
                  setFilter={setFilterVisitors}
                />
              </>
            )}
          </div>
        </div>
      )}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <VisitorForm
          onClose={handleModalClose}
          selectedVisitor={selectedVisitor}
          onSubmit={handleSubmit}
          loading={postLoading || putLoading}
        />
      </Modal>
    </PageOutline>
  );
}
