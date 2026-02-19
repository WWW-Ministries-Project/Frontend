import { FC, memo, useMemo } from "react";
import { Programs } from "@/utils";
import { XCircleIcon, UsersIcon } from "@heroicons/react/24/outline";
import { Actions } from "@/components/ui/form/Actions";

/* ------------------------------- Utilities ------------------------------- */
const pctFilled = (enrolled: number, capacity: number) => {
  if (!capacity || capacity <= 0) return 0;
  return Math.min(100, Math.round((enrolled / capacity) * 100));
};

const Badge: FC<{ variant?: "default" | "full"; children: React.ReactNode }> = ({ 
  variant = "default", 
  children 
}) => (
  <span
    className={`inline-flex items-center rounded px-2 py-0.5 text-sm font-medium ${
      variant === "full"
        ? "bg-red-50 text-red-700"
        : "bg-lightGray/40 text-primaryGray"
    }`}
  >
    {children}
  </span>
);

const ProgressBar: FC<{ value: number }> = ({ value }) => (
  <div className="h-1 w-full overflow-hidden rounded-full bg-lightGray/50">
    <div 
      className="h-full bg-primary transition-all duration-300" 
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
  const { id, name, enrolled, capacity, facilitator, meetingDays } = course;
  const isFull = (enrolled ?? 0) >= (capacity ?? 0) && (capacity ?? 0) > 0;
  const pct = useMemo(() => pctFilled(enrolled ?? 0, capacity ?? 0), [enrolled, capacity]);

  return (
    <label
      htmlFor={`course-${id}`}
      className={`group block cursor-pointer rounded-lg border border-lightGray p-5 transition-all hover:border-primary ${
        checked ? "border-primary bg-primary/5" : "bg-white"
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
          className="mt-0.5 h-4 w-4 border-lightGray text-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed"
          aria-label={`${name}${isFull ? " (Full)" : ""}`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h4 className="text-sm font-medium leading-tight text-primary">{name}</h4>
            <Badge variant={isFull ? "full" : "default"}>
              {isFull ? "Full" : "Available"}
            </Badge>
          </div>

          <div className="space-y-2.5">
            {facilitator && (
              <div className="flex items-center gap-2 text-sm text-primaryGray">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{facilitator}</span>
              </div>
            )}

            {meetingDays && (
              <div className="flex items-center gap-2 text-sm text-primaryGray">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{meetingDays}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm text-primaryGray">
                <span className="flex items-center gap-1.5">
                  <UsersIcon className="h-3.5 w-3.5" />
                  Enrollment
                </span>
                <span className="font-medium">
                  {enrolled ?? 0} / {capacity ?? 0}
                </span>
              </div>
              <ProgressBar value={pct} />
            </div>
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

  return (
    <div className="w-[95vw] max-w-2xl h-[80vh] bg-white rounded-xl shadow-sm flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-start justify-between border-b border-lightGray bg-white p-6 pb-5">
        <div className="flex-1 pr-4">
          <h2 className="mb-1 text-xl font-semibold text-primary">{program.name}</h2>
          {program.upcomingCohort && (
            <p className="text-sm text-primaryGray">{program.upcomingCohort}</p>
          )}
        </div>
        <button 
          type="button" 
          onClick={onClose}
          className="-mr-1 -mt-1 p-1 text-primaryGray transition-colors hover:text-primary"
          aria-label="Close program details"
        >
          <XCircleIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="app-scrollbar flex-1 space-y-6 overflow-y-auto p-6 pr-4">
        {/* Description */}
        {program.description && (
          <section aria-labelledby="about-program">
            <h3 id="about-program" className="mb-2 text-sm font-semibold uppercase tracking-wide text-primaryGray">
              About
            </h3>
            <p className="text-sm leading-relaxed text-primaryGray">
              {program.description}
            </p>
          </section>
        )}

        {/* Prerequisites */}
        <section aria-labelledby="prerequisites">
          <h3 id="prerequisites" className="mb-2 text-sm font-semibold uppercase tracking-wide text-primaryGray">
            Prerequisites
          </h3>
          {!program.prerequisites || program.prerequisites.length === 0 ? (
            <p className="text-sm text-primaryGray">No prerequisite required</p>
          ) : (
            <ul className="space-y-1.5">
              {program.prerequisites.map((pr, idx) => (
                <li key={idx} className="flex items-start text-sm text-primaryGray">
                  <span className="mr-2 text-primaryGray">•</span>
                  <span>{pr}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Designed For */}
        <section>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-primaryGray">
            Designed For
          </h3>
          <div className="flex flex-wrap gap-2">
            {program.member_required && <span className="rounded bg-lightGray/30 px-3 py-1.5 text-sm text-primaryGray">
              Church members
            </span>}
            {program.ministry_required && <span className="rounded bg-lightGray/30 px-3 py-1.5 text-sm text-primaryGray">
              Ministry workers
            </span>}
            {program.leader_required && <span className="rounded bg-lightGray/30 px-3 py-1.5 text-sm text-primaryGray">
              Leaders
            </span>}
          </div>
        </section>

        {/* Topics */}
        {program.topics && program.topics.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-primaryGray">
              Topics Covered
            </h3>
            <div className="flex flex-col gap-2">
              {program.topics.map((topic, index) => (
                <div
                  key={index}
                  className="rounded bg-lightGray/30 px-3 py-1.5 text-sm text-primaryGray"
                >
                  <p className="font-medium">{topic.name}</p>
                  <p
                  className="font-light"
                  dangerouslySetInnerHTML={{ __html: String(topic.description ?? "") }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Classes */}
        <section>
          <fieldset className="space-y-3">
            <legend className="mb-3 text-sm font-semibold uppercase tracking-wide text-primaryGray">
              Select Class
            </legend>

            {!hasCourses ? (
              <div className="rounded-lg border border-dashed border-lightGray p-8 text-center">
                <p className="text-sm text-primaryGray">No classes available yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {program.courses!.map((cls) => (
                  <CourseRadioCard
                    key={cls.id}
                    course={cls}
                    checked={selectedClassId === cls.id}
                    onChange={onSelectClass}
                  />
                ))}
              </div>
            )}
          </fieldset>
        </section>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 z-20 border-t border-lightGray bg-white px-6 py-4">
        <Actions onCancel={onClose} onSubmit={onSubmit} loading={!!submitting} SubmitLabel={'Enroll'}/>
      </div>
    </div>
  );
};
