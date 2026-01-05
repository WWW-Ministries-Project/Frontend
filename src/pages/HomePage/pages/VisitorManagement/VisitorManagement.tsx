import EmptyState from "@/components/EmptyState";
import { HeaderControls } from "@/components/HeaderControls";
import { Modal } from "@/components/Modal";
import { SearchBar } from "@/components/SearchBar";
import { useAuth } from "@/context/AuthWrapper";
import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import {
  api,
  formatDate,
  formatPhoneNumber,
  relativePath,
  VisitorType,
} from "@/utils";
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
  const [showFilter, setShowFilter] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterVisitors(e.target.value);
  };

  const currentMonth = `${new Date().getFullYear()}-${String(
    new Date().getMonth() + 1
  ).padStart(2, "0")}`;

  const [filters, setFilters] = useState({
    createdMonth: currentMonth,
    visitMonth: currentMonth,
    event: "",
    referral: "",
  });

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const visitors = useMemo(() => {
    if (!data?.data) return [];

    return data.data.filter((visitor: VisitorType) => {
      const createdDate = new Date(visitor.createdAt);
      const visitDate = new Date(visitor.visitDate);

      const createdMatch = filters.createdMonth
        ? `${createdDate.getFullYear()}-${String(
            createdDate.getMonth() + 1
          ).padStart(2, "0")}` === filters.createdMonth
        : true;

      const visitMatch = filters.visitMonth
        ? `${visitDate.getFullYear()}-${String(
            visitDate.getMonth() + 1
          ).padStart(2, "0")}` === filters.visitMonth
        : true;

      const eventMatch = filters.event
        ? visitor.eventName
            ?.toLowerCase()
            .includes(filters.event.toLowerCase())
        : true;

      const referralMatch = filters.referral
        ? visitor.howHeard
            ?.toLowerCase()
            .includes(filters.referral.toLowerCase())
        : true;

      return createdMatch && visitMatch && eventMatch && referralMatch;
    });
  }, [data, filters]);

  const eventOptions = useMemo(() => {
    if (!data?.data) return [];
    return Array.from(
      new Set(data.data.map((v: VisitorType) => v.eventName).filter(Boolean))
    );
  }, [data]);

  const referralOptions = useMemo(() => {
    if (!data?.data) return [];
    return Array.from(
      new Set(data.data.map((v: VisitorType) => v.howHeard).filter(Boolean))
    );
  }, [data]);

  const crumbs = [
    { label: "Home", link: relativePath.home.main },
    { label: "Visitor", link: "" },
  ];

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
      accessorKey: "firstName",
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
    <PageOutline crumbs={crumbs} className="p-6">
      {loading && visitors.length === 0 ? (
        <div className="space-y-4">
          <div className="animate-pulse space-y-2  w-[40rem] ">
            <div className="h-8 bg-lightGray rounded w-2/6"></div>
            <div className="h-6 bg-lightGray rounded w-4/6"></div>
          </div>
          <SkeletonLoader />
        </div>
      ) : (
        <div className="space-y-8 ">
          <HeaderControls
            title="Visitor Management"
            subtitle="Register, track, and analyze visitor information"
            btnName={permissions.manage_visitors ? "Register visitor" : ""}
            hasFilter
            hasSearch
            showFilter={showFilter}
            setShowFilter={setShowFilter}
            showSearch={showSearch}
            setShowSearch={setShowSearch}
            screenWidth={window.innerWidth}
            handleClick={() => {
              setIsModalOpen(true);
              setSelectedVisitor(undefined);
            }}
          />
          {(showFilter || showSearch) && (
            <div className="w-full flex flex-wrap gap-3 mb-4">
              {showSearch && (
                <SearchBar
                  className="h-10 max-w-xs"
                  placeholder="Search visitors..."
                  value={filterVisitors}
                  onChange={handleSearchChange}
                  id="searchVisitors"
                />
              )}
              {showFilter && (
                <>
                  <input
                    type="month"
                    className="h-10 border rounded px-3"
                    value={filters.createdMonth}
                    onChange={(e) => handleFilterChange("createdMonth", e.target.value)}
                  />

                  <input
                    type="month"
                    className="h-10 border rounded px-3"
                    value={filters.visitMonth}
                    onChange={(e) => handleFilterChange("visitMonth", e.target.value)}
                  />

                  <select
                    className="h-10 border rounded px-3"
                    value={filters.event}
                    onChange={(e) => handleFilterChange("event", e.target.value)}
                  >
                    <option value="">All Events</option>
                    {eventOptions.map((event) => (
                      <option key={event} value={event}>
                        {event}
                      </option>
                    ))}
                  </select>

                  <select
                    className="h-10 border rounded px-3"
                    value={filters.referral}
                    onChange={(e) => handleFilterChange("referral", e.target.value)}
                  >
                    <option value="">All Referrals</option>
                    {referralOptions.map((ref) => (
                      <option key={ref} value={ref}>
                        {ref}
                      </option>
                    ))}
                  </select>

                  <button
                    className="h-10 px-4 border rounded text-sm"
                    onClick={() =>
                      setFilters({
                        createdMonth: "",
                        visitMonth: "",
                        event: "",
                        referral: "",
                      })
                    }
                  >
                    Clear Filters
                  </button>
                </>
              )}
            </div>
          )}
          {visitors.length === 0 && <EmptyState msg={"No visitor found"} />}
          {visitors.length > 0 && (
            <TableComponent
              data={visitors}
              columns={headings}
              columnVisibility={{
                actions: permissions.manage_visitors,
                firstName: false,
              }}
              filter={filterVisitors}
              setFilter={setFilterVisitors}
            />
          )}
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
