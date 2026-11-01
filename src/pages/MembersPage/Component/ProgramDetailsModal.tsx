import { FC, memo, useEffect, useState, type ReactNode } from "react";
import { ApplyResult, Programs } from "@/utils";
import { useAuth } from "@/context/AuthWrapper";
import { Btn, Pill } from "@/pages/HomePage/pages/MinistrySchool/lms/ui";
import {
  AcademicCapIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

/* ------------------------------- Utilities ------------------------------- */
const pctFilled = (enrolled: number, capacity: number) => {
  if (!capacity || capacity <= 0) return 0;
  return Math.min(100, Math.round((enrolled / capacity) * 100));
};

const formatMeetingDays = (meetingDays?: string[] | string) => {
  if (!meetingDays) return "To be announced";
  if (Array.isArray(meetingDays)) return meetingDays.filter(Boolean).join(", ");
  return meetingDays;
};

const Badge: FC<{ variant?: "default" | "full"; children: ReactNode }> = ({
  variant = "default",
  children
}) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
      variant === "full"
        ? "bg-red-50 text-red-700"
        : "bg-lightGray/50 text-primaryGray"
    }`}
  >
    {children}
  </span>
);

const ProgressBar: FC<{ value: number; isFull?: boolean }> = ({ value, isFull }) => (
  <div className="h-1 w-full overflow-hidden rounded-full bg-lightGray/50">
    <div
      className={`h-full transition-all duration-300 ${isFull ? "bg-red-500" : "bg-primary"}`}
      style={{ width: `${value}%` }}
    />
  </div>
);

/* ----------------------------- Small Components ----------------------------- */
type Course = NonNullable<Programs["courses"]>[number];

const CourseRadioCard = memo(function CourseRadioCard({
  course,
  checked,
  onChange,
}: {
  course: Course;
  checked: boolean;
  onChange: (id: string) => void;
}) {
  const { id, name, enrolled, capacity, facilitator, meetingDays, meetingTime } = course;
  const totalEnrolled = Number(enrolled ?? 0);
  const totalCapacity = Number(capacity ?? 0);
  const isFull = totalCapacity > 0 && totalEnrolled >= totalCapacity;
  const pct = pctFilled(totalEnrolled, totalCapacity);
  const seatsLeft = totalCapacity > 0 ? Math.max(totalCapacity - totalEnrolled, 0) : null;
  const meetingDaysLabel = formatMeetingDays(meetingDays);
  const meetingTimeLabel = meetingTime || "Time to be announced";

  return (
    <label
      htmlFor={`course-${id}`}
      className={`group block cursor-pointer rounded-xl border border-lightGray p-4 transition-all hover:border-primary ${
        checked ? "border-primary bg-primary/5 shadow-sm" : "bg-white"
      } ${isFull ? "cursor-not-allowed opacity-50 hover:border-lightGray" : ""}`}
    >
      <div className="flex items-start gap-4">
        <input
          id={`course-${id}`}
          type="radio"
          name="class"
          value={id}
          checked={checked}
          onChange={() => onChange(id)}
          disabled={isFull}
          className="mt-1 h-4 w-4 border-lightGray text-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed"
          aria-label={`${name}${isFull ? " (Full)" : ""}`}
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h4 className="text-sm font-semibold leading-tight text-primary">{name}</h4>
            <Badge variant={isFull ? "full" : "default"}>
              {isFull ? "Class Full" : "Open Seats"}
            </Badge>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg bg-lightGray/30 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primaryGray">Facilitator</p>
              <div className="mt-1 flex items-center gap-2 text-sm text-primary">
                <UserGroupIcon className="h-4 w-4 text-primaryGray" />
                <span>{facilitator || "To be assigned"}</span>
              </div>
            </div>

            <div className="rounded-lg bg-lightGray/30 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primaryGray">Schedule</p>
              <div className="mt-1 flex items-center gap-2 text-sm text-primary">
                <CalendarDaysIcon className="h-4 w-4 text-primaryGray" />
                <span>{meetingDaysLabel}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-primary">
                <ClockIcon className="h-4 w-4 text-primaryGray" />
                <span>{meetingTimeLabel}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm text-primaryGray">
                <span className="flex items-center gap-1.5">
                  <UsersIcon className="h-3.5 w-3.5" />
                  Enrollment
                </span>
                <span className="font-medium">
                  {totalEnrolled} / {totalCapacity || "∞"}
                </span>
              </div>
              <ProgressBar value={pct} isFull={isFull} />
              <p className="text-xs text-primaryGray">
                {seatsLeft === null ? "Flexible capacity for this class" : `${seatsLeft} seats left`}
              </p>
          </div>
        </div>
      </div>
    </label>
  );
});

/* ------------------------------- Step indicator ------------------------------- */
const STEP_LABELS = ["Who can join", "Choose a class", "Confirm details", "Success"];

const StepBar: FC<{ current: number }> = ({ current }) => (
  <ol className="flex items-center gap-1.5" aria-label="Application progress">
    {STEP_LABELS.map((label, index) => {
      const isDone = index < current;
      const isActive = index === current;
      return (
        <li key={label} className="flex min-w-0 flex-1 items-center gap-1.5">
          <div
            className="flex min-w-0 items-center gap-2"
            aria-current={isActive ? "step" : undefined}
          >
            <span
              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-primary text-white"
                  : isDone
                    ? "bg-primary/15 text-primary"
                    : "bg-lightGray/60 text-primaryGray"
              }`}
            >
              {isDone ? <CheckCircleIcon className="h-4 w-4" /> : index + 1}
            </span>
            <span
              className={`hidden truncate text-xs font-medium sm:inline ${
                isActive ? "text-primary" : "text-primaryGray"
              }`}
            >
              {label}
            </span>
          </div>
          {index < STEP_LABELS.length - 1 && (
            <span className={`h-px flex-1 ${isDone ? "bg-primary/40" : "bg-lightGray"}`} />
          )}
        </li>
      );
    })}
  </ol>
);

