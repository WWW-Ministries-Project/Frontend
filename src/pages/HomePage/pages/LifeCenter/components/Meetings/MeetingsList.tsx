import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import DOMPurify from "dompurify";
import { ColumnDef } from "@tanstack/react-table";

import { HeaderControls } from "@/components/HeaderControls";
import { Modal } from "@/components/Modal";
import EmptyState from "@/components/EmptyState";
import { Badge } from "@/components/Badge";
import ActionButton from "@/pages/HomePage/Components/reusable/ActionButton";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";

import { useFetch } from "@/CustomHooks/useFetch";
import { useDelete } from "@/CustomHooks/useDelete";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { usePaginationQueryParams } from "@/CustomHooks/usePaginationQueryParams";

import { showDeleteDialog, showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import { LifeCenterMemberType } from "@/utils";
import { MeetingType } from "@/utils/api/lifeCenter/interfaces";

import { MeetingForm } from "./MeetingForm";

interface IProps {
  lifeCenterId: string;
  leader: LifeCenterMemberType | undefined;
  accessMode: "route" | "membership";
  isLeadershipMember?: boolean;
}

export const MeetingsList = ({
  lifeCenterId,
  leader,
  accessMode,
  isLeadershipMember = false,
}: IProps) => {
  const { page, take, setPage } = usePaginationQueryParams(10);
  const [selectedId, setSelectedId] = useState<string | number>("");
  const [openModal, setOpenModal] = useState(false);
  const [viewing, setViewing] = useState<MeetingType | null>(null);
  const [editing, setEditing] = useState<MeetingType | null>(null);

  const { data, refetch } = useFetch(api.fetch.fetchMeetings, {
    lifeCenterId,
    page,
    take,
  });

  const { executeDelete } = useDelete(api.delete.deleteMeeting);
  const {
    postData,
    data: postResponse,
    loading: isPosting,
  } = usePost(api.post.createMeeting);
  const {
    updateData,
    data: updateResponse,
    loading: isUpdating,
  } = usePut(api.put.updateMeeting);

  const meetings = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  // Route-mode edit/delete is gated by ActionButton's own useRouteAccess
  // check (default true/true props, deferring entirely to the real
  // RouteAccessProvider on that route). Membership-mode passes
  // requireManageAccess/requireAdminAccess=false and instead gates by
  // whether onEdit/onDelete are even defined, since useRouteAccess()
  // defaults to permissive true/true outside a RouteAccessProvider and
  // MyLifeCenter.tsx has no such provider.
  const canManageHere = accessMode === "route" || isLeadershipMember;

  const closeFormModal = () => {
    setOpenModal(false);
    setEditing(null);
  };

  useEffect(() => {
    if (postResponse?.data) {
      // Backend sorts by date desc, so a new meeting lands on page 1 —
      // jump there so it's visible even if the user was on a later page.
      setPage(1);
      refetch();
      showNotification("Meeting added successfully", "success");
      closeFormModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postResponse]);

  useEffect(() => {
    if (updateResponse?.data) {
      refetch();
      showNotification("Meeting updated successfully", "success");
      closeFormModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateResponse]);

  const handleSave = (payload: {
    id?: string;
    lifeCenterId: string;
    date: string;
    offeringAmount: string;
    currency: string;
    note: string | null;
    attendeeSoulWonIds: number[];
    firstTimerSoulWonIds: number[];
    newFirstTimers: unknown[];
  }) => {
    if (payload.id) {
      updateData(payload, { id: payload.id });
    } else {
      postData(payload);
    }
  };

  const handleDelete = useCallback(
    (meeting: MeetingType) => {
      showDeleteDialog(
        {
          id: String(meeting.id),
          name: format(new Date(meeting.date), "dd MMM yyyy"),
        },
        async () => {
          await executeDelete({ id: meeting.id });
          refetch();
          showNotification("Meeting deleted successfully", "success");
        }
      );
    },
    [executeDelete, refetch]
  );

  const columns = useMemo<ColumnDef<MeetingType>[]>(
    () => [
      {
        header: "Date",
        cell: ({ row }) => format(new Date(row.original.date), "dd MMM yyyy"),
      },
      {
        header: "Offering",
        cell: ({ row }) =>
          `${row.original.currency} ${row.original.offeringAmount}`,
      },
      {
        header: "Attendees",
        cell: ({ row }) => {
          const count = row.original.attendees.filter(
            (a) => !a.isFirstTimer
          ).length;
          return <Badge>{count}</Badge>;
        },
      },
      {
        header: "First timers",
        cell: ({ row }) => {
          const count = row.original.attendees.filter(
            (a) => a.isFirstTimer
          ).length;
          return <Badge>{count}</Badge>;
        },
      },
      {
        header: "Actions",
        cell: ({ row }) => {
          const meeting = row.original;
          return (
            <div
              onClick={() =>
                setSelectedId((prev) => (prev === meeting.id ? "" : meeting.id))
              }
            >
              <ActionButton
                showOptions={meeting.id === selectedId}
                onView={() => setViewing(meeting)}
                onEdit={
                  canManageHere
                    ? () => {
                        setEditing(meeting);
                        setOpenModal(true);
                      }
                    : undefined
                }
                onDelete={
                  canManageHere ? () => handleDelete(meeting) : undefined
                }
                requireManageAccess={accessMode === "route"}
                requireAdminAccess={accessMode === "route"}
              />
            </div>
          );
        },
      },
    ],
    [selectedId, canManageHere, accessMode, handleDelete]
  );

  return (
    <div className="space-y-6">
      <HeaderControls
        title={`My Meetings (${total})`}
        subtitle=""
        screenWidth={window.innerWidth}
        btnName={canManageHere ? "Create Meeting" : ""}
        handleClick={() => {
          setEditing(null);
          setOpenModal(true);
        }}
      />

      <hr />

      {meetings.length > 0 ? (
        <TableComponent
          columns={columns}
          data={meetings}
          total={total}
          displayedCount={take}
          onPageChange={(newPage) => setPage(newPage)}
        />
      ) : (
        <EmptyState
          scope="section"
          msg="No meetings recorded yet"
          description="Meetings you create for this life center will appear here."
        />
      )}

      <Modal open={openModal} onClose={closeFormModal}>
        <MeetingForm
          lifeCenterId={lifeCenterId}
          editData={editing}
          leader={leader}
          loading={isPosting || isUpdating}
          onSubmit={(payload) => {
            handleSave(payload);
          }}
          onClose={closeFormModal}
        />
      </Modal>

      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)}>
        {viewing && (
          <div className="p-6 max-w-lg mx-auto bg-white rounded-lg space-y-3">
            <h3 className="text-lg font-semibold">
              Meeting — {format(new Date(viewing.date), "dd MMM yyyy")}
            </h3>
            <p className="text-sm text-gray-600">
              Offering: {viewing.currency} {viewing.offeringAmount}
            </p>
            <div>
              <p className="font-medium text-sm">Attendees</p>
              {viewing.attendees.filter((a) => !a.isFirstTimer).length > 0 ? (
                <ul className="text-sm text-gray-700 list-disc pl-5">
                  {viewing.attendees
                    .filter((a) => !a.isFirstTimer)
                    .map((a) => (
                      <li key={a.soulWonId}>{a.name}</li>
                    ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">None recorded</p>
              )}
            </div>
            {viewing.attendees.some((a) => a.isFirstTimer) && (
              <div>
                <p className="font-medium text-sm">First timers</p>
                <ul className="text-sm text-gray-700 list-disc pl-5">
                  {viewing.attendees
                    .filter((a) => a.isFirstTimer)
                    .map((a) => (
                      <li key={a.soulWonId}>{a.name}</li>
                    ))}
                </ul>
              </div>
            )}
            {viewing.note && (
              <div className="rounded-md border border-gray-200 p-3">
                <p className="font-medium text-sm mb-1">Notes</p>
                <div
                  className="text-sm text-gray-700 prose"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(viewing.note),
                  }}
                />
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md"
                onClick={() => setViewing(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
