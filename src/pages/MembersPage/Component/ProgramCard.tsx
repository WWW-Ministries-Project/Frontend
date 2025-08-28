import { FC } from "react";
import { Programs } from "@/utils";
import { Button } from "@/components";

export const ProgramCard: FC<{ program: Programs; onOpen: () => void }> = ({ program, onOpen }) => (
  <article className="flex flex-col rounded-lg border bg-white shadow-sm transition hover:shadow-md">
    <div className="p-5">
      <h2 className="text-lg font-semibold">{program.name}</h2>
      <div className="mt-1 inline-flex items-center gap-2 rounded-md border px-2 py-0.5 text-xs text-gray-700">
        Cohort: {program.upcomingCohort}
      </div>
      {program.topics?.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-gray-700">Topics covered</p>
          <div className="flex flex-wrap gap-2">
            {program.topics.map((topic) => (
              <span key={topic} className="inline-flex rounded-md border px-2 py-1 text-xs text-gray-700">
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
    <div className="mt-auto border-t p-5">
      <Button value="View details" onClick={onOpen} className="w-full"/>
      
    </div>
  </article>
);
