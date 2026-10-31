import { learnerPaths } from "@/pages/MembersPage/Pages/school/learnerPaths";
import {
  ASSESSMENT_TYPE,
  flattenAssignments,
  isOutstanding,
} from "@/pages/MembersPage/Pages/school/learnerUtils";
import type { LearnerEnrollment } from "@/utils/api/ministrySchool/interfaces";
import { useNavigate } from "react-router-dom";
import { shortDay } from "../utils/homeUtils";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** "Week 3 of 12" from the cohort start and a "12 weeks" style duration. */
const weekOf = (enrollment: LearnerEnrollment, now = new Date()) => {
  const start = new Date(enrollment.cohort.startDate);
  const total = Number((enrollment.cohort.duration || "").match(/(\d+)\s*week/i)?.[1]);
  if (Number.isNaN(start.getTime()) || !total || start > now) return "";
  const week = Math.min(total, Math.floor((now.getTime() - start.getTime()) / WEEK_MS) + 1);
  return `Week ${week} of ${total}`;
};

export const SchoolCard = ({
  enrollments,
  active,
}: {
  enrollments: LearnerEnrollment[];
  active: LearnerEnrollment[];
}) => {
  const navigate = useNavigate();
  const current = active.find((e) => e.nextTopic) ?? active[0];
  if (!current) return null;

  const week = weekOf(current);
  const percent = Math.max(0, Math.min(100, Math.round(current.progress.percent)));
  const sub = [current.cohort.name, current.class.name].filter(Boolean).join(" · ");
  const due = flattenAssignments(enrollments).find((a) => isOutstanding(a) && a.dueDate);
  const dueType = due ? ASSESSMENT_TYPE[due.type] : "";

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-[clamp(16px,2.5vw,24px)]">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold leading-7 text-primary">School of Ministry</h3>
        {week && (
          <span className="rounded-md bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800">
            {week}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-[15px] font-semibold text-primary">{current.program.title}</p>
        {sub && <p className="text-[13px] text-gray-500">{sub}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[13px]">
          <span className="text-gray-600">Progress</span>
          <span className="font-semibold text-primary">{percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-violet-600" style={{ width: `${percent}%` }} />
        </div>
      </div>
      {due?.dueDate && (
        <div className="flex flex-col gap-1 rounded-[10px] bg-violet-50 p-3">
          <span className="text-xs font-semibold uppercase tracking-[0.04em] text-violet-800">
            Due next · {shortDay(new Date(due.dueDate))}
          </span>
          <span className="text-sm font-semibold text-primary">
            {dueType ? `${dueType}: ${due.name}` : due.name}
          </span>
        </div>
      )}
      <button
        type="button"
        onClick={() => navigate(learnerPaths.program(current.program.id))}
        className="min-h-[44px] rounded-lg bg-[#080D2D] text-sm font-semibold text-[#fff] hover:bg-[#1F2A5C]"
      >
        Continue learning
      </button>
    </section>
  );
};
