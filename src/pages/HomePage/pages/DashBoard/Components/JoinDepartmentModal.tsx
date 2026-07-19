import { Button, ProfilePicture } from "@/components";
import { Modal } from "@/components/Modal";
import EmptyState from "@/components/EmptyState";
import { FormHeader } from "@/components/ui";
import { useFetch } from "@/CustomHooks/useFetch";
import { showNotification } from "@/pages/HomePage/utils";
import { buildBranchQuery, useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils";
import type { OpenDepartmentToJoin } from "@/utils";
import { useMemo, useState } from "react";

const getHeadName = (department: OpenDepartmentToJoin) =>
  department.department_head_info?.name?.trim() || "Head not assigned";

export const JoinDepartmentModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const { activeBranchId } = useBranchStore();
  const query = useMemo(
    () => buildBranchQuery(activeBranchId),
    [activeBranchId]
  );
  const { data, loading } = useFetch(
    api.fetch.fetchOpenDepartmentsToJoin,
    query
  );

  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [joinedIds, setJoinedIds] = useState<number[]>([]);

  const departments = data?.data ?? [];

  const handleJoin = async (department: OpenDepartmentToJoin) => {
    setSubmittingId(department.id);
    try {
      const response = await api.post.createJoinRequest({
        department_id: department.id,
      });
      showNotification(
        (response as { message?: string })?.message ||
          "Your request has been submitted to the Head of Department for review.",
        "success"
      );
      setJoinedIds((prev) => [...prev, department.id]);
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Unable to submit your request. Please try again.";
      showNotification(message, "error");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <Modal
      open={open}
      persist={false}
      onClose={onClose}
      className="h-[90vh] max-w-4xl p-0"
    >
      <FormHeader>
        <div>
          <p className="text-lg font-semibold">Join a Department / Ministry</p>
          <p className="mt-1 text-sm text-white/80">
            Browse departments open for new members and send a request to the
            Head of Department.
          </p>
        </div>
      </FormHeader>

      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {loading ? (
          <p className="py-10 text-center text-sm text-primaryGray">
            Loading open departments…
          </p>
        ) : departments.length === 0 ? (
          <EmptyState
            scope="section"
            msg="No open departments"
            description="There are no departments open for joining right now. Please check back later."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {departments.map((department) => {
              const hasJoined = joinedIds.includes(department.id);
              return (
                <article
                  key={department.id}
                  className="app-card flex h-full flex-col justify-between rounded-2xl border border-lightGray/80 p-5"
                >
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.16em] text-primaryGray">
                        Department / Ministry
                      </p>
                      <h3 className="text-lg font-semibold text-primary">
                        {department.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <ProfilePicture
                        className="h-9 w-9 rounded-full border border-lightGray bg-white"
                        textClass="text-xs font-semibold text-primary"
                        alt={`${department.name} head`}
                        name={getHeadName(department)}
                      />
                      <div>
                        <p className="text-xs text-primaryGray">
                          Head of Department
                        </p>
                        <p className="text-sm font-medium text-primary">
                          {getHeadName(department)}
                        </p>
                      </div>
                    </div>

                    <p className="min-h-[48px] text-sm leading-6 text-primaryGray">
                      {department.description?.trim() ||
                        "No description provided for this department."}
                    </p>
                  </div>

                  <div className="mt-4">
                    <Button
                      value={hasJoined ? "Request Sent" : "Join"}
                      onClick={() => handleJoin(department)}
                      loading={submittingId === department.id}
                      disabled={hasJoined || submittingId === department.id}
                      className="w-full"
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default JoinDepartmentModal;
