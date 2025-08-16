import { FC, memo, useMemo } from "react";
import { Programs } from "@/utils";
import { XCircleIcon, UsersIcon } from "@heroicons/react/24/outline";
import { Actions } from "@/components/ui/form/Actions";

/* ------------------------------- Utilities ------------------------------- */
const pctFilled = (enrolled: number, capacity: number) => {
  if (!capacity || capacity <= 0) return 0;
  return Math.min(100, Math.round((enrolled / capacity) * 100));
};

const Badge: FC<{ tone?: "neutral" | "danger"; children: React.ReactNode }> = ({ tone = "neutral", children }) => (
  <span
    className={
      tone === "danger"
        ? "inline-flex items-center rounded-md bg-red-100 px-2 py-0.5 text-xs text-red-700"
        : "inline-flex items-center rounded-md border border-gray-300 px-2 py-0.5 text-xs text-gray-700"
    }
  >
    {children}
  </span>
);

const ProgressBar: FC<{ value: number; label?: string }> = ({ value, label }) => (
  <div
    className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
    role="progressbar"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={value}
    aria-label={label ?? `Progress ${value}%`}
  >
    <div className="h-full rounded-full bg-gray-900 transition-all" style={{ width: `${value}%` }} />
  </div>
);

/* ----------------------------- Small Components ----------------------------- */
const PrereqList: FC<{ items?: string[] | null }> = ({ items }) => {
  if (!items || items.length === 0) return <div>No prerequisite required</div>;
  return (
    <ul className="list-disc space-y-1 pl-5 text-gray-600">
      {items.map((pr, idx) => (
        <li key={idx}>{pr}</li>
      ))}
    </ul>
  );
};

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
      className={`block cursor-pointer rounded-lg border p-4 transition-colors hover:bg-gray-50 ${
        isFull ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          id={`course-${id}`}
          type="radio"
          name="class"
          value={id}
          checked={checked}
          onChange={() => onChange(id)}
          disabled={isFull}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400 disabled:cursor-not-allowed"
          aria-label={`${name}${isFull ? " (Full)" : ""}`}
        />
        <div className="w-full">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-base font-medium text-gray-900">{name}</span>
            <div className="flex items-center gap-2">
              <Badge tone={isFull ? "danger" : "neutral"}>{isFull ? "Full" : "Open"}</Badge>
              <span className="inline-flex items-center text-sm text-gray-500">
                <UsersIcon className="mr-1 h-4 w-4" aria-hidden="true" />
                {(enrolled ?? 0)} / {(capacity ?? 0)}
              </span>
            </div>
          </div>

          {facilitator && <p className="mt-1 text-sm text-gray-600">Facilitator: {facilitator}</p>}

          {meetingDays && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                {meetingDays}
              </span>
            </div>
          )}

          <div className="mt-3">
            <ProgressBar value={pct} label={`Enrollment ${pct}%`} />
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
    <div className="w-[90vw] max-w-3xl space-y-4 rounded-xl bg-white p-4 md:w-[50vw]">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-lg font-semibold md:text-xl">{program.name}</div>
          {program.upcomingCohort && <div>{program.upcomingCohort}</div>}
        </div>
        <button type="button" onClick={onClose} aria-label="Close program details">
          <XCircleIcon height={24} className="cursor-pointer" />
        </button>
      </div>

      <hr />

      <section aria-labelledby="about-program">
        <h3 id="about-program" className="font-semibold">
          About this program
        </h3>
        <div>{program.description || "-"}</div>
      </section>

      <section aria-labelledby="prerequisites">
        <h3 id="prerequisites" className="font-semibold">
          Prerequisites
        </h3>
        <PrereqList items={program.prerequisites} />
      </section>

      <section>
        <fieldset className="space-y-2">
          <legend className="font-semibold">Select a class</legend>

          {!hasCourses ? (
            <div className="rounded-md border border-dashed p-6 text-center text-gray-500">
              No classes available yet.
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

        <div className="mt-4">
          <Actions onCancel={onClose} onSubmit={onSubmit} loading={!!submitting} />
        </div>
      </section>
    </div>
  );
};
