import { Modal } from "@/components/Modal";
import { useFetch } from "@/CustomHooks/useFetch";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { showDeleteDialog } from "@/pages/HomePage/utils";
import { api } from "@/utils";
import type { LearningUnitType } from "@/utils";
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
import { Btn, EmptyBlock } from "../ui";
import { KebabMenu } from "../uiData";
import { TONE, UNIT_TONE } from "../uiTokens";
import { LibraryPickerModal } from "../library/LibraryPickerModal";
import { DueRuleModal } from "./DueRuleModal";

type Group = { key: string; module: ProgramModule | null; topics: ModuleTopic[] };

const byOrder = (a: ModuleTopic, b: ModuleTopic) =>
  (a.order_number ?? Number.MAX_SAFE_INTEGER) - (b.order_number ?? Number.MAX_SAFE_INTEGER) || a.id - b.id;

const fieldClass = "h-10 w-full rounded-lg border border-lightGray bg-inputBackground px-3 text-sm text-primary";

/** Adders shown under each module, mapped to the backend learning-unit type. */
const UNIT_ADDERS: { label: string; type: LearningUnitType }[] = [
  { label: "Lesson", type: "lesson-note" },
  { label: "Video", type: "video" },
  { label: "File", type: "pdf" },
  { label: "Live class", type: "live" },
  { label: "Assessment", type: "assignment" },
];

type DragUnit = { gi: number; ti: number };
type UnitEditor = { topic: Topic | null; moduleId: number | null; type?: LearningUnitType };

