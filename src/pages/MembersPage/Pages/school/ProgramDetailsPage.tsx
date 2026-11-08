import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { Modal } from "@/components/Modal";
import { STALE, useFetch } from "@/CustomHooks/useFetch";
import { ProgramDetailsModal } from "@/pages/MembersPage/Component/ProgramDetailsModal";
import { showNotification } from "@/pages/HomePage/utils";
import { useUserStore } from "@/store/userStore";
import {
  Avatar,
  Btn,
  EmptyBlock,
  Panel,
  Pill,
} from "@/pages/HomePage/pages/MinistrySchool/lms/ui";
import { DELIVERY_TONE } from "@/pages/HomePage/pages/MinistrySchool/lms/uiTokens";
import { formatLabel } from "@/pages/HomePage/pages/MinistrySchool/lms/somUtils";
import { api, ApplyResult, ClassFormat, ClassOption, Programs } from "@/utils";
import { LearnerShell } from "./LearnerShell";
import { learnerPaths } from "./learnerPaths";

const formatDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const getAudienceTags = (program: Programs) =>
  [
    program.member_required ? "Church members" : null,
    program.ministry_required ? "Ministry workers" : null,
    program.leader_required ? "Leaders" : null,
  ].filter(Boolean) as string[];

const ProgramDetailsPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const user = useUserStore();

  const { data, loading, refetch } = useFetch(api.fetch.fetchAllApplicablePrograms, undefined, false, { staleTime: STALE.reference });
  const programs = useMemo<Programs[]>(() => data?.data ?? [], [data?.data]);
  const program = useMemo(
    () => programs.find((item) => String(item.id) === String(programId)),
    [programs, programId]
  );

  const [open, setOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const selectedClass = useMemo<ClassOption | undefined>(
    () => program?.courses?.find((course) => course.id === selectedClassId),
    [program, selectedClassId]
  );

  if (loading) {
    return (
      <LearnerShell>
        <div className="space-y-4">
          <div className="h-44 animate-pulse rounded-2xl bg-lightGray/60" />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="h-72 animate-pulse rounded-xl bg-lightGray/40 lg:col-span-2" />
            <div className="h-72 animate-pulse rounded-xl bg-lightGray/40" />
          </div>
        </div>
      </LearnerShell>
    );
  }

  if (!program) {
    return (
      <LearnerShell>
        <EmptyBlock
          msg="We couldn't find this program. It may no longer be open for enrolment."
          action={
            <Btn variant="primary" to={learnerPaths.browse}>
              Back to programs
            </Btn>
          }
        />
      </LearnerShell>
    );
  }

  const audienceTags = getAudienceTags(program);
  const audienceLabel = audienceTags.length ? audienceTags.join(", ") : "Open to all members";
  const outcomes = program.outcomes ?? [];
  const hasPrerequisites = (program.prerequisites?.length ?? 0) > 0;

  const startDates = (program.courses ?? [])
    .map((course) => course.startDate)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()));
  const earliestStart = startDates.length
    ? formatDate(new Date(Math.min(...startDates.map((date) => date.getTime()))).toISOString())
    : null;

  const modes = Array.from(
    new Set((program.courses ?? []).map((course) => course.mode).filter(Boolean))
  ) as ClassFormat[];

  // Derived "At a glance" rows. Length, Grading and Fee have no backend field
  // yet, so they are omitted until the program payload carries them.
  const seats = (program.courses ?? []).reduce(
    (acc, course) => {
      const capacity = Number(course.capacity) || 0;
      const enrolled = Number(course.enrolled) || 0;
      acc.capacity += capacity;
      acc.left += Math.max(capacity - enrolled, 0);
      return acc;
    },
    { capacity: 0, left: 0 }
  );
  const scheduleCourse = (program.courses ?? []).find((course) => course.meetingTime);
  const scheduleLabel = scheduleCourse
    ? [scheduleCourse.meetingDays?.join(", "), scheduleCourse.meetingTime]
        .filter(Boolean)
        .join(" · ")
    : null;

  const leadInstructor =
    program.instructors?.find((instructor) => instructor.isLead) ?? program.instructors?.[0] ?? null;

  const handleSubmit = async (): Promise<ApplyResult | null> => {
    if (!selectedClass) {
      showNotification("Please select a class to continue.", "error");
      return null;
    }
    if (!user.id) {
      showNotification("Unable to identify your profile. Please sign in again.", "error");
      return null;
    }

    setSubmitting(true);
    try {
      const response = await api.post.applyToProgram({ courseId: Number(selectedClassId) });
      const result = response.data;

      if (result?.status === "ENROLLED") {
        showNotification("You're enrolled.", "success");
        refetch();
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

      showNotification(
        response.message || "We could not submit your application. Please try again.",
        "error"
      );
      return null;
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message || (error as { message?: string })?.message;
      showNotification(message || "An unexpected error occurred while applying.", "error");
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDone = (result: ApplyResult) => {
    setOpen(false);
    if (result.status === "ENROLLED") {
      navigate(learnerPaths.program(program.id));
    }
  };

  const handleApply = () => {
    setSelectedClassId("");
    setOpen(true);
  };

  return (
    <LearnerShell>
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1.5 text-[13px] text-primaryGray"
      >
        <Link to={learnerPaths.browse} className="hover:text-primary">
          Browse programs
        </Link>
        <span className="text-mainGray">/</span>
        <span className="font-medium text-primary">{program.name}</span>
      </nav>

      {/* Navy marketing hero */}
      <section className="flex flex-col gap-6 rounded-2xl bg-primary px-6 py-8 text-white md:flex-row md:items-center md:justify-between md:px-10 md:py-10">
        <div className="min-w-0">
          <span className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold">
            {program.upcomingCohort || audienceLabel}
          </span>
          <h1 className="mt-4 text-3xl font-semibold leading-tight md:text-4xl">{program.name}</h1>
          {program.description && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80">
              {program.description}
            </p>
          )}
        </div>
        <Btn variant="onDarkSolid" onClick={handleApply} className="md:flex-shrink-0">
          Apply now
        </Btn>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <Panel title="About this program">
            <div className="p-4">
              <p className="text-sm leading-relaxed text-primaryGray">
                {program.description || "Program details will be updated soon."}
              </p>
            </div>
          </Panel>

          {outcomes.length > 0 && (
            <Panel title="What you'll learn">
              <ul className="space-y-3 p-4">
                {outcomes.map((outcome, index) => (
                  <li key={`${outcome}-${index}`} className="flex items-start gap-2.5 text-sm text-primary">
                    <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-secondary" />
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <Panel title="Curriculum">
            {program.topics?.length ? (
              <ol className="divide-y divide-gray-100">
                {program.topics.map((topic, index) => (
                  <li key={topic.id ?? `${topic.name}-${index}`} className="flex items-start gap-3 p-4">
                    <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-primary">{topic.name}</p>
                      {topic.description && (
                        <div
                          className="text-sm leading-relaxed text-primaryGray"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(String(topic.description)),
                          }}
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="p-4 text-sm text-primaryGray">The curriculum will be published soon.</p>
            )}
          </Panel>
        </div>

        {/* Aside */}
        <aside className="space-y-6">
          <Panel title="At a glance">
            <dl className="divide-y divide-gray-100">
              <div className="flex items-center justify-between gap-3 p-4">
                <dt className="text-sm text-mainGray">Starts</dt>
                <dd className="text-sm font-medium text-primary">{earliestStart || "To be announced"}</dd>
              </div>
              {scheduleLabel && (
                <div className="flex items-start justify-between gap-3 p-4">
                  <dt className="text-sm text-mainGray">Time</dt>
                  <dd className="max-w-[60%] text-right text-sm font-medium text-primary">
                    {scheduleLabel}
                  </dd>
                </div>
              )}
              <div className="flex items-start justify-between gap-3 p-4">
                <dt className="text-sm text-mainGray">Format</dt>
                <dd className="flex flex-wrap justify-end gap-1.5">
                  {modes.length ? (
                    modes.map((mode) => {
                      const label = formatLabel(mode);
                      return (
                        <Pill key={mode} tone={DELIVERY_TONE[label]}>
                          {label}
                        </Pill>
                      );
                    })
                  ) : (
                    <span className="text-sm font-medium text-primary">To be announced</span>
                  )}
                </dd>
              </div>
              {seats.capacity > 0 && (
                <div className="flex items-center justify-between gap-3 p-4">
                  <dt className="text-sm text-mainGray">Seats</dt>
                  <dd className="text-sm font-medium text-primary">
                    {seats.left} of {seats.capacity} left
                  </dd>
                </div>
              )}
            </dl>
            <div className="p-4 pt-0">
              <Btn variant="primary" onClick={handleApply} className="w-full">
                Apply now
              </Btn>
            </div>
          </Panel>

          <Panel title="Who can apply">
            <div className="p-4">
              {program.eligibilitySummary ? (
                <p className="text-sm leading-relaxed text-primaryGray">{program.eligibilitySummary}</p>
              ) : (
                <ul className="space-y-2.5">
                  <li className="border-l-2 border-primary/30 pl-3 text-sm text-primaryGray">
                    {audienceTags.length
                      ? `Open to ${audienceLabel.toLowerCase()}`
                      : "Open to all members"}
                  </li>
                  {hasPrerequisites &&
                    program.prerequisites!.map((prerequisite, index) => (
                      <li
                        key={`${prerequisite}-${index}`}
                        className="border-l-2 border-primary/30 pl-3 text-sm text-primaryGray"
                      >
                        {prerequisite}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </Panel>

          {leadInstructor && (
            <Panel title="Lead instructor">
              <div className="flex items-start gap-3 p-4">
                {leadInstructor.photo ? (
                  <img
                    src={leadInstructor.photo}
                    alt={leadInstructor.name}
                    className="size-11 flex-shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <Avatar name={leadInstructor.name} size="lg" tone="navy" />
                )}
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-primary">{leadInstructor.name}</p>
                  {leadInstructor.role && (
                    <p className="text-xs text-mainGray">{leadInstructor.role}</p>
                  )}
                  {leadInstructor.bio && (
                    <p className="text-sm leading-relaxed text-primaryGray">{leadInstructor.bio}</p>
                  )}
                </div>
              </div>
            </Panel>
          )}
        </aside>
      </div>

      <Modal
        open={open}
        persist
        onClose={() => setOpen(false)}
        className="h-[92vh] max-w-6xl p-0 md:h-[90vh]"
      >
        <ProgramDetailsModal
          program={program}
          selectedClassId={selectedClassId}
          onSelectClass={setSelectedClassId}
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
          onDone={handleDone}
          submitting={submitting}
        />
      </Modal>
    </LearnerShell>
  );
};

export default ProgramDetailsPage;