const DetailRow: FC<{ label: string; value: ReactNode }> = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-primaryGray">{label}</p>
    <p className="text-sm text-primary">{value || "—"}</p>
  </div>
);

/* --------------------------- Main Modal Component --------------------------- */
export const ProgramDetailsModal: FC<{
  program: Programs | null;
  selectedClassId: string;
  onSelectClass: (id: string) => void;
  onClose: () => void;
  onSubmit: () => Promise<ApplyResult | null>;
  onDone?: (result: ApplyResult) => void;
  submitting?: boolean;
}> = ({ program, selectedClassId, onSelectClass, onClose, onSubmit, onDone, submitting }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<ApplyResult | null>(null);

  // Reset the wizard whenever a different program is opened.
  useEffect(() => {
    setStep(0);
    setResult(null);
  }, [program?.id]);

  if (!program) return null;

  const hasCourses = (program.courses?.length ?? 0) > 0;
  const hasTopics = (program.topics?.length ?? 0) > 0;
  const hasPrerequisites = (program.prerequisites?.length ?? 0) > 0;
  const audienceTags = [
    program.member_required ? "Church members" : null,
    program.ministry_required ? "Ministry workers" : null,
    program.leader_required ? "Leaders" : null,
  ].filter(Boolean) as string[];

  const selectedCourse = program.courses?.find((course) => course.id === selectedClassId);

  const handleSubmitApplication = async () => {
    const res = await onSubmit();
    if (res) {
      setResult(res);
      setStep(3);
    }
  };

  const handleDone = () => {
    if (result) onDone?.(result);
    onClose();
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="sticky top-0 z-20 space-y-5 border-b border-lightGray bg-gradient-to-r from-primary/10 via-white to-lightGray/20 px-6 py-6 md:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 pr-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">
              School of Ministry
            </p>
            <h2 className="text-2xl font-semibold text-primary">{program.name}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white px-3 py-1 text-xs font-medium text-primary">
                <CalendarDaysIcon className="h-4 w-4" />
                {program.upcomingCohort || "Cohort not assigned"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white px-3 py-1 text-xs font-medium text-primary">
                <AcademicCapIcon className="h-4 w-4" />
                {program.courses?.length ?? 0} class{(program.courses?.length ?? 0) === 1 ? "" : "es"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white px-3 py-1 text-xs font-medium text-primary">
                <BookOpenIcon className="h-4 w-4" />
                {program.topics?.length ?? 0} topic{(program.topics?.length ?? 0) === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 -mt-1 rounded-full p-1.5 text-primaryGray transition-colors hover:bg-white hover:text-primary"
            aria-label="Close program details"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <StepBar current={step} />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
        {/* Step 1 — Who can join */}
        {step === 0 && (
          <section className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-primary">Who can join</h3>
              <p className="mt-1 text-sm text-primaryGray">
                Check the audience and prerequisites before you apply.
              </p>
            </div>

            <div className="rounded-xl border border-lightGray bg-white p-5">
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-primaryGray">
                Program Overview
              </h4>
              <p className="text-sm leading-relaxed text-primaryGray">
                {program.description || "Program details will be updated soon."}
              </p>
            </div>

            <div className="rounded-xl border border-lightGray bg-white p-5">
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primaryGray">
                Designed For
              </h4>
              <div className="flex flex-wrap gap-2">
                {audienceTags.length ? (
                  audienceTags.map((tag) => <Pill key={tag}>{tag}</Pill>)
                ) : (
                  <p className="text-sm text-primaryGray">Open to all members.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-lightGray bg-white p-5">
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primaryGray">
                Prerequisites
              </h4>
              {!hasPrerequisites ? (
                <p className="text-sm text-primaryGray">No prerequisite required.</p>
              ) : (
                <ul className="space-y-2">
                  {program.prerequisites!.map((prerequisite, index) => (
                    <li key={`${prerequisite}-${index}`} className="flex items-start gap-2 text-sm text-primaryGray">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/60" />
                      <span>{prerequisite}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {hasTopics && (
              <div className="rounded-xl border border-lightGray bg-white p-5">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primaryGray">
                  Topics Covered
                </h4>
                <div className="space-y-3">
                  {program.topics.map((topic, index) => (
                    <div
                      key={topic.id ?? `${topic.name}-${index}`}
                      className="rounded-lg border border-lightGray/80 bg-lightGray/10 p-3"
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {index + 1}
                        </span>
                        <p className="text-sm font-semibold text-primary">{topic.name}</p>
                      </div>
                      {topic.description && (
                        <div
                          className="text-sm leading-relaxed text-primaryGray"
                          dangerouslySetInnerHTML={{ __html: String(topic.description) }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Step 2 — Choose a class */}
        {step === 1 && (
          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-primary">Choose a class</h3>
              <p className="mt-1 text-sm text-primaryGray">
                Pick a class with open seats to continue.
              </p>
            </div>
            <fieldset className="space-y-3">
              <legend className="sr-only">Select a class</legend>
              {!hasCourses ? (
                <div className="rounded-lg border border-dashed border-lightGray p-8 text-center">
                  <p className="text-sm text-primaryGray">No classes available yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {program.courses!.map((course) => (
                    <CourseRadioCard
                      key={course.id}
                      course={course}
                      checked={selectedClassId === course.id}
                      onChange={onSelectClass}
                    />
                  ))}
                </div>
              )}
            </fieldset>
          </section>
        )}

        {/* Step 3 — Confirm details */}
        {step === 2 && (
          <section className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-primary">Confirm details</h3>
              <p className="mt-1 text-sm text-primaryGray">
                We will use these details from your profile for this application.
              </p>
            </div>

            <div className="rounded-xl border border-lightGray bg-white p-5">
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-primaryGray">
                Applicant
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailRow label="Name" value={user?.name} />
                <DetailRow label="Member ID" value={user?.member_id} />
                <DetailRow label="Email" value={user?.email} />
                <DetailRow label="Phone" value={user?.phone} />
              </div>
            </div>

            {selectedCourse && (
              <div className="rounded-xl border border-lightGray bg-white p-5">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primaryGray">
                  Selected Class
                </h4>
                <p className="text-sm font-semibold text-primary">{selectedCourse.name}</p>
                <p className="mt-1 text-sm text-primaryGray">
                  {selectedCourse.facilitator || "Facilitator to be assigned"}
                </p>
              </div>
            )}

            <div className="flex items-start gap-2 rounded-xl border border-primary/15 bg-primary/5 p-4">
              <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <p className="text-sm text-primary">
                You meet the requirements for {program.name}. Submit to complete your application.
              </p>
            </div>
          </section>
        )}

        {/* Step 4 — Success */}
        {step === 3 && result && (
          <section className="flex flex-col items-center gap-4 py-10 text-center">
            <CheckCircleIcon className="h-16 w-16 text-primary" />
            {result.status === "ENROLLED" ? (
              <>
                <h3 className="text-xl font-semibold text-primary">You&apos;re enrolled</h3>
                <p className="max-w-md text-sm text-primaryGray">
                  You have been enrolled{selectedCourse ? ` in ${selectedCourse.name}` : ""} for{" "}
                  {program.name}.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-primary">Application submitted for review</h3>
                <p className="max-w-md text-sm text-primaryGray">
                  The School of Ministry team will review your application
                  {selectedCourse ? ` for ${selectedCourse.name}` : ""} and get back to you.
                </p>
              </>
            )}
          </section>
        )}
      </div>

      <div className="sticky bottom-0 z-20 border-t border-lightGray bg-white px-6 py-4 md:px-8">
        <div className="flex flex-wrap items-center justify-end gap-3">
          {step === 0 && (
            <>
              <Btn variant="secondary" onClick={onClose}>
                Cancel
              </Btn>
              <Btn variant="primary" onClick={() => setStep(1)}>
                Start application
              </Btn>
            </>
          )}

          {step === 1 && (
            <>
              {!selectedClassId && hasCourses && (
                <p className="mr-auto text-xs text-primaryGray">Select a class to continue.</p>
              )}
              <Btn variant="secondary" onClick={() => setStep(0)}>
                Back
              </Btn>
              <Btn
                variant="primary"
                onClick={() => setStep(2)}
                disabled={!selectedClassId || !hasCourses}
              >
                Continue
              </Btn>
            </>
          )}

          {step === 2 && (
            <>
              <Btn variant="secondary" onClick={() => setStep(1)} disabled={!!submitting}>
                Back
              </Btn>
              <Btn variant="primary" onClick={handleSubmitApplication} disabled={!!submitting}>
                {submitting ? "Submitting…" : "Submit application"}
              </Btn>
            </>
          )}

          {step === 3 && (
            <Btn variant="primary" onClick={handleDone}>
              Done
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
};
