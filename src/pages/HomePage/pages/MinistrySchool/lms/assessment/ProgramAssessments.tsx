import { Modal } from "@/components/Modal";
import { useFetch } from "@/CustomHooks/useFetch";
import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils";
import type { DueRule, GradingCategory, Topic, Weekday } from "@/utils/api/ministrySchool/interfaces";
import { cn } from "@/utils/cn";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { runAction } from "../runAction";
import { describeRule, somPaths, unitLabel } from "../somUtils";
import { Btn, EmptyBlock, Panel, SimpleTable, StatusPill } from "../ui";

type UnitData = {
  type?: string;
  rubricId?: number | null;
  due_rule?: DueRule | null;
  data?: {
    questions?: { bankQuestionId?: number }[];
    passMark?: number;
    maxAttempts?: number;
    maxAttempt?: number;
    weight?: string;
    status?: "draft" | "published";
  };
};

const unitOf = (t: Topic) => (t.LearningUnit ?? t.learningUnit) as unknown as UnitData | undefined;

const WEEKDAYS: Weekday[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_LIMITS = ["None", "10 min", "20 min", "30 min", "60 min", "90 min"];
const ATTEMPTS = ["1", "2", "3", "Unlimited"];

/** Assessment kinds offered in the "Add assessment" modal. */
const ASSESS_KINDS: { key: GradingCategory; label: string; unitType: "assignment" | "assignment-essay" }[] = [
  { key: "quiz", label: "Quiz", unitType: "assignment" },
  { key: "exam", label: "Exam", unitType: "assignment" },
  { key: "essay", label: "Essay", unitType: "assignment-essay" },
];

const selectClass = "h-10 w-full rounded-lg border border-lightGray bg-white px-2.5 text-sm text-primary";
const inputClass = "h-10 w-full rounded-lg border border-lightGray bg-white px-3 text-sm text-primary";

/** Program → Assessments: the quizzes/essays/exams for every cohort of this program. */
export const ProgramAssessments = ({
  programId,
  topics,
  canManage,
  onChanged,
}: {
  programId: number;
  topics: Topic[];
  canManage: boolean;
  onChanged: () => void;
}) => {
  const navigate = useNavigate();
  const { data: moduleData } = useFetch(api.fetch.fetchProgramModules, { programId: String(programId) }, !canManage);
  const [busy, setBusy] = useState(false);

  const modules = moduleData?.data?.modules ?? [];
  const moduleTitle = new Map(modules.map((m) => [m.id, m.title]));
  const assessments = topics.filter((t) => ["assignment", "assignment-essay"].includes(unitOf(t)?.type ?? ""));

  // ── add-assessment modal state ────────────────────────────────────────────
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [moduleId, setModuleId] = useState<number | "">("");
  const [kind, setKind] = useState<GradingCategory>("quiz");
  const [weight, setWeight] = useState("");
  const [attempts, setAttempts] = useState("2");
  const [timeLimit, setTimeLimit] = useState("None");
  const [dueWeek, setDueWeek] = useState(1);
  const [dueDay, setDueDay] = useState<Weekday>("Fri");

  const openAdd = () => {
    setName("");
    setModuleId(modules[0]?.id ?? "");
    setKind("quiz");
    setWeight("");
    setAttempts("2");
    setTimeLimit("None");
    setDueWeek(1);
    setDueDay("Fri");
    setAdding(true);
  };

  const createAssessment = async () => {
    if (!name.trim()) {
      showNotification("Give the assessment a name.", "error");
      return;
    }
    const spec = ASSESS_KINDS.find((k) => k.key === kind)!;
    const maxAttempts = attempts === "Unlimited" ? 99 : Number(attempts) || 1;
    const timeLimitMin = timeLimit === "None" ? null : Number(timeLimit.replace(/\D/g, "")) || null;
    const base = { maxAttempts, weight, timeLimit: timeLimitMin, status: "draft" as const };
    const learningUnit = {
      type: spec.unitType,
      maxAttempts,
      data: spec.unitType === "assignment-essay" ? { question: "", ...base } : { questions: [], ...base },
    };
    const payload = {
      id: 0,
      name: name.trim(),
      description: "",
      programId: Number(programId),
      type: spec.unitType,
      learningUnit,
      ...(moduleId !== "" ? { moduleId: Number(moduleId) } : {}),
    };

    setBusy(true);
    let newTopicId: number | undefined;
    const ok = await runAction(
      async () => {
        const res = await api.post.createTopic(payload);
        newTopicId = (res as { data?: { id?: number } })?.data?.id;
        if (newTopicId) {
          const due_rule: DueRule = { week: dueWeek, mode: "day", day: dueDay };
          await api.put.updateUnitSettings({ topicId: newTopicId, due_rule, grading_category: kind });
        }
      },
      { success: "Assessment created", failure: "Could not create the assessment" }
    );
    setBusy(false);
    if (ok) {
      setAdding(false);
      onChanged();
      if (newTopicId) navigate(somPaths.assessmentBuilder(programId, newTopicId));
    }
  };

  const statusOf = (t: Topic) => (unitOf(t)?.data?.status === "draft" ? "Draft" : "Published");

  return (
    <>
      <Panel
        title="Assessments in this program"
        action={
          <div className="flex gap-2">
            <Btn size="sm" to={somPaths.library}>
              Library
            </Btn>
            {canManage && (
              <Btn size="sm" variant="primary" onClick={openAdd}>
                + Add assessment
              </Btn>
            )}
          </div>
        }
      >
        <SimpleTable<Topic>
          rows={assessments}
          rowKey={(t) => t.id}
          minWidth={900}
          empty={
            <EmptyBlock
              msg="No assessments yet. Add a quiz, exam or essay — it also appears as a unit in the curriculum."
              action={canManage ? <Btn size="sm" variant="primary" onClick={openAdd}>+ Add assessment</Btn> : undefined}
            />
          }
          columns={[
            {
              key: "name",
              header: "Assessment",
              render: (t) => (
                <Btn variant="ghost" size="sm" to={somPaths.assessmentBuilder(programId, t.id)} className="!px-0 font-medium">
                  {t.name}
                </Btn>
              ),
            },
            {
              key: "module",
              header: "Module",
              render: (t) => <span className="text-sm text-primaryGray">{t.moduleId ? moduleTitle.get(t.moduleId) ?? "—" : "—"}</span>,
            },
            { key: "type", header: "Type", render: (t) => <StatusPill status={unitLabel(unitOf(t)?.type)} /> },
            {
              key: "qs",
              header: "Questions",
              render: (t) => (unitOf(t)?.type === "assignment" ? unitOf(t)?.data?.questions?.length ?? 0 : 1),
            },
            {
              key: "weight",
              header: "Weight",
              render: (t) => <span className="font-medium text-amber-700">{unitOf(t)?.data?.weight || "—"}</span>,
            },
            {
              key: "due",
              header: "Due",
              render: (t) => (
                <span className={unitOf(t)?.due_rule ? "text-primaryGray" : "text-amber-700"}>{describeRule(unitOf(t)?.due_rule)}</span>
              ),
            },
            {
              key: "attempts",
              header: "Attempts",
              render: (t) => {
                const n = unitOf(t)?.data?.maxAttempts ?? unitOf(t)?.data?.maxAttempt;
                return n ? (n >= 99 ? "Unlimited" : n) : "—";
              },
            },
            { key: "status", header: "Status", render: (t) => <StatusPill status={statusOf(t)} /> },
          ]}
        />
        <p className="border-t border-gray-100 px-4 py-2.5 text-xs text-mainGray">
          Edit questions, settings and publishing in each assessment&apos;s builder. Due rules and categories also appear in the
          Curriculum tab; each cohort is graded in Cohort → Gradebook.
        </p>
      </Panel>

      {/* Add assessment */}
      <Modal open={adding} onClose={() => setAdding(false)} className="!max-w-lg" title="Add assessment">
        <div className="flex flex-col gap-4 p-5">
          <div>
            <h3 className="text-lg font-semibold text-primary">New assessment</h3>
            <p className="text-sm text-primaryGray">Saved as a draft; you&apos;ll add questions next.</p>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-primary">Name</span>
            <input className={inputClass} placeholder="e.g. Module 3 quiz" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-primary">Module</span>
            <select className={selectClass} value={moduleId} onChange={(e) => setModuleId(e.target.value ? Number(e.target.value) : "")}>
              <option value="">No module (unassigned)</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-mainGray">It also appears as a unit in this module&apos;s Curriculum.</span>
          </label>
          <div>
            <span className="mb-1 block text-xs font-medium text-primary">Type</span>
            <div className="flex gap-1.5">
              {ASSESS_KINDS.map((k) => (
                <button
                  key={k.key}
                  type="button"
                  onClick={() => setKind(k.key)}
                  className={cn(
                    "rounded-lg border px-3.5 py-1.5 text-sm font-medium",
                    kind === k.key ? "border-primary bg-primary text-white" : "border-lightGray text-primaryGray hover:bg-gray-50"
                  )}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-primary">Counts toward final grade</span>
              <input className={inputClass} placeholder="e.g. 10%" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-primary">Attempts</span>
              <select className={selectClass} value={attempts} onChange={(e) => setAttempts(e.target.value)}>
                {ATTEMPTS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-primary">Time limit</span>
              <select className={selectClass} value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)}>
                {TIME_LIMITS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <div>
              <span className="mb-1 block text-xs font-medium text-primary">Due</span>
              <div className="grid grid-cols-2 gap-1.5">
                <select aria-label="Week" className={selectClass} value={dueWeek} onChange={(e) => setDueWeek(Number(e.target.value))}>
                  {Array.from({ length: 16 }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>
                      Week {w}
                    </option>
                  ))}
                </select>
                <select aria-label="Day" className={selectClass} value={dueDay} onChange={(e) => setDueDay(e.target.value as Weekday)}>
                  {WEEKDAYS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <p className="text-xs text-mainGray">
            Due {describeRule({ week: dueWeek, mode: "day", day: dueDay })} in every cohort. Each cohort turns this into a calendar
            date from its start date.
          </p>
          <div className="flex items-center justify-end gap-2">
            <Btn onClick={() => setAdding(false)}>Cancel</Btn>
            <Btn variant="primary" disabled={busy || !name.trim()} onClick={createAssessment}>
              Create &amp; add questions
            </Btn>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ProgramAssessments;
