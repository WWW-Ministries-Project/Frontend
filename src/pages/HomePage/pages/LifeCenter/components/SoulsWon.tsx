import {
  PhoneIcon,
  MapPinIcon,
  CalendarDaysIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useMemo, useState } from "react";
import { format, getWeek } from "date-fns";

import { HeaderControls } from "@/components/HeaderControls";
import { Modal } from "@/components/Modal";
import EmptyState from "@/components/EmptyState";
import ActionButton from "@/pages/HomePage/Components/reusable/ActionButton";

import { useDelete } from "@/CustomHooks/useDelete";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";

import { showDeleteDialog, showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";

import { LifeCenterMemberType } from "@/utils";
import { ISoulsWonForm, SoulsWonForm } from "./SoulsWonForm";
import { matchRoutes, useLocation } from "react-router-dom";
import { routes } from "@/routes/appRoutes";

interface IProps {
  soulsWon: ISoulsWonForm[];
  lifeCenterId: string;
  handleSuccess: () => void;
  hasMembers: boolean;
  leader: LifeCenterMemberType | undefined;
}

export const SoulsWon = ({
  soulsWon,
  lifeCenterId,
  handleSuccess,
  hasMembers,
  leader,
}: IProps) => {
  const [selectedId, setSelectedId] = useState<number | string>("");
  const [openMonth, setOpenMonth] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [soulWon, setSoulWon] = useState<ISoulsWonForm | null>(null);
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
  const [accessDeniedAction, setAccessDeniedAction] = useState<'edit' | 'delete' | ''>('');

  const location = useLocation();
  
  const matches = matchRoutes(routes, location);
  const routeName = matches?.find((m) => m.route.name)?.route.name;

  const { executeDelete } = useDelete(api.delete.deleteSoulWon);
  const {
    postData,
    data: postResponse,
    loading: isPosting,
  } = usePost(api.post.createSoul);
  const {
    updateData,
    data: updateResponse,
    loading: isUpdating,
  } = usePut(api.put.updateSoul);

  const handleShowOptions = useCallback((id: number | string) => {
    setSelectedId((prev) => (prev === id ? "" : id));
  }, []);

  const handleDeleteSoul = useCallback(
    (id: string, name: string) => {
      if (routeName === "member") {
        setAccessDeniedAction('delete');
        setShowAccessDeniedModal(true);
        return;
      }

      showDeleteDialog({ id, name }, async () => {
        await executeDelete({ id });
        handleSuccess();
        showNotification("Soul deleted successfully", "success");
      });
    },
    [executeDelete, handleSuccess, routeName]
  );

  const handleSave = async (formData: ISoulsWonForm) => {
    try {
      if (formData.id) {
        updateData({ ...formData, lifeCenterId }, { id: formData.id });
      } else {
        await postData({ ...formData, lifeCenterId });
      }
    } catch {
      showNotification("Something went wrong", "error");
    }
  };

  const handleEdit = (soul: ISoulsWonForm) => {
    if (routeName === "member") {
      setAccessDeniedAction('edit');
      setShowAccessDeniedModal(true);
      return;
    }

    setSoulWon(soul);
    setOpenModal(true);
  };

  const handleAddSoul = () => {
    setSoulWon(null);
    setOpenModal(true);
  };

  const handleCloseAccessDeniedModal = () => {
    setShowAccessDeniedModal(false);
    setAccessDeniedAction('');
  };

  

  const groupedSouls = useMemo(() => {
    const groups: Record<string, Record<number, ISoulsWonForm[]>> = {};

    soulsWon.forEach((soul) => {
      const date = new Date(soul.date_won);
      const yearMonthKey = format(date, "MMMM yyyy");
      const week = getWeek(date); // 1–54

      if (!groups[yearMonthKey]) groups[yearMonthKey] = {};
      if (!groups[yearMonthKey][week]) groups[yearMonthKey][week] = [];

      groups[yearMonthKey][week].push(soul);
    });

    return groups;
  }, [soulsWon]);

  useEffect(() => {
    const sortedMonths = Object.keys(groupedSouls).sort((a, b) => {
      const da = new Date(a);
      const db = new Date(b);
      return db.getTime() - da.getTime();
    });

    if (sortedMonths.length > 0 && !openMonth) {
      setOpenMonth(sortedMonths[0]);
    }
  }, [groupedSouls, openMonth]);

  useEffect(() => {
    if (postResponse?.data) {
      handleSuccess();
      showNotification("Soul added successfully", "success");
      setSoulWon(null);
      setOpenModal(false);
    }
    if (updateResponse && soulWon) {
      handleSuccess();
      showNotification("Soul updated successfully", "success");
      setSoulWon(null);
      setOpenModal(false);
    }
  }, [handleSuccess, postResponse?.data, soulWon, updateResponse]);

  return (
    <div className="space-y-6">
      <HeaderControls
        title={`Souls won (${soulsWon.length})`}
        subtitle=""
        screenWidth={window.innerWidth}
        btnName={hasMembers ? "Add Record" : ""}
        handleClick={handleAddSoul}
      />
      {!hasMembers && (
        <p>
          <span className="font-semibold">Notice:</span> Please add a leader to
          this center first. Once a leader is assigned, the{" "}
          <span className="font-medium">Add Soul</span> button will appear.
        </p>
      )}

      <hr />

      {soulsWon.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedSouls)
            .sort((a, b) => {
              const da = new Date(a[0]);
              const db = new Date(b[0]);
              return db.getTime() - da.getTime();
            })
            .map(([monthYear, weeks]) => (
              <details
                key={monthYear}
                open={openMonth === monthYear}
                className="rounded-lg"
              >
                <summary
                  className="cursor-pointer px-4 py-3 font-semibold bg-gray-50 flex items-center justify-between gap-2"
                  onClick={(e) => {
                    e.preventDefault();
                    setOpenMonth((prev) => (prev === monthYear ? null : monthYear));
                  }}
                >
                  <div className="flex gap-2">
                    <span>{monthYear}</span>
                  <span className=" font-semibold text-gray-600">
                    ({Object.values(weeks).reduce((acc, curr) => acc + curr.length, 0)})
                  </span>
                  </div>
                  <div className="text-lg font-bold text-gray-500">
                    {openMonth === monthYear ? "–" : "+"}
                  </div>
                </summary>

                <div className="p-4 space-y-4">
                  {Object.entries(weeks)
                    .sort((a, b) => Number(a[0]) - Number(b[0]))
                    .map(([week, records]) => (
                      <div key={week}>
                        <h4 className="flex items-center justify-between font-semibold text-sm mb-2">
                          <div className="flex gap-2">
                            <span>Week {week}</span>
                          <span className="text-sm font-medium text-gray-500">
                            ({records.length})
                          </span>
                          </div>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {records.map((record) => (
                            <div
                              key={record.id}
                              className="relative border rounded-lg p-4 shadow-sm bg-white space-y-2"
                            >
                              <div className="flex items-center gap-2 pr-10">
                                <div className="font-medium">
                                  {record.first_name} {record.last_name}
                                </div>
                                {record.isMember ? (
                                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                                    Member
                                  </span>
                                ) : null}
                              </div>

                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <PhoneIcon className="h-4 w-4 text-gray-500" />
                                <span>{record.contact_number}</span>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPinIcon className="h-4 w-4 text-gray-500" />
                                <span>{record.country}</span>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CalendarDaysIcon className="h-4 w-4 text-gray-500" />
                                <span>{format(new Date(record.date_won), "dd MMM yyyy")}</span>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <UserIcon className="h-4 w-4 text-gray-500" />
                                <span>{record.wonByName}</span>
                              </div>

                              {record.isMember && record.memberName ? (
                                <div className="text-xs text-green-700">
                                  Member record: {record.memberName}
                                  {record.memberMemberId ? ` (${record.memberMemberId})` : ""}
                                </div>
                              ) : null}

                              <div
                                className="pt-2 absolute right-2 top-1"
                                onClick={() => handleShowOptions(record.id)}
                              >
                                <ActionButton
                                  showOptions={record.id === selectedId}
                                  onDelete={() =>
                                    handleDeleteSoul(
                                      String(record.id),
                                      `${record.first_name} ${record.last_name}`
                                    )
                                  }
                                  onEdit={() => handleEdit(record)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </details>
            ))}
        </div>
      ) : (
        <EmptyState
          scope="section"
          msg="No souls records yet"
          description="No souls have been recorded for this life center yet."
        />
      )}

      {/* Form Modal */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <SoulsWonForm
          onSubmit={handleSave}
          onClose={() => setOpenModal(false)}
          editData={soulWon}
          loading={isPosting || isUpdating}
          leader={leader}
        />
      </Modal>

      {/* Access Denied Modal */}
      <Modal open={showAccessDeniedModal} onClose={handleCloseAccessDeniedModal}>
        <div className="p-6 max-w-md mx-auto bg-white rounded-lg">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">
                Access Denied
              </h3>
            </div>
          </div>
          <div className="mb-6">
            <p className="text-sm text-gray-700">
              You do not have access to {accessDeniedAction} this data. Please contact the Ministry&apos;s IT Directorate for assistance.
            </p>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md"
              onClick={handleCloseAccessDeniedModal}
            >
              Understood
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
