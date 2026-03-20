import { FC, memo, type ReactNode } from "react";
import { Programs } from "@/utils";
import { Button } from "@/components";
import {
  AcademicCapIcon,
  BookOpenIcon,
  CalendarDaysIcon,
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

/* --------------------------- Main Modal Component --------------------------- */
export const ProgramDetailsModal: FC<{
  program: Programs | null;
  selectedClassId: string;
  onSelectClass: (id: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting?: boolean;
}> = ({ program, selectedClassId, onSelectClass, onClose, onSubmit, submitting }) => {
  if (!program) return null;

  const hasCourses = (program.courses?.length ?? 0) > 0;
  const hasTopics = (program.topics?.length ?? 0) > 0;
  const hasPrerequisites = (program.prerequisites?.length ?? 0) > 0;
  const audienceTags = [
    program.member_required ? "Church members" : null,
    program.ministry_required ? "Ministry workers" : null,
    program.leader_required ? "Leaders" : null,
  ].filter(Boolean) as string[];

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="sticky top-0 z-20 border-b border-lightGray bg-gradient-to-r from-primary/10 via-white to-lightGray/20 px-6 py-6 md:px-8">
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
      </div>

      <div className="app-scrollbar flex-1 overflow-y-auto px-6 py-6 md:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
          <section className="space-y-6">
            <div className="rounded-xl border border-lightGray bg-white p-5">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-primaryGray">
                Program Overview
              </h3>
              <p className="text-sm leading-relaxed text-primaryGray">
                {program.description || "Program details will be updated soon."}
              </p>
            </div>

            <div className="rounded-xl border border-lightGray bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primaryGray">
                Topics Covered
              </h3>
              {!hasTopics ? (
                <p className="text-sm text-primaryGray">Topics will be published soon.</p>
              ) : (
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
              )}
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-xl border border-lightGray bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primaryGray">
                Prerequisites
              </h3>
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

            <div className="rounded-xl border border-lightGray bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primaryGray">
                Designed For
              </h3>
              <div className="flex flex-wrap gap-2">
                {audienceTags.length ? (
                  audienceTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-lightGray/40 px-3 py-1.5 text-sm font-medium text-primary"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-primaryGray">Open to all members.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-lightGray bg-white p-5">
              <fieldset className="space-y-3">
                <legend className="mb-1 text-sm font-semibold uppercase tracking-wide text-primaryGray">
                  Select Class
                </legend>

                {!hasCourses ? (
                  <div className="rounded-lg border border-dashed border-lightGray p-8 text-center">
                    <p className="text-sm text-primaryGray">No classes available yet.</p>
                  </div>
                ) : (
                  <div className="max-h-[45vh] space-y-3 overflow-y-auto pr-1">
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
            </div>
          </section>
        </div>
      </div>

      <div className="sticky bottom-0 z-20 border-t border-lightGray bg-white px-6 py-4 md:px-8">
        <div className="flex flex-wrap items-center justify-end gap-3">
          {!selectedClassId && hasCourses && (
            <p className="mr-auto text-xs text-primaryGray">Select a class to continue.</p>
          )}
          <Button
            value="Cancel"
            variant="secondary"
            onClick={onClose}
            disabled={!!submitting}
          />
          <Button
            value="Enroll"
            variant="primary"
            onClick={onSubmit}
            loading={!!submitting}
            disabled={!selectedClassId || !hasCourses || !!submitting}
          />
        </div>
      </div>
    </div>
  );
};
