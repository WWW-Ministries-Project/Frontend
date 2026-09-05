import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import DOMPurify from "dompurify";
import { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components";
import { HeaderControls } from "@/components/HeaderControls";
import { Modal } from "@/components/Modal";
import EmptyState from "@/components/EmptyState";
import { Badge } from "@/components/Badge";
import { ActionsMenu } from "@/pages/HomePage/Components/reusable/ActionsMenu";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { useRouteAccess } from "@/context/RouteAccessContext";

import { useFetch } from "@/CustomHooks/useFetch";
import { useDelete } from "@/CustomHooks/useDelete";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { usePaginationQueryParams } from "@/CustomHooks/usePaginationQueryParams";

import { showDeleteDialog, showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import { LifeCenterMemberType } from "@/utils";
import {
  MeetingAttendeeType,
  MeetingType,
} from "@/utils/api/lifeCenter/interfaces";

import { MeetingExportModal } from "./MeetingExportModal";
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
  const [openModal, setOpenModal] = useState(false);
  const [openExportModal, setOpenExportModal] = useState(false);
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

  // ActionsMenu has no built-in permission gating (unlike the old
  // ActionButton/Action pair, which read useRouteAccess() internally) — so
  // it's computed here instead. Route mode (admin/HomePage side) defers to
  // the real RouteAccessProvider; membership mode (member portal, no such
  // provider) gates purely on leadership status.
  const { canManageCurrentRoute, canAdminCurrentRoute } = useRouteAccess();
  const canManageHere = accessMode === "route" || isLeadershipMember;
  const canEdit =
    accessMode === "route" ? canManageCurrentRoute : isLeadershipMember;
  const canDelete =
    accessMode === "route" ? canAdminCurrentRoute : isLeadershipMember;

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

  useEffect(() => {
    if (!viewing) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewing(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [viewing]);

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

  const attendeeColumns = useMemo<ColumnDef<MeetingAttendeeType>[]>(
    () => [
      { header: "Name", cell: ({ row }) => row.original.name },
      {
        header: "Phone",
        cell: ({ row }) => {
          const country_code = row.original.phone?.country_code;
          const number = row.original.phone?.number;
          return country_code && number
            ? `${country_code} ${number}`
            : "—";
        },
      },
      {
        header: "Gender",
        cell: ({ row }) => row.original.gender ?? "—",
      },
      {
        header: "Type",
        cell: ({ row }) =>
          row.original.isFirstTimer ? (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
              First Timer
            </Badge>
          ) : (
            "Member"
          ),
      },
    ],
    []
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
          const menuActions = [
            { label: "View", onClick: () => setViewing(meeting) },
            ...(canEdit
              ? [
                  {
                    label: "Edit",
                    onClick: () => {
                      setEditing(meeting);
                      setOpenModal(true);
                    },
                  },
                ]
              : []),
            ...(canDelete
              ? [
                  {
                    label: "Delete",
                    variant: "danger" as const,
                    onClick: () => handleDelete(meeting),
                  },
                ]
              : []),
          ];
          return <ActionsMenu actions={menuActions} />;
        },
      },
    ],
    [canEdit, canDelete, handleDelete]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
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
        </div>
        {/* Exporting only ever returns what this list already shows, so it is
            available to anyone who can see the list. */}
        <Button
          value="Download"
          variant="secondary"
          requireManageAccess={false}
          onClick={() => setOpenExportModal(true)}
        />
      </div>

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

      <Modal
        open={openExportModal}
        persist={false}
        className="max-w-xl"
        onClose={() => setOpenExportModal(false)}
      >
        <MeetingExportModal
          lifeCenterId={lifeCenterId}
          onClose={() => setOpenExportModal(false)}
        />
      </Modal>

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

      {viewing && (
        <div
          className="fixed inset-0 z-[130] flex h-[100dvh] w-screen flex-col overflow-hidden bg-white"
          role="dialog"
          aria-modal="true"
        >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-primary px-6 py-4 text-white">
              <div>
                <h3 className="text-lg font-semibold">
                  Meeting — {format(new Date(viewing.date), "dd MMM yyyy")}
                </h3>
                <p className="text-sm text-white/80">
                  Offering: {viewing.currency} {viewing.offeringAmount}
                </p>
              </div>
              <button
                type="button"
                className="rounded-md px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
                onClick={() => setViewing(null)}
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
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

              {viewing.attendees.length > 0 ? (
                <TableComponent
                  columns={attendeeColumns}
                  data={viewing.attendees}
                  total={viewing.attendees.length}
                  displayedCount={viewing.attendees.length}
                  getRowId={(a) => String(a.soulWonId)}
                  showNumberColumn={false}
                />
              ) : (
                <EmptyState
                  scope="section"
                  msg="No attendees recorded"
                  description="No one was marked present or first-timer for this meeting."
                />
              )}
            </div>
        </div>
      )}
    </div>
  );
};
