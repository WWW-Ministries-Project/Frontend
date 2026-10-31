import { Modal } from "@/components/Modal";
import { useFetch } from "@/CustomHooks/useFetch";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { showDeleteDialog } from "@/pages/HomePage/utils";
import { api } from "@/utils";
import type {
  DueRule,
  GradingCategory,
  ModuleTopic,
  ProgramModule,
  Topic,
} from "@/utils/api/ministrySchool/interfaces";
import { cn } from "@/utils/cn";
import { useMemo, useState } from "react";
import TopicBasicInfoForm from "../../Components/TopicBasicInfoForm";
import { runAction } from "../runAction";
import { defaultCategory, describeRule, isAssessmentUnit, unitLabel } from "../somUtils";
import { Btn, EmptyBlock, StatusPill } from "../ui";
import { LibraryPickerModal } from "../library/LibraryPickerModal";
import { DueRuleModal } from "./DueRuleModal";

type Group = { key: string; module: ProgramModule | null; topics: ModuleTopic[] };

const byOrder = (a: ModuleTopic, b: ModuleTopic) =>
  (a.order_number ?? Number.MAX_SAFE_INTEGER) - (b.order_number ?? Number.MAX_SAFE_INTEGER) || a.id - b.id;

const fieldClass = "h-10 w-full rounded-lg border border-lightGray bg-inputBackground px-3 text-sm text-primary";

/**
 * Curriculum organised as modules → units. Unit content is still edited with
 * the existing TopicBasicInfoForm; this board owns grouping, order, due rules
 * and grading categories. The program-wide topic order is rewritten to follow
 * module order so learners see units in the same sequence.
 */
