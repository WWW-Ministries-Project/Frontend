import EmptyState from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Button } from "@/components";
import { useFetch } from "@/CustomHooks/useFetch";
import { ProgramDetailsModal } from "@/pages/MembersPage/Component/ProgramDetailsModal";
import { learnerPaths } from "@/pages/MembersPage/Pages/school/learnerPaths";
import { showNotification } from "@/pages/HomePage/utils";
import { useUserStore } from "@/store/userStore";
import { api, ApplyResult, ClassOption, Programs, relativePath } from "@/utils";
import { formatLabel } from "@/pages/HomePage/pages/MinistrySchool/lms/somUtils";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const formatDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

/** Earliest class start date + the delivery formats on offer, for the card meta. */
const programSchedule = (program: Programs) => {
  const courses = program.courses ?? [];
  const startTimes = courses
    .map((course) => course.startDate)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((time) => !Number.isNaN(time));
  const starts = startTimes.length
    ? formatDate(new Date(Math.min(...startTimes)).toISOString())
    : null;
  const modes = Array.from(
    new Set(courses.map((course) => course.mode).filter(Boolean))
  ).map((mode) => formatLabel(mode as string));
  return { starts, modes };
};

const ProgramApply = () => {
  const [open, setOpen] = useState(false);
  const [activeProgram, setActiveProgram] = useState<Programs | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const user = useUserStore();
  const { data, loading, refetch } = useFetch(api.fetch.fetchAllApplicablePrograms);
  const programs = useMemo<Programs[]>(() => data?.data ?? [], [data?.data]);

  // Programs the member is already enrolled in (an accepted application). Used to
  // flag "Applied" on the cards so they don't apply twice; they can still view
  // the details.
  const { data: enrollmentData, refetch: refetchEnrollments } = useFetch(
    api.fetch.fetchUserEnrolledPrograms
  );
  const appliedProgramIds = useMemo(
    () => new Set((enrollmentData?.data ?? []).map((e) => String(e.program.id))),
    [enrollmentData]
  );

  const selectedClass = useMemo<ClassOption | undefined>(() => {
    return activeProgram?.courses?.find((course) => course.id === selectedClassId);
  }, [activeProgram, selectedClassId]);

  const handleOpen = (program: Programs) => {
    setActiveProgram(program);
    setSelectedClassId("");
    setOpen(true);
  };

  const handleSubmit = async (): Promise<ApplyResult | null> => {
    if (!activeProgram || !selectedClass) {
      showNotification("Please select a class to continue.", "error");
      return null;
    }

    if (!user.id) {
      showNotification("Unable to identify your profile. Please sign in again.", "error");
      return null;
    }

    setSubmitting(true);
    try {
      // Eligible members are enrolled straight away; anyone the rules hold back
      // (eligibility, prerequisites or a full class) goes to the review queue.
      const response = await api.post.applyToProgram({ courseId: Number(selectedClassId) });
      const result = response.data;

      if (result?.status === "ENROLLED") {
        showNotification("You're enrolled.", "success");
        refetch();
        refetchEnrollments();
        return result;
      } else if (result?.status === "PENDING") {
        showNotification(
          `Application received. The School of Ministry team will review it${
            result.reasons.length ? ` (${result.reasons.join("; ")})` : ""
          }.`,
          "success"
        );
        refetch();
        return result;
      }

      showNotification(response.message || "We could not submit your application. Please try again.", "error");
      return null;
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (error as { message?: string })?.message;
      showNotification(message || "An unexpected error occurred while applying.", "error");
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDone = (result: ApplyResult) => {
    const enrolledProgramId = activeProgram?.id;
    setOpen(false);
    if (result.status === "ENROLLED" && enrolledProgramId != null) {
      navigate(
        `${relativePath.member.main}/${relativePath.member.schoolOfMinistries.myEnrolledPrograms}/${encodeURIComponent(
          String(enrolledProgramId)
        )}`
      );
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="animate-pulse rounded-xl border border-lightGray bg-white p-5">
            <div className="mb-3 h-3 w-1/3 rounded bg-lightGray/70" />
            <div className="mb-3 h-5 w-2/3 rounded bg-lightGray" />
            <div className="mb-2 h-3 w-full rounded bg-lightGray/80" />
            <div className="mb-6 h-3 w-5/6 rounded bg-lightGray/70" />
            <div className="h-9 w-full rounded bg-lightGray/50" />
          </div>
        ))}
      </div>
    );
  }

  if (!programs.length) {
    return (
      <div className="rounded-xl border border-lightGray bg-white p-6 text-center">
        <EmptyState
          scope="section"
          title="No Programs Available"
          description="Programs will appear here once they are published."
        />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {programs.map((program) => {
          const applied = appliedProgramIds.has(String(program.id));
          const { starts, modes } = programSchedule(program);
          return (
            <article
              key={program.id}
              className="flex flex-col rounded-xl border border-lightGray bg-white p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-mainGray">{program.upcomingCohort || "Open for enrolment"}</p>
                {applied && (
                  <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                    <CheckCircleIcon className="w-3.5" />
                    Applied
                  </span>
                )}
              </div>

              <h2 className="mt-2 text-lg font-semibold text-primary">{program.name}</h2>
              {program.description && (
                <p className="mt-1.5 line-clamp-2 text-sm text-primaryGray">{program.description}</p>
              )}

              <p className="mt-3 text-sm text-primaryGray">
                <span className="font-semibold text-primary">Starts</span> {starts || "To be announced"}
                {modes.length ? ` · ${modes.join(", ")}` : ""}
              </p>

              <div className="mt-auto flex items-center gap-3 pt-5">
                <button
                  type="button"
                  onClick={() => navigate(learnerPaths.programDetails(program.id))}
                  className="rounded-lg border border-lightGray bg-white px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-gray-50"
                >
                  View details
                </button>
                {applied ? (
                  <span
                    aria-disabled="true"
                    title="You have already applied to this program"
                    className="inline-flex cursor-default items-center gap-1.5 rounded-lg bg-green-50 px-4 py-2 text-sm font-semibold text-green-700"
                  >
                    <CheckCircleIcon className="w-5" />
                    Applied
                  </span>
                ) : (
                  <Button value="Apply" onClick={() => handleOpen(program)} />
                )}
              </div>
            </article>
          );
        })}
      </div>

      <Modal
        open={open}
        persist
        onClose={() => setOpen(false)}
        className="h-[92vh] max-w-6xl p-0 md:h-[90vh]"
      >
        <ProgramDetailsModal
          program={activeProgram}
          selectedClassId={selectedClassId}
          onSelectClass={setSelectedClassId}
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
          onDone={handleDone}
          submitting={submitting}
        />
      </Modal>
    </>
  );
};

export default ProgramApply;
