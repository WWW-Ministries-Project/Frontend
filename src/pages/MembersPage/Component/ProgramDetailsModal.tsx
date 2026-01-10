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
        : "bg-gray-50 text-gray-700"
    }`}
  >
    {children}
  </span>
);

const ProgressBar: FC<{ value: number }> = ({ value }) => (
  <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100">
    <div 
      className="h-full bg-gray-900 transition-all duration-300" 
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
      className={`group block cursor-pointer rounded-lg border border-gray-200 p-5 transition-all hover:border-gray-900 ${
        checked ? "border-gray-900 bg-gray-50" : "bg-white"
      } ${isFull ? "opacity-50 cursor-not-allowed hover:border-gray-200" : ""}`}
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
          className="mt-0.5 h-4 w-4 border-gray-300 text-gray-900 focus:ring-1 focus:ring-gray-900 disabled:cursor-not-allowed"
          aria-label={`${name}${isFull ? " (Full)" : ""}`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h4 className="text-sm font-medium text-gray-900 leading-tight">{name}</h4>
            <Badge variant={isFull ? "full" : "default"}>
              {isFull ? "Full" : "Available"}
            </Badge>
          </div>

          <div className="space-y-2.5">
            {facilitator && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{facilitator}</span>
              </div>
            )}

            {meetingDays && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{meetingDays}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm text-gray-600">
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
      <div className="sticky top-0 z-20 bg-white flex items-start justify-between p-6 pb-5 border-b border-gray-100">
        <div className="flex-1 pr-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">{program.name}</h2>
          {program.upcomingCohort && (
            <p className="text-sm text-gray-600">{program.upcomingCohort}</p>
          )}
        </div>
        <button 
          type="button" 
          onClick={onClose}
          className="p-1 -mr-1 -mt-1 text-gray-400 hover:text-gray-900 transition-colors"
          aria-label="Close program details"
        >
          <XCircleIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pr-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-500">
        {/* Description */}
        {program.description && (
          <section aria-labelledby="about-program">
            <h3 id="about-program" className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">
              About
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {program.description}
            </p>
          </section>
        )}

        {/* Prerequisites */}
        <section aria-labelledby="prerequisites">
          <h3 id="prerequisites" className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Prerequisites
          </h3>
          {!program.prerequisites || program.prerequisites.length === 0 ? (
            <p className="text-sm text-gray-700">No prerequisite required</p>
          ) : (
            <ul className="space-y-1.5">
              {program.prerequisites.map((pr, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start">
                  <span className="mr-2 text-gray-400">•</span>
                  <span>{pr}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Designed For */}
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Designed For
          </h3>
          <div className="flex flex-wrap gap-2">
            {program.member_required && <span className="px-3 py-1.5 bg-gray-50 text-sm text-gray-700 rounded">
              Church members
            </span>}
            {program.ministry_required && <span className="px-3 py-1.5 bg-gray-50 text-sm text-gray-700 rounded">
              Ministry workers
            </span>}
            {program.leader_required && <span className="px-3 py-1.5 bg-gray-50 text-sm text-gray-700 rounded">
              Leaders
            </span>}
          </div>
        </section>

        {/* Topics */}
        {program.topics && program.topics.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">
              Topics Covered
            </h3>
            <div className="flex flex-col gap-2">
              {program.topics.map((topic, index) => (
                <div
                  key={index}
                  className="px-3 py-1.5 bg-gray-50 text-sm text-gray-700 rounded"
                >
                  <p className="font-medium">{topic.name}</p>
                  <p
                  className="font-light"
                  dangerouslySetInnerHTML={{ __html: topic.description }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Classes */}
        <section>
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Select Class
            </legend>

            {!hasCourses ? (
              <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center">
                <p className="text-sm text-gray-500">No classes available yet</p>
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
      <div className="sticky bottom-0 z-20 bg-white border-gray-100 px-6 py-4">
        <Actions onCancel={onClose} onSubmit={onSubmit} loading={!!submitting} SubmitLabel={'Enroll'}/>
      </div>
    </div>
  );
};