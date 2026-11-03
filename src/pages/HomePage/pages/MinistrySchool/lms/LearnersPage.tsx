import PageOutline from "@/pages/HomePage/Components/PageOutline";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSomAccess } from "../utils/useSomAccess";
import { ReviewQueue } from "./people/ReviewQueue";
import { useSomData, type EnrollmentRow } from "./somDataContext";
import { ATTENTION_RULE, type LearnerHealth, somPaths } from "./somUtils";
import { Avatar, EmptyBlock, PageHeader, Pill, ProgressBar, StatusPill, LoadError } from "./ui";

/** Attention-first ordering of the progress-health signal. */
const RANK: Record<LearnerHealth, number> = {
  Behind: 0,
  "Not started": 1,
  "On track": 2,
  Completed: 3,
};
const HEALTH_ORDER: LearnerHealth[] = ["Behind", "Not started", "On track", "Completed"];

type MultiFilter = "any" | "multi" | "single";
type SortKey = "attention" | "name";

type Filters = {
  q: string;
  prog: string; // program id, "" = all
  coh: string; // cohort id, "" = all
  stat: string; // LearnerHealth, "" = any
  multi: MultiFilter;
  sort: SortKey;
};

const EMPTY: Filters = { q: "", prog: "", coh: "", stat: "", multi: "any", sort: "attention" };

type Person = {
  userId: number;
  name: string;
  subtitle: string;
  programCount: number;
  others: string[];
  match: EnrollmentRow[];
  worst: number;
  first: EnrollmentRow;
};