/**
 * Curriculum organised as modules → units, matching the SoM LMS prototype:
 * collapsible module cards, a per-module adder row that creates a unit of a set
 * type straight inside the module, and drag-to-reorder units within and across
 * modules. Unit content is still edited with TopicBasicInfoForm. The program-wide
 * topic order is rewritten to follow module order so learners see units in sequence.
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
  const [unitEditor, setUnitEditor] = useState<UnitEditor | null>(null);
  const [ruleFor, setRuleFor] = useState<ModuleTopic | null>(null);
  const [libraryFor, setLibraryFor] = useState<number | null>(null);
  const [dragUnit, setDragUnit] = useState<DragUnit | null>(null);
  const [dragModule, setDragModule] = useState<number | null>(null);

  const groups: Group[] = useMemo(() => {
    const modules = [...(data?.data?.modules ?? [])].sort((a, b) => a.order_number - b.order_number || a.id - b.id);
    const list: Group[] = modules.map((m) => ({ key: `m-${m.id}`, module: m, topics: [...m.topics].sort(byOrder) }));
    const unassigned = [...(data?.data?.unassigned ?? [])].sort(byOrder);
    if (unassigned.length) list.push({ key: "unassigned", module: null, topics: unassigned });
    return list;
  }, [data]);

  const modules = groups.filter((g) => g.module).map((g) => g.module!);
  const noModules = modules.length === 0;

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

  /** Moves a unit to a position in another (or the same) module, then persists. */
  const relocateUnit = (from: DragUnit, toGi: number, toIndex: number) => {
    const next = groups.map((g) => ({ ...g, topics: [...g.topics] }));
    const [moved] = next[from.gi].topics.splice(from.ti, 1);
    if (!moved) return;
    let idx = toIndex;
    if (from.gi === toGi && from.ti < toIndex) idx -= 1;
    const targetModuleId = next[toGi].module?.id ?? null;
    next[toGi].topics.splice(idx, 0, { ...moved, moduleId: targetModuleId });
    const movedModule = (moved.moduleId ?? null) !== targetModuleId;
    void mutate(
      async () => {
        if (movedModule) await api.put.setTopicModule({ topicId: moved.id, moduleId: targetModuleId });
        await persistOrder(next);
      },
      "Curriculum updated",
      "Could not reorder the curriculum"
    );
  };

  const reorderModules = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const ordered = [...modules];
    const [moved] = ordered.splice(fromIndex, 1);
    ordered.splice(toIndex, 0, moved);
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

  const editModule = (m: ProgramModule) =>
    setModuleForm({
      id: m.id,
      title: m.title,
      weeks: m.weeks?.toString() ?? "",
      description: m.description ?? "",
    });

  if (loading && !data) return <SkeletonLoader />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-primary">Curriculum</h3>
          <p className="text-sm text-primaryGray">Drag to reorder. Click a unit to edit it.</p>
        </div>
        {canManage && (
          <Btn size="sm" variant="primary" onClick={() => setModuleForm({ title: "", weeks: "", description: "" })}>
            + Module
          </Btn>
        )}
      </div>

      {noModules && (
        <EmptyBlock
          msg="No modules yet."
          action={
            canManage && (
              <Btn size="sm" variant="primary" onClick={() => setModuleForm({ title: "", weeks: "", description: "" })}>
                + Module
              </Btn>
            )
          }
        />
      )}

      {groups.map((g, gi) => {
        const m = g.module;
        const moduleIndex = m ? modules.findIndex((x) => x.id === m.id) : -1;
        const isCollapsed = m ? collapsed[m.id] : false;
        const unitCount = g.topics.length;
        const meta = m
          ? `${unitCount} unit${unitCount === 1 ? "" : "s"}${m.weeks ? ` · ${m.weeks} week${m.weeks === 1 ? "" : "s"}` : ""}`
          : `${unitCount} unit${unitCount === 1 ? "" : "s"}`;
        return (
          <section
            key={g.key}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white"
            onDragOver={(e) => {
              if (dragModule !== null && m) e.preventDefault();
            }}
            onDrop={() => {
              if (dragModule !== null && m && moduleIndex !== -1) {
                reorderModules(dragModule, moduleIndex);
                setDragModule(null);
              }
            }}
          >
            <div
              className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5"
              draggable={canManage && Boolean(m)}
              onDragStart={(e) => {
                if (!m) return;
                setDragModule(moduleIndex);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={() => setDragModule(null)}
            >
              <button
                type="button"
                onClick={() => m && setCollapsed((c) => ({ ...c, [m.id]: !c[m.id] }))}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                aria-expanded={!isCollapsed}
              >
                {m && (
                  <span className={cn("text-xs text-mainGray transition", !isCollapsed && "rotate-90")}>▸</span>
                )}
                {m ? (
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-mainGray">
                    Module {moduleIndex + 1}
                  </span>
                ) : null}
                <span className="truncate text-sm font-semibold text-primary">
                  {m ? m.title : "Not in a module"}
                </span>
                <span className="whitespace-nowrap text-xs text-mainGray">· {meta}</span>
              </button>
              {canManage && m && (
                <div className="flex items-center gap-1.5">
                  <Btn size="sm" onClick={() => setUnitEditor({ topic: null, moduleId: m.id })}>
                    + Unit
                  </Btn>
                  <KebabMenu
                    label={`Module ${moduleIndex + 1} actions`}
                    actions={[
                      { label: "Edit", onClick: () => editModule(m) },
                      { label: "Add from library", onClick: () => setLibraryFor(m.id) },
                      { label: "Delete", danger: true, onClick: () => deleteModule(m) },
                    ]}
                  />
                </div>
              )}
            </div>

            {!isCollapsed && (
              <>
                {m?.description && (
                  <p className="whitespace-pre-line bg-white px-4 pt-2.5 text-sm leading-relaxed text-primaryGray">
                    {m.description}
                  </p>
                )}
                {unitCount === 0 && (
                  <p className="bg-white px-4 py-2.5 text-sm text-primaryGray">
                    {m ? (
                      <>
                        No units yet.{" "}
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => setUnitEditor({ topic: null, moduleId: m.id })}
                            className="font-medium text-primary underline"
                          >
                            Add a unit
                          </button>
                        )}
                      </>
                    ) : (
                      "No units here yet. Drag a unit in, or delete this group."
                    )}
                  </p>
                )}

                <ul>
                  {g.topics.map((t, ti) => {
                    const type = t.LearningUnit?.type;
                    const assessed = isAssessmentUnit(type);
                    const tone = UNIT_TONE[unitLabel(type)] ?? "gray";
                    return (
                      <li
                        key={t.id}
                        draggable={canManage}
                        onDragStart={(e) => {
                          setDragUnit({ gi, ti });
                          e.dataTransfer.effectAllowed = "move";
                          e.stopPropagation();
                        }}
                        onDragEnd={() => setDragUnit(null)}
                        onDragOver={(e) => {
                          if (dragUnit) e.preventDefault();
                        }}
                        onDrop={(e) => {
                          if (!dragUnit) return;
                          e.stopPropagation();
                          relocateUnit(dragUnit, gi, ti);
                          setDragUnit(null);
                        }}
                        className="flex flex-wrap items-center gap-2.5 border-t border-gray-100 px-4 py-2.5 first:border-t-0 hover:bg-gray-50"
                      >
                        {canManage && (
                          <span
                            aria-hidden
                            className="cursor-grab select-none tracking-[-2px] text-gray-300"
                            title="Drag to reorder"
                          >
                            ⋮⋮
                          </span>
                        )}
                        <span
                          className={cn(
                            "min-w-[74px] rounded-md border px-2 py-0.5 text-center text-[11px] font-semibold",
                            TONE[tone]
                          )}
                        >
                          {unitLabel(type)}
                        </span>
                        <button
                          type="button"
                          disabled={!canManage}
                          onClick={() =>
                            setUnitEditor({
                              topic: detailTopics.find((d) => Number(d.id) === t.id) ?? null,
                              moduleId: t.moduleId,
                            })
                          }
                          className="min-w-0 flex-1 truncate text-left text-sm font-medium text-primary hover:underline disabled:no-underline"
                        >
                          {t.name}
                        </button>
                        {assessed && (
                          <button
                            type="button"
                            disabled={!canManage}
                            onClick={() => setRuleFor(t)}
                            className="whitespace-nowrap text-right text-xs font-semibold text-amber-700 hover:underline disabled:no-underline"
                          >
                            {t.LearningUnit?.due_rule ? describeRule(t.LearningUnit.due_rule) : "Set due rule"}
                          </button>
                        )}
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => deleteUnit(t)}
                            aria-label={`Delete ${t.name}`}
                            className="text-xs font-medium text-red-700 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {canManage && m && (
                  <div className="flex flex-wrap gap-3 border-t border-gray-100 px-4 py-2.5 text-xs font-medium text-primaryGray">
                    {UNIT_ADDERS.map((a) => (
                      <button
                        key={a.label}
                        type="button"
                        onClick={() => setUnitEditor({ topic: null, moduleId: m.id, type: a.type })}
                        className="hover:text-primary"
                      >
                        + {a.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setLibraryFor(m.id)}
                      className="hover:text-primary"
                    >
                      + From library
                    </button>
                  </div>
                )}
              </>
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

      <Modal open={Boolean(unitEditor)} onClose={() => setUnitEditor(null)} className="h-[80vh] w-[80vw]" title="Unit">
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
            moduleId={unitEditor.moduleId}
            moduleLabel={(() => {
              const idx = modules.findIndex((m) => m.id === unitEditor.moduleId);
              return idx >= 0 ? `Module ${idx + 1} · ${modules[idx].title}` : undefined;
            })()}
            initialUnitType={unitEditor.type}
            refetchProgram={refresh}
          />
        )}
      </Modal>

      <LibraryPickerModal
        programId={programId}
        modules={modules.map((m) => ({ id: m.id, title: m.title }))}
        defaultModuleId={libraryFor}
        open={libraryFor !== null}
        onClose={() => setLibraryFor(null)}
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
