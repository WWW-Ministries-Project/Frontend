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
    <section className="flex flex-col gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-[clamp(16px,2.5vw,24px)]">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold leading-7 text-[#080D2D]">School of Ministry</h3>
        {week && (
          <span className="rounded-md bg-[#EDEBFE] px-2 py-0.5 text-xs font-semibold text-[#5521B5]">
            {week}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-[15px] font-semibold text-[#080D2D]">{current.program.title}</p>
        {sub && <p className="text-[13px] text-[#6B7280]">{sub}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[13px]">
          <span className="text-[#4B5563]">Progress</span>
          <span className="font-semibold text-[#080D2D]">{percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#F3F4F6]">
          <div className="h-full rounded-full bg-[#7E3AF2]" style={{ width: `${percent}%` }} />
        </div>
      </div>
      {due?.dueDate && (
        <div className="flex flex-col gap-1 rounded-[10px] bg-[#F5F3FF] p-3">
          <span className="text-xs font-semibold uppercase tracking-[0.04em] text-[#5521B5]">
            Due next · {shortDay(new Date(due.dueDate))}
          </span>
          <span className="text-sm font-semibold text-[#080D2D]">
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
