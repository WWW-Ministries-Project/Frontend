import { HeaderControls } from "@/components/HeaderControls";
import { Modal } from "@/components/Modal";
import EmptyState from "@/components/EmptyState";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { api, formatDate } from "@/utils";
import { useMemo, useState } from "react";
import { FollowUpForm, IFollowUpForm } from "./FollowUpForm";
import edit from "/src/assets/edit.svg";
import AddAnotherConfirmation from "@/pages/HomePage/Components/reusable/AddAnotherConfirmation";

interface IProps {
  followUps: FollowUp[];
  visitorId: string;
  responsibleMembers: ResponsibleMember[];
  onRefetch?: () => Promise<void>;
}

const normalizeAssignedToValue = (
  assignedTo: string | number | undefined,
  options: Array<{ value: string | number; label: string }>
) => {
  if (assignedTo === undefined || assignedTo === null) return "";
  const assignedToText = String(assignedTo);

  const matchedOption = options.find(
    (option) =>
      String(option.value) === assignedToText || option.label === assignedToText
  );

  return matchedOption ? String(matchedOption.value) : assignedToText;
};

export const FollowUps = ({
  visitorId,
  followUps,
  responsibleMembers,
  onRefetch,
}: IProps) => {
  const [selectedFollowUp, setSelectedFollowUp] = useState<
    FollowUp | undefined
  >(undefined); // Store selected visit for editing
  const [isModalOpen, setIsModalOpen] = useState(false); // Track modal open state

  const [showRegisterAnother, setShowRegisterAnother] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);
  const responsibleMemberOptions = useMemo(() => {
    const seen = new Set<string>();

    return responsibleMembers.reduce<Array<{ value: string; label: string }>>(
      (acc, member) => {
        const value = String(member?.userId ?? "");
        const label = member?.name?.trim();

        if (!value || !label || seen.has(value)) return acc;

        seen.add(value);
        acc.push({ value, label });
        return acc;
      },
      []
    );
  }, [responsibleMembers]);

  const getAssignedToLabel = (assignedTo?: string | number) => {
    if (assignedTo === undefined || assignedTo === null || assignedTo === "") {
      return "";
    }

    const assignedValue = String(assignedTo);
    const matchedMember = responsibleMemberOptions.find(
      (member) => String(member.value) === assignedValue
    );

    return matchedMember?.label || assignedValue;
  };

  /* api calls */
  const { postData: postFollowUp, loading: postLoading } = usePost(
    api.post.createFollowUp
  );
  const { updateData: updateFollowUp, loading: putLoading } = usePut(
    api.put.updateFollowUp
  );
  const handleSubmit = async (data: IFollowUpForm) => {
    const payload = {
      ...data,
      visitorId: visitorId,
    };

    if (selectedFollowUp) {
      await updateFollowUp(payload, { id: String(selectedFollowUp.id) });
      if (onRefetch) {
        await onRefetch();
      }

      setIsModalOpen(false);
      setSelectedFollowUp(undefined);
      setShowRegisterAnother(false);
    } else {
      await postFollowUp(payload);
      if (onRefetch) {
        await onRefetch();
      }

      // KEEP MODAL OPEN, show confirmation
      setShowRegisterAnother(true);
    }
  };

  const sortedFollowUps = [...followUps].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return (
    <>
      <HeaderControls
        title="Follow-up History"
        subtitle="Record of all visits to services and events"
        btnName="Add Follow-up"
        handleClick={() => {
          setSelectedFollowUp(undefined);
          setShowRegisterAnother(false);
          setFormResetKey((k) => k + 1);
          setIsModalOpen(true);
        }}
        screenWidth={window.innerWidth}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {followUps.length === 0 && (
          <EmptyState
            scope="section"
            msg="No follow-ups recorded yet"
            description="Add a follow-up to keep engagement history for this visitor."
          />
        )}

        {sortedFollowUps.map((item) => (
          <div
            key={item.id}
            className="border rounded-lg p-4 space-y-2 shadow-sm bg-white"
          >
            <div className="flex justify-end">
              <img
                src={edit}
                alt="edit icon"
                className="cursor-pointer w-4 h-4 opacity-60 hover:opacity-100"
                onClick={() => {
                  setSelectedFollowUp(item);
                  setIsModalOpen(true);
                }}
              />
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              <span className="block text-xs text-gray-500 mb-1">Notes</span>
              {item.notes}
            </div>
            <div className="pt-3 mt-3 border-t text-xs text-gray-600 space-y-1">
              <div>
                <span className="font-medium">Date:</span> {formatDate(item.date)}
              </div>
              <div>
                <span className="font-medium">Type:</span> {item.type}
              </div>
              <div>
                <span className="font-medium">Status:</span> {item.status}
              </div>
              {item.assignedTo && (
                <div>
                  <span className="font-medium">Assigned to:</span>{" "}
                  {getAssignedToLabel(item.assignedTo)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFollowUp(undefined);
        }}
      >
        {showRegisterAnother ? (
          <AddAnotherConfirmation
            content={
              <div>
                <h3 className="text-lg font-semibold">
                  Record another follow-up?
                </h3>
                <p className="text-sm text-gray-600">
                  The follow-up was recorded successfully. Would you like to add another?
                </p>
              </div>
            }
            confirmationAction={() => {
              setShowRegisterAnother(false);
              setSelectedFollowUp(undefined);
              setFormResetKey((k) => k + 1);
              setIsModalOpen(true);
            }}
            cancelAction={() => {
              setShowRegisterAnother(false);
              setIsModalOpen(false);
              setSelectedFollowUp(undefined);
            }}
          />
        ) : (
          <FollowUpForm
            key={formResetKey}
            onSubmit={handleSubmit}
            onClose={() => {
              // parent controls modal lifecycle
              setIsModalOpen(false);
              setSelectedFollowUp(undefined);
              setShowRegisterAnother(false);
            }}
            initialData={
              selectedFollowUp
                ? {
                    ...selectedFollowUp,
                    assignedTo: normalizeAssignedToValue(
                      selectedFollowUp.assignedTo,
                      responsibleMemberOptions
                    ),
                  }
                : undefined
            }
            assignedToOptions={responsibleMemberOptions}
            loading={postLoading || putLoading}
          />
        )}
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
  assignedTo: string | number;
}

interface ResponsibleMember {
  userId: string | number;
  name: string;
}