export const LearnersPage = () => {
  const navigate = useNavigate();
  const { loading, enrollments, error, refetch } = useSomData();
  const canDecide = useSomAccess().canAll("decide_applications");
  const [f, setF] = useState<Filters>(EMPTY);
  const set = (patch: Partial<Filters>) => setF((p) => ({ ...p, ...patch }));

  // Options derived from the data actually present.
  const programOpts = useMemo(() => {
    const seen = new Map<string, string>();
    enrollments.forEach((e) => seen.set(String(e.program.id), e.program.title));
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [enrollments]);

  const cohortOpts = useMemo(() => {
    const seen = new Map<string, string>();
    enrollments
      .filter((e) => !f.prog || String(e.program.id) === f.prog)
      .forEach((e) => seen.set(String(e.cohort.id), e.cohort.name));
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [enrollments, f.prog]);

  const statusOpts = useMemo(() => {
    const present = new Set(enrollments.map((e) => e.health));
    return HEALTH_ORDER.filter((h) => present.has(h));
  }, [enrollments]);

  const people = useMemo<Person[]>(() => {
    const q = f.q.trim().toLowerCase();
    const enrOk = (e: EnrollmentRow) =>
      (!f.prog || String(e.program.id) === f.prog) &&
      (!f.coh || String(e.cohort.id) === f.coh) &&
      (!f.stat || e.health === f.stat);

    const byUser = new Map<number, EnrollmentRow[]>();
    enrollments.forEach((e) => {
      const list = byUser.get(e.user_id) ?? [];
      list.push(e);
      byUser.set(e.user_id, list);
    });

    const rows: Person[] = [];
    byUser.forEach((list, userId) => {
      const name = list[0].name;
      if (q && !name.toLowerCase().includes(q)) return;
      const programCount = new Set(list.map((e) => e.program.id)).size;
      if (f.multi === "multi" && programCount <= 1) return;
      if (f.multi === "single" && programCount !== 1) return;

      const match = list.filter(enrOk).sort((a, b) => RANK[a.health] - RANK[b.health]);
      if (!match.length) return;

      const matchPrograms = new Set(match.map((e) => e.program.id));
      const others = [
        ...new Set(
          list.filter((e) => !matchPrograms.has(e.program.id)).map((e) => e.program.title)
        ),
      ];
      const worst = Math.min(...list.map((e) => RANK[e.health] ?? 2));
      rows.push({
        userId,
        name,
        subtitle: list[0].user?.email ?? list[0].user?.member_id ?? "",
        programCount,
        others,
        match,
        worst,
        first: match[0],
      });
    });

    return rows.sort((a, b) =>
      f.sort === "name" ? a.name.localeCompare(b.name) : a.worst - b.worst || a.name.localeCompare(b.name)
    );
  }, [enrollments, f]);

  const enrCount = people.reduce((n, p) => n + p.match.length, 0);
  const active = !!f.q || !!f.prog || !!f.coh || !!f.stat || f.multi !== "any";
  const summary = `${people.length} ${people.length === 1 ? "learner" : "learners"} · ${enrCount} ${
    enrCount === 1 ? "enrollment" : "enrollments"
  }${active ? " match" : ""}`;

  const openStudent = (e: EnrollmentRow) => navigate(somPaths.student(e.cohort.id, e.cls.id, e.id));

  const selectCls =
    "h-10 rounded-lg border border-lightGray bg-white px-2.5 text-sm text-primary";

  return (
    <PageOutline>
      <div className="flex flex-col gap-4">
        {error && <LoadError msg={error} onRetry={refetch} />}
        <PageHeader
          title="Learners"
          subtitle="Eligible applicants are enrolled automatically. Review the ones the rules held back."
        />

        <ReviewQueue canManage={canDecide} programFilter={f.prog || undefined} onDecided={refetch} />

        <div className="flex flex-wrap items-center gap-2">
          <label className="relative block min-w-0 flex-1 basis-60">
            <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mainGray">
              ⌕
            </span>
            <input
              type="search"
              value={f.q}
              onChange={(e) => set({ q: e.target.value })}
              placeholder="Search learners by name"
              aria-label="Search learners"
              className="h-10 w-full rounded-lg border border-lightGray bg-white pl-8 pr-3 text-sm"
            />
          </label>
          <select aria-label="Program" value={f.prog} onChange={(e) => set({ prog: e.target.value, coh: "" })} className={selectCls}>
            <option value="">All programs</option>
            {programOpts.map(([id, title]) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </select>
          <select aria-label="Cohort" value={f.coh} onChange={(e) => set({ coh: e.target.value })} className={selectCls}>
            <option value="">All cohorts</option>
            {cohortOpts.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <select aria-label="Status" value={f.stat} onChange={(e) => set({ stat: e.target.value })} className={selectCls}>
            <option value="">Any status</option>
            {statusOpts.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          <select aria-label="Number of programs" value={f.multi} onChange={(e) => set({ multi: e.target.value as MultiFilter })} className={selectCls}>
            <option value="any">Any number of programs</option>
            <option value="multi">In 2+ programs</option>
            <option value="single">In 1 program</option>
          </select>
          <select aria-label="Sort" value={f.sort} onChange={(e) => set({ sort: e.target.value as SortKey })} className={selectCls}>
            <option value="attention">Needs attention first</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-primaryGray">
          <span>{summary}</span>
          {active && (
            <button
              type="button"
              onClick={() => set({ q: "", prog: "", coh: "", stat: "", multi: "any" })}
              className="font-medium text-primary underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {loading && !enrollments.length ? (
          <SkeletonLoader />
        ) : people.length === 0 ? (
          <EmptyBlock msg="No learners match. Try a different name or clear the filters." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            {people.map((p) => (
              <div key={p.userId} className="flex flex-wrap gap-x-5 gap-y-3 border-t border-gray-100 p-4 first:border-t-0">
                <div className="flex min-w-0 flex-[1_1_220px] items-start gap-2.5">
                  <Avatar name={p.name} />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => openStudent(p.first)}
                      className="self-start truncate text-left text-sm font-semibold text-primary hover:underline"
                    >
                      {p.name}
                    </button>
                    <span className="text-xs text-mainGray">
                      {p.programCount === 1 ? "1 program" : `${p.programCount} programs`}
                      {p.subtitle ? ` · ${p.subtitle}` : ""}
                    </span>
                    {p.others.length > 0 && (
                      <span className="text-xs text-mainGray/80">Also in {p.others.join(", ")}</span>
                    )}
                  </div>
                </div>

                <div className="flex min-w-0 flex-[4_1_520px] flex-col gap-1.5">
                  {p.match.map((e) => (
                    <div
                      key={e.id}
                      className="grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] items-center gap-x-3 gap-y-2 rounded-lg border border-gray-100 bg-gray-50/60 px-2.5 py-2 text-[13px]"
                    >
                      <div className="col-span-2 min-w-0">
                        <p className="truncate font-semibold text-primary">{e.program.title}</p>
                        <p className="truncate text-xs text-mainGray">
                          {e.cohort.name} · {e.cls.name} ·{" "}
                          <Pill tone={e.enrolled_source === "MANUAL" ? "indigo" : "blue"}>
                            {e.enrolled_source === "MANUAL" ? "Manual" : "Auto"}
                          </Pill>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ProgressBar value={e.completion_percent} />
                        <span className="w-9 text-right text-xs tabular-nums text-primaryGray">
                          {Math.round(e.completion_percent)}%
                        </span>
                      </div>
                      <div className="text-xs text-primaryGray">
                        <span className="text-mainGray">Grade</span>{" "}
                        <b className="text-primary">{e.grade_percent == null ? "—" : `${Math.round(e.grade_percent)}%`}</b>{" "}
                        · <span className="text-mainGray">Att.</span>{" "}
                        {e.attendance_percent == null ? "—" : `${Math.round(e.attendance_percent)}%`}
                        {e.missing_count ? <span className="ml-1 text-red-700">· {e.missing_count} missing</span> : null}
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <StatusPill status={e.health} />
                        <button
                          type="button"
                          onClick={() => openStudent(e)}
                          className="rounded-md border border-lightGray bg-white px-2.5 py-1 text-xs font-medium text-primary hover:bg-gray-50"
                        >
                          Manage
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <p className="border-t border-gray-100 px-4 py-2 text-xs text-mainGray">{ATTENTION_RULE}</p>
          </div>
        )}
      </div>
    </PageOutline>
  );
};

export default LearnersPage;