export const ModuleBoard = ({
  programId,
  detailTopics,
  canManage,
  onChanged,
}: {
  programId: number;
  detailTopics: Topic[];
  canManage: boolean;
  onChanged: () => void;
}) => {
  const { data, loading, refetch } = useFetch(api.fetch.fetchProgramModules, { programId: String(programId) });
  const [busy, setBusy] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  const [moduleForm, setModuleForm] = useState<{ id?: number; title: string; weeks: string; description: string } | null>(null);
  const [unitEditor, setUnitEditor] = useState<{ topic: Topic | null } | null>(null);
  const [ruleFor, setRuleFor] = useState<ModuleTopic | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const groups: Group[] = useMemo(() => {
    const modules = [...(data?.data?.modules ?? [])].sort((a, b) => a.order_number - b.order_number || a.id - b.id);
    const list: Group[] = modules.map((m) => ({ key: `m-${m.id}`, module: m, topics: [...m.topics].sort(byOrder) }));
    const unassigned = [...(data?.data?.unassigned ?? [])].sort(byOrder);
    if (unassigned.length || !modules.length) list.push({ key: "unassigned", module: null, topics: unassigned });
    return list;
  }, [data]);

  const modules = groups.filter((g) => g.module).map((g) => g.module!);

  const refresh = () => {
    refetch();
    onChanged();
  };

  const mutate = async (fn: () => Promise<unknown>, success: string, failure: string) => {
    setBusy(true);
    const ok = await runAction(fn, { success, failure });
    setBusy(false);
    if (ok) refresh();
    return ok;
  };

  /** Rewrites topic order_number so it follows module order, then unassigned. */
  const persistOrder = (nextGroups: Group[]) =>
    api.put.reorderProgramTopics({
      programId,
      topics: nextGroups.flatMap((g) => g.topics).map((t, i) => ({ id: t.id, order_number: i + 1 })),
    });

  const moveUnit = (groupIndex: number, index: number, delta: -1 | 1) => {
    const next = groups.map((g) => ({ ...g, topics: [...g.topics] }));
    const list = next[groupIndex].topics;
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    void mutate(() => persistOrder(next), "Unit order saved", "Could not reorder units");
  };

  const moveModule = (index: number, delta: -1 | 1) => {
    const ordered = [...modules];
    const target = index + delta;
    if (target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    const nextGroups = [
      ...ordered.map((m) => groups.find((g) => g.module?.id === m.id)!),
      ...groups.filter((g) => !g.module),
    ];
    void mutate(
      async () => {
        await api.put.reorderProgramModules({
          programId,
          modules: ordered.map((m, i) => ({ id: m.id, order_number: i + 1 })),
        });
        await persistOrder(nextGroups);
      },
      "Module order saved",
      "Could not reorder modules"
    );
  };

  const assignModule = (topic: ModuleTopic, moduleId: number | null) => {
    const next = groups.map((g) => ({ ...g, topics: g.topics.filter((t) => t.id !== topic.id) }));
    const targetKey = moduleId ? `m-${moduleId}` : "unassigned";
    let target = next.find((g) => g.key === targetKey);
    if (!target) {
      target = { key: "unassigned", module: null, topics: [] };
      next.push(target);
    }
    target.topics.push({ ...topic, moduleId });
    void mutate(
      async () => {
        await api.put.setTopicModule({ topicId: topic.id, moduleId });
        await persistOrder(next);
      },
      "Unit moved",
      "Could not move the unit"
    );
  };

  const saveModule = async () => {
    if (!moduleForm) return;
    const payload = {
      title: moduleForm.title.trim(),
      description: moduleForm.description.trim() || null,
      weeks: moduleForm.weeks === "" ? null : Number(moduleForm.weeks),
    };
    if (!payload.title) return;
    const ok = await mutate(
      () =>
        moduleForm.id
          ? api.put.updateProgramModule(payload, { id: String(moduleForm.id) })
          : api.post.createProgramModule({ ...payload, programId }),
      moduleForm.id ? "Module updated" : "Module added",
      "Could not save the module"
    );
    if (ok) setModuleForm(null);
  };

  const deleteModule = (m: ProgramModule) =>
    showDeleteDialog({ name: m.title, id: m.id }, () =>
      mutate(
        () => api.delete.deleteProgramModule({ id: String(m.id) }),
        "Module deleted. Its units are now unassigned.",
        "Could not delete the module"
      )
    );

  const deleteUnit = (t: ModuleTopic) =>
    showDeleteDialog({ name: t.name, id: t.id }, () =>
      mutate(() => api.delete.deleteTopic({ id: String(t.id) }), "Unit deleted", "Could not delete the unit")
    );

  const saveRule = async (next: { due_rule: DueRule | null; grading_category: GradingCategory | null }) => {
    if (!ruleFor) return;
    const ok = await mutate(
      () => api.put.updateUnitSettings({ topicId: ruleFor.id, ...next }),
      "Due rule saved",
      "Could not save the due rule"
    );
    if (ok) setRuleFor(null);
  };

  if (loading && !data) return <SkeletonLoader />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-primary">Curriculum</h3>
          <p className="text-sm text-primaryGray">
            Group units into modules. Changes apply to every live and future cohort.
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Btn size="sm" onClick={() => setLibraryOpen(true)}>
              Add from library
            </Btn>
            <Btn size="sm" onClick={() => setUnitEditor({ topic: null })}>
              + Unit
            </Btn>
            <Btn size="sm" variant="primary" onClick={() => setModuleForm({ title: "", weeks: "", description: "" })}>
              + Module
            </Btn>
          </div>
        )}
      </div>

      {groups.every((g) => g.topics.length === 0) && modules.length === 0 && (
        <EmptyBlock msg="No units yet. Add a module, then add units to it." />
      )}

      {groups.map((g, gi) => {
        const moduleIndex = g.module ? modules.findIndex((m) => m.id === g.module!.id) : -1;
        const isCollapsed = g.module ? collapsed[g.module.id] : false;
        return (
          <section key={g.key} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
              <button
                type="button"
                onClick={() => g.module && setCollapsed((c) => ({ ...c, [g.module!.id]: !c[g.module!.id] }))}
                className="flex min-w-0 items-center gap-2 text-left"
                aria-expanded={!isCollapsed}
              >
                {g.module && <span className={cn("text-xs text-mainGray transition", !isCollapsed && "rotate-90")}>▸</span>}
                {g.module ? (
                  <>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-mainGray">
                      Module {moduleIndex + 1}
                    </span>
                    <span className="truncate text-sm font-semibold text-primary">{g.module.title}</span>
                  </>
                ) : (
                  <span className="text-sm font-semibold text-primary">Not in a module</span>
                )}
                <span className="whitespace-nowrap text-xs text-mainGray">
                  · {g.topics.length} unit{g.topics.length === 1 ? "" : "s"}
                  {g.module?.weeks ? ` · ${g.module.weeks} week${g.module.weeks === 1 ? "" : "s"}` : ""}
                </span>
              </button>
              {canManage && g.module && (
                <div className="flex gap-1">
                  <Btn size="sm" disabled={busy || moduleIndex === 0} onClick={() => moveModule(moduleIndex, -1)} title="Move up">
                    ↑
                  </Btn>
                  <Btn
                    size="sm"
                    disabled={busy || moduleIndex === modules.length - 1}
                    onClick={() => moveModule(moduleIndex, 1)}
                    title="Move down"
                  >
                    ↓
                  </Btn>
                  <Btn
                    size="sm"
                    onClick={() =>
                      setModuleForm({
                        id: g.module!.id,
                        title: g.module!.title,
                        weeks: g.module!.weeks?.toString() ?? "",
                        description: g.module!.description ?? "",
                      })
                    }
                  >
                    Edit
                  </Btn>
                  <Btn size="sm" className="text-red-700" onClick={() => deleteModule(g.module!)}>
                    Delete
                  </Btn>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <ul>
                {g.topics.length === 0 && (
                  <li className="px-4 py-3 text-sm text-primaryGray">
                    No units here yet. Use “Module” on a unit to move it in.
                  </li>
                )}
                {g.topics.map((t, ti) => {
                  const type = t.LearningUnit?.type;
                  const assessed = isAssessmentUnit(type);
                  return (
                    <li key={t.id} className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-2.5 last:border-0">
                      {canManage && (
                        <span className="flex flex-col">
                          <button
                            type="button"
                            aria-label={`Move ${t.name} up`}
                            disabled={busy || ti === 0}
                            onClick={() => moveUnit(gi, ti, -1)}
                            className="text-[10px] leading-none text-mainGray hover:text-primary disabled:opacity-30"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            aria-label={`Move ${t.name} down`}
                            disabled={busy || ti === g.topics.length - 1}
                            onClick={() => moveUnit(gi, ti, 1)}
                            className="text-[10px] leading-none text-mainGray hover:text-primary disabled:opacity-30"
                          >
                            ▼
                          </button>
                        </span>
                      )}
                      <StatusPill status={unitLabel(type)} />
                      <button
                        type="button"
                        disabled={!canManage}
                        onClick={() => setUnitEditor({ topic: detailTopics.find((d) => Number(d.id) === t.id) ?? null })}
                        className="min-w-0 flex-1 truncate text-left text-sm font-medium text-primary hover:underline disabled:no-underline"
                      >
                        {t.name}
                      </button>
                      {assessed && (
                        <button
                          type="button"
                          disabled={!canManage}
                          onClick={() => setRuleFor(t)}
                          className={cn(
                            "rounded-full border px-2.5 py-0.5 text-xs",
                            t.LearningUnit?.due_rule
                              ? "border-gray-200 text-primaryGray hover:bg-gray-50"
                              : "border-amber-200 bg-amber-50 text-amber-800"
                          )}
                        >
                          {describeRule(t.LearningUnit?.due_rule)}
                          {t.LearningUnit?.grading_category ? ` · ${t.LearningUnit.grading_category}` : ""}
                        </button>
                      )}
                      {canManage && (
                        <>
                          <select
                            aria-label={`Module for ${t.name}`}
                            value={t.moduleId ?? ""}
                            disabled={busy}
                            onChange={(e) => assignModule(t, e.target.value ? Number(e.target.value) : null)}
                            className="h-8 max-w-[11rem] rounded-lg border border-lightGray bg-white px-2 text-xs text-primary"
                          >
                            <option value="">No module</option>
                            {modules.map((m, i) => (
                              <option key={m.id} value={m.id}>
                                Module {i + 1}: {m.title}
                              </option>
                            ))}
                          </select>
                          <Btn size="sm" className="text-red-700" onClick={() => deleteUnit(t)}>
                            Delete
                          </Btn>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}

      <Modal open={Boolean(moduleForm)} onClose={() => setModuleForm(null)} className="!max-w-lg" title="Module">
        {moduleForm && (
          <div className="flex flex-col gap-4 p-5">
            <h3 className="text-lg font-semibold text-primary">{moduleForm.id ? "Edit module" : "New module"}</h3>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-primary">Title</span>
              <input
                className={fieldClass}
                value={moduleForm.title}
                maxLength={191}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-primary">Length in weeks (optional)</span>
              <input
                type="number"
                min={0}
                max={104}
                className={`${fieldClass} w-28`}
                value={moduleForm.weeks}
                onChange={(e) => setModuleForm({ ...moduleForm, weeks: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-primary">Description (optional)</span>
              <textarea
                rows={3}
                className="rounded-lg border border-lightGray bg-inputBackground px-3 py-2 text-sm text-primary"
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
              />
            </label>
            <div className="flex justify-end gap-2">
              <Btn onClick={() => setModuleForm(null)}>Cancel</Btn>
              <Btn variant="primary" disabled={busy || !moduleForm.title.trim()} onClick={saveModule}>
                Save module
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(unitEditor)} onClose={() => setUnitEditor(null)} className="h-full w-[80vw]" title="Unit">
        {unitEditor && (
          <TopicBasicInfoForm
            onClose={() => setUnitEditor(null)}
            topicToEdit={
              unitEditor.topic
                ? {
                    id: unitEditor.topic.id,
                    name: unitEditor.topic.name,
                    description: String(unitEditor.topic.description ?? ""),
                    learningUnit: (unitEditor.topic.LearningUnit ?? unitEditor.topic.learningUnit ?? null) as never,
                  }
                : null
            }
            refetchProgram={refresh}
          />
        )}
      </Modal>

      <LibraryPickerModal
        programId={programId}
        modules={modules.map((m) => ({ id: m.id, title: m.title }))}
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onAdded={refresh}
      />

      <DueRuleModal
        open={Boolean(ruleFor)}
        unitName={ruleFor?.name ?? ""}
        rule={ruleFor?.LearningUnit?.due_rule ?? null}
        category={ruleFor?.LearningUnit?.grading_category ?? null}
        defaultCategory={defaultCategory(ruleFor?.LearningUnit?.type) as GradingCategory | null}
        saving={busy}
        onClose={() => setRuleFor(null)}
        onSave={saveRule}
      />
    </div>
  );
};

export default ModuleBoard;
