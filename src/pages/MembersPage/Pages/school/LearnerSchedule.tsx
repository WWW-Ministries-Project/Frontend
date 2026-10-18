import { useState } from "react";
import { useFetch } from "@/CustomHooks/useFetch";
import {
  EmptyBlock,
  LoadError,
  PageHeader,
  Pill,
  type Tone,
} from "@/pages/HomePage/pages/MinistrySchool/lms/ui";
import { safeHttpUrl } from "@/pages/HomePage/pages/MinistrySchool/lms/somUtils";
import { api } from "@/utils/api/apiCalls";
import type { AttendanceStatus, LearnerSession } from "@/utils";
import { SESSION_MODE, calendarLink, dayParts, timeRange } from "./learnerUtils";

const ATTENDANCE: Record<AttendanceStatus, { label: string; tone: Tone }> = {
  PRESENT: { label: "Present", tone: "green" },
  LATE: { label: "Late", tone: "amber" },
  ABSENT: { label: "Absent", tone: "red" },
  EXCUSED: { label: "Excused", tone: "gray" },
};

const linkClass =
  "inline-flex h-8 items-center whitespace-nowrap rounded-md border border-lightGray bg-white px-3 text-[13px] font-medium text-primary hover:bg-gray-50";

const SessionRow = ({ s, past }: { s: LearnerSession; past: boolean }) => {
  const d = dayParts(s.startsAt);
  const mode = SESSION_MODE[s.mode] ?? SESSION_MODE.IN_PERSON;
  const join = safeHttpUrl(s.meetingLink);
  const mark = s.attendance ? ATTENDANCE[s.attendance] : null;

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 px-4 py-3.5 text-sm first:border-0">
      <div className="w-12 flex-shrink-0 text-center">
        <p className="text-[11px] uppercase text-mainGray">{d.day}</p>
        <p className="text-xl font-bold text-primary">{d.date}</p>
        <p className="text-[11px] text-mainGray">{d.month}</p>
      </div>
      <div className="min-w-[200px] flex-1">
        <p className={s.cancelled ? "font-semibold text-gray-400 line-through" : "font-semibold text-primary"}>
          {s.title}
        </p>
        <p className="text-[13px] text-mainGray">
          {[
            timeRange(s.startsAt, s.endsAt),
            s.location,
            s.instructorName,
            s.className ?? s.programTitle,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {s.notes && !past && <p className="mt-1 text-[13px] text-primaryGray">{s.notes}</p>}
      </div>
      {s.cancelled ? (
        <Pill tone="red">Cancelled</Pill>
      ) : (
        <>
          <Pill tone={mode.tone}>{mode.label}</Pill>
          {past ? (
            mark ? <Pill tone={mark.tone}>{mark.label}</Pill> : <Pill>Not recorded</Pill>
          ) : (
            <div className="flex gap-2">
              {join && s.mode !== "IN_PERSON" && (
                <a href={join} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  Join online
                </a>
              )}
              <a href={calendarLink(s)} target="_blank" rel="noopener noreferrer" className={linkClass}>
                Add to calendar
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const LearnerSchedule = () => {
  const { data, loading, error, refetch } = useFetch(api.fetch.fetchLearnerSessions);
  const [tab, setTab] = useState<"Upcoming" | "Past">("Upcoming");

  const now = Date.now();
  const sessions = data?.data ?? [];
  const isPast = (s: LearnerSession) => new Date(s.endsAt ?? s.startsAt).getTime() < now;
  const upcoming = sessions.filter((s) => !isPast(s));
  const past = sessions.filter(isPast).reverse();
  const shown = tab === "Upcoming" ? upcoming : past;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Schedule"
        subtitle="Live sessions for your class. Attendance is taken at each one."
      />

      <div role="tablist" aria-label="Sessions" className="flex flex-wrap gap-2">
        {(["Upcoming", "Past"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={
              tab === t
                ? "h-[34px] rounded-full border border-primary bg-primary px-3.5 text-[13px] font-medium text-white"
                : "h-[34px] rounded-full border border-lightGray bg-white px-3.5 text-[13px] font-medium text-primaryGray hover:bg-gray-50"
            }
          >
            {t} ({t === "Upcoming" ? upcoming.length : past.length})
          </button>
        ))}
      </div>

      {error && !data ? (
        <LoadError msg="We could not load your schedule." onRetry={() => refetch()} />
      ) : !loading && !shown.length ? (
        <EmptyBlock
          msg={
            tab === "Upcoming"
              ? "No sessions scheduled yet. Your instructor will add them here."
              : "No past sessions yet."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {shown.map((s) => (
            <SessionRow key={s.id} s={s} past={tab === "Past"} />
          ))}
        </div>
      )}
    </div>
  );
};

export default LearnerSchedule;
