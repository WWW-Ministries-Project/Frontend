import { FC } from "react";
import { Programs } from "@/utils";
import { XCircleIcon, UsersIcon } from "@heroicons/react/24/outline";
import { Actions } from "@/components/ui/form/Actions";

export const ProgramDetailsModal: FC<{
  program: Programs | null;
  selectedClassId: string;
  onSelectClass: (id: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting?: boolean;
}> = ({ program, selectedClassId, onSelectClass, onClose, onSubmit, submitting }) => {
  if (!program) return null;

  return (
    <div className="w-[90vw] max-w-3xl space-y-4 rounded-xl bg-white p-4 md:w-[50vw]">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-lg font-semibold md:text-xl">{program.name}</div>
          <div>{program.upcomingCohort}</div>
        </div>
        <XCircleIcon height={24} onClick={onClose} className="cursor-pointer" />
      </div>
      <hr />
      <div>
        <div className="font-semibold">About this program</div>
        <div>{program.description || "-"}</div>
      </div>
      <div>
        <div className="font-semibold">Prerequisites</div>
        {program.prerequisites && program.prerequisites?.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-gray-600">
            {program.prerequisites.map((pr, idx) => (
              <li key={idx}>{pr}</li>
            ))}
          </ul>
        ) : (
          <div>No prerequisite required</div>
        )}
      </div>
      <div className="space-y-2">
        <div className="font-semibold">Select a class</div>
        {program.courses?.map((cls) => {
          const isFull = cls.enrolled >= cls.capacity;
          const pct = Math.min(100, Math.round((cls.enrolled / cls.capacity) * 100));
          return (
            <label
                      key={cls.id}
                      className={`block cursor-pointer rounded-lg border p-4 transition-colors hover:bg-gray-50 ${
                        isFull ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="class"
                          value={cls.id}
                          checked={selectedClassId === cls.id}
                          onChange={(e) => onSelectClass(e.target.value)}
                          disabled={isFull}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400 disabled:cursor-not-allowed"
                          aria-label={`${cls.name}${isFull ? " (Full)" : ""}`}
                        />
                        <div className="w-full">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-base font-medium text-gray-900">{cls.name}</span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ${
                                  isFull ? "bg-red-100 text-red-700" : "border border-gray-300 text-gray-700"
                                }`}
                              >
                                {isFull ? "Full" : "Open"}
                              </span>
                              <span className="inline-flex items-center text-sm text-gray-500">
                                <UsersIcon className="mr-1 h-4 w-4" aria-hidden="true" />
                                {cls.enrolled} / {cls.capacity}
                              </span>
                            </div>
                          </div>

                          <p  className="mt-1 text-sm text-gray-600">
                            Facilitator: {cls.facilitator}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                            <div className="flex flex-wrap gap-1">
                                <span
                                  className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                                >
                                  {cls.meetingDays}
                                </span>
                            </div>
                          </div>

                          <div className="mt-3">
                            <div
                              className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
                              role="progressbar"
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-valuenow={pct}
                              aria-label={`Enrollment ${pct}%`}
                            >
                              <div
                                className="h-full rounded-full bg-gray-900 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>
          );
        })}
        <Actions onCancel={onClose} onSubmit={onSubmit} loading={!!submitting} />
      </div>
    </div>
  );
};
