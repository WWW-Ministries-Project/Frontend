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
import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageOutline from "../../Components/PageOutline";
import ActionButton from "../../Components/reusable/ActionButton";
import SkeletonLoader from "../../Components/TableSkeleton";
import { showDeleteDialog, showNotification } from "../../utils";
import { IVisitorForm, VisitorForm } from "./Components/VisitorForm";
import { mapVisitorToForm } from "./utils";
import AddAnotherConfirmation from "../../Components/reusable/AddAnotherConfirmation";
import { Button } from "@/components";

export function VisitorManagement() {
  const {
    user: { permissions },
  } = useAuth();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<number | string>("");
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showRegisterAnother, setShowRegisterAnother] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<
    (IVisitorForm & { id: string }) | undefined
  >(undefined);
  const [formResetKey, setFormResetKey] = useState(0);
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
    createdMonth: "",
    visitMonth: "",
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
        ? visitor?.eventName === filters.event
        : true;

      const referralMatch = filters.referral
        ? visitor.howHeard === filters.referral
        : true;

      const searchMatch = filterVisitors
        ? `${visitor.firstName} ${visitor.lastName} ${visitor.email ?? ""} ${
            visitor.phone ?? ""
          }`
            .toLowerCase()
            .includes(filterVisitors.toLowerCase())
        : true;

      return (
        createdMatch &&
        visitMatch &&
        eventMatch &&
        referralMatch &&
        searchMatch
      );
    });
  }, [data, filters, filterVisitors]);

  const [groupBy, setGroupBy] = useState<"date" | "event">("date");

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const groupedVisitors = useMemo(() => {
    const groups: Record<string, VisitorType[]> = {};

    visitors.forEach((visitor) => {
      let key = "";

      if (groupBy === "date") {
        const d = new Date(visitor.visitDate);
        // Use sortable key internally
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      } else {
        key = visitor.eventName || "No Event";
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(visitor);
    });

    // Sort date groups (latest first) and convert keys to readable labels
    if (groupBy === "date") {
      return Object.fromEntries(
        Object.entries(groups)
          .sort(([a], [b]) => new Date(b + "-01").getTime() - new Date(a + "-01").getTime())
          .map(([key, value]) => {
            const d = new Date(key + "-01");
            const label = `${d.toLocaleString("default", { month: "long" })} ${d.getFullYear()}`;
            return [label, value];
          })
      );
    }

    return groups;
  }, [visitors, groupBy]);

  useEffect(() => {
    const keys = Object.keys(groupedVisitors);
    if (keys.length === 0) return;

    let defaultKey = keys[0];

    if (groupBy === "date") {
      defaultKey =
        keys
          .map((k) => ({ key: k, date: new Date(k) }))
          .sort((a, b) => b.date.getTime() - a.date.getTime())[0]?.key || keys[0];
    }

    setOpenGroups({ [defaultKey]: true });
  }, [groupedVisitors, groupBy]);

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
    if (postSuccess) {
      showNotification("Visitor added successfully", "success");
      refetch();
      setShowRegisterAnother(true);
    }

    if (putSuccess) {
      showNotification("Visitor updated successfully", "success");
      refetch().then(() => {
        setIsModalOpen(false);
        setShowRegisterAnother(false);
        setSelectedVisitor(undefined);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postSuccess, putSuccess]);

  const handleShowOptions = (id: number | string) => {
    setSelectedId((prevSelectedId) => (prevSelectedId === id ? "" : id));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      ) {
        setSelectedId("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
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

  // const headings: ColumnDef<VisitorType>[] = [
  //   {
  //     header: "Full Name",
  //     accessorKey: "lastName",
  //     cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
  //   },
  //   {
  //     accessorKey: "firstName",
  //   },
  //   {
  //     accessorKey: "email",
  //     header: "Email",
  //   },
  //   {
  //     accessorKey: "phone",
  //     header: "Phone",
  //     cell: ({ row }) =>
  //       formatPhoneNumber(row.original.country_code, row.original.phone) || "",
  //   },
  //   {
  //     accessorKey: "visitDate",
  //     header: "Visit Date",
  //     cell: ({ row }) => formatDate(row.original.visitDate || "") || "",
  //   },

  //   {
  //     accessorKey: "eventName",
  //     header: "Event Name",
  //   },
  //   {
  //     accessorKey: "howHeard",
  //     header: "Referral",
  //   },
  //   {
  //     accessorKey: "followUp",
  //     header: "Follow-Up Status",
  //   },
  //   {
  //     accessorKey: "visitCount",
  //     header: "Visits",
  //   },
  //   {
  //     header: "Actions",
  //     accessorKey: "actions",
  //     cell: ({ row }) => (
  //       <div onClick={() => handleShowOptions(row.original.id)}>
  //         <ActionButton
  //           showOptions={row.original.id == selectedId}
  //           hideDelete={false}
  //           onView={() => {
  //             navigate(`visitor/${row.original.id}`);
  //           }}
  //           onEdit={() => {
  //             setSelectedVisitor(mapVisitorToForm(row.original));
  //             setIsModalOpen(true);
  //           }}
  //           onDelete={() => {
  //             showDeleteDialog(
  //               {
  //                 name:
  //                   row.original.lastName + " " + row.original?.firstName || "",
  //                 id: row.original.id,
  //               },
  //               deleteVisitor
  //             );
  //           }}
  //         />
  //       </div>
  //     ),
  //   },
  // ];

  // Determine if backend returned any data at all
  const hasBackendData = Boolean(data?.data && data.data.length > 0);

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
                  <div className="flex flex-wrap gap-4">
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-600 mb-1">Created month</label>
                      <input
                        type="month"
                        className="h-10 border rounded px-3"
                        value={filters.createdMonth}
                        onChange={(e) => handleFilterChange("createdMonth", e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs text-gray-600 mb-1">Visit month</label>
                      <input
                        type="month"
                        className="h-10 border rounded px-3"
                        value={filters.visitMonth}
                        onChange={(e) => handleFilterChange("visitMonth", e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs text-gray-600 mb-1">Event</label>
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
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs text-gray-600 mb-1">Referral</label>
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
                    </div>
                  </div>
                 <div className="flex flex-col ">
                      <label className="text-xs text-gray-600 mb-1">Reset</label>
                    <button
                    className="h-10 px-4 border rounded text-sm"
                    onClick={() =>
                      setFilters({
                        createdMonth: '',
                        visitMonth: '',
                        event: "",
                        referral: "",
                      })
                    }
                  >
                    Reset Filters
                  </button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <button
              className={`px-3 py-1 rounded text-sm border ${
                groupBy === "date" ? "bg-primary text-white" : ""
              }`}
              onClick={() => setGroupBy("date")}
            >
              Group by Date
            </button>
            <button
              className={`px-3 py-1 rounded text-sm border ${
                groupBy === "event" ? "bg-primary text-white" : ""
              }`}
              onClick={() => setGroupBy("event")}
            >
              Group by Event
            </button>
          </div>

          {!hasBackendData && !loading && (
            <EmptyState msg="No visitor found" />
          )}

          {hasBackendData && visitors.length === 0 && (
            <EmptyState msg="No visitors match the selected filters" />
          )}

          

          {Object.entries(groupedVisitors).map(([group, items]) => (
            <div key={group} className="space-y-3">
              <button
                className="w-full flex justify-between items-center font-semibold text-lg py-2"
                onClick={() =>
                  setOpenGroups((prev) => ({
                    ...prev,
                    [group]: !prev[group],
                  }))
                }
              >
                <span>{group}</span>
                <span className="text-sm">
                  {openGroups[group] ? "−" : "+"}
                </span>
              </button>

              {openGroups[group] && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((visitor) => (
                    <div
                      key={visitor.id}
                      className="relative border rounded-lg p-4 space-y-3 bg-white shadow-sm"
                    >
                      <div
                        ref={visitor.id === selectedId ? actionMenuRef : null}
                        className="absolute top-3 right-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowOptions(visitor.id);
                        }}
                      >
                        <ActionButton
                          showOptions={visitor.id === selectedId}
                          hideDelete={false}
                          onView={() => navigate(`visitor/${visitor.id}`)}
                          onEdit={() => {
                            setSelectedVisitor(mapVisitorToForm(visitor));
                            setIsModalOpen(true);
                            
                          }}
                          onDelete={() => {
                            showDeleteDialog(
                              {
                                name: `${visitor.lastName} ${visitor.firstName}`,
                                id: visitor.id,
                              },
                              deleteVisitor
                            );
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="text-base font-semibold text-gray-900">
                          {visitor.title} {visitor.firstName} {visitor.lastName}
                        </div>

                        <div className="text-sm text-gray-600">
                          <span className="font-medium text-gray-700">Visit date:</span>{" "}
                          {formatDate(visitor.visitDate)}
                        </div>

                        <div className="text-sm text-gray-600">
                          <span className="font-medium text-gray-700">Phone:</span>{" "}
                          {formatPhoneNumber(visitor.country_code, visitor.phone)}
                        </div>

                        <div className="text-sm text-gray-600">
                          <span className="font-medium text-gray-700">Event:</span>{" "}
                          {visitor.eventName || "—"}
                        </div>

                        <div className="text-sm text-gray-600">
                          <span className="font-medium text-gray-700">Follow-up status:</span>{" "}
                          {visitor.followUp || "—"}
                        </div>

                        <Button
                        value="View full profile"
                        variant="secondary"
                          className="mt-2 inline-flex items-center text-sm font-medium text-primary hover:underline w-full"
                          onClick={() => navigate(`visitor/${visitor.id}`)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <VisitorForm
          key={formResetKey}
          onClose={handleModalClose}
          selectedVisitor={selectedVisitor}
          onSubmit={handleSubmit}
          loading={postLoading || putLoading}
        />
      </Modal>

      <Modal
        open={showRegisterAnother}
        onClose={() => {
          setShowRegisterAnother(false);
        }}
      >
        <AddAnotherConfirmation
          content={
            <div>
              <h3 className="text-lg font-semibold">
                Register another visitor?
              </h3>
              <p className="text-sm text-gray-600">
                The visitor was registered successfully. Would you like to add another?
              </p>
            </div>
          }
          confirmationAction={() => {
            setShowRegisterAnother(false);
            setSelectedVisitor(undefined);
            setFormResetKey((k) => k + 1);
            setIsModalOpen(true);
          }}
          cancelAction={() => {
            setShowRegisterAnother(false);
            setIsModalOpen(false);
            setSelectedVisitor(undefined);
          }}
        />
       
      </Modal>
    </PageOutline>
  );
}
