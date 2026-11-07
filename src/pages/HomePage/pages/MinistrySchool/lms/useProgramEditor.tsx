import { Modal } from "@/components/Modal";
import { showDeleteDialog, showNotification } from "@/pages/HomePage/utils";
import { ALL_BRANCHES, useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils";
import type {
  ProgramResponse,
  ProgramsPayloadType,
  SomProgramFull,
} from "@/utils/api/ministrySchool/interfaces";
import { useCallback, useState } from "react";
import { IProgramForm, ProgramForm } from "../Components/ProgramForm";
import { createLmsActionTracker } from "../utils/lmsGuardrails";

type EditableProgram = Pick<
  SomProgramFull,
  "id" | "title" | "description" | "member_required" | "leader_required" | "ministry_required" | "program_details"
> & {
  topics: { name: string }[];
  prerequisitePrograms: Array<{ prerequisiteId?: number; id?: number; prerequisite?: { id: number; title: string }; title?: string }>;
};

/** ProgramForm expects `prerequisitePrograms[].id`; the API returns `{ prerequisiteId, prerequisite }`. */
const toFormProgram = (p: EditableProgram): ProgramResponse =>
  ({
    ...p,
    topics: p.topics,
    grading_mode: (p.program_details?.grading_mode as ProgramResponse["grading_mode"]) ?? "PASS_FAIL",
    auto_enroll: p.program_details?.auto_enroll ?? true,
    status: p.program_details?.status as ProgramResponse["status"],
    prerequisitePrograms: p.prerequisitePrograms.map((pr) => ({
      id: pr.prerequisiteId ?? pr.prerequisite?.id ?? pr.id ?? 0,
      title: pr.prerequisite?.title ?? pr.title ?? "",
    })),
  }) as unknown as ProgramResponse;

export const useProgramEditor = ({
  allPrograms,
  onSaved,
  onDeleted,
  onCreated,
}: {
  allPrograms: { id: number; title: string }[];
  onSaved?: () => void;
  onDeleted?: () => void;
  /** Called after a program is created (not edited), with its new id — used to open the setup flow. */
  onCreated?: (program: { id: number }) => void;
}) => {
  const { activeBranchId } = useBranchStore();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<ProgramResponse | undefined>();

  const openCreate = useCallback(() => {
    setEditing(undefined);
    setOpen(true);
  }, []);

  const openEdit = useCallback((program: EditableProgram) => {
    setEditing(toFormProgram(program));
    setOpen(true);
  }, []);

  const close = () => {
    setOpen(false);
    setEditing(undefined);
  };

  const handleSubmit = async (value: IProgramForm) => {
    if (!editing && activeBranchId === ALL_BRANCHES && !value.branch_id) {
      showNotification("Please select a branch", "error");
      return;
    }
    const payload: ProgramsPayloadType = {
      title: value.title,
      description: value.description,
      prerequisites: value.isPrerequisitesChecked ? value.prerequisites : [],
      member_required: value.member_required,
      leader_required: value.leader_required,
      ministry_required: value.ministry_required,
      grading_mode: value.grading_mode,
      auto_enroll: value.auto_enroll,
      ...(value.branch_id !== "" ? { branch_id: value.branch_id } : {}),
      // New programs are saved as drafts; the curriculum is built before publish.
      ...(editing ? {} : { status: "DRAFT" }),
    };

    const tracker = createLmsActionTracker(
      editing ? "admin.program.update" : "admin.program.create",
      editing ? { programId: String(editing.id) } : undefined
    );
    setSaving(true);
    try {
      let createdId: number | undefined;
      if (editing) {
        await api.put.updateProgram(payload, { id: String(editing.id) });
      } else {
        const res = await api.post.createProgram(payload);
        createdId = (res as { data?: { id?: number } } | undefined)?.data?.id;
      }
      tracker.success();
      showNotification(editing ? "Program updated" : "Program created", "success");
      close();
      onSaved?.();
      if (createdId) onCreated?.({ id: createdId });
    } catch (error) {
      tracker.failure({ error });
      showNotification(
        error instanceof Error ? error.message : "Could not save the program",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const publish = async (program: EditableProgram) => {
    const tracker = createLmsActionTracker("admin.program.update", {
      programId: String(program.id),
    });
    try {
      // Omit prerequisites so the update keeps the program's existing ones
      // (updateProgram replaces prerequisites whenever that key is present).
      await api.put.updateProgram(
        {
          title: program.title,
          description: program.description,
          member_required: program.member_required,
          leader_required: program.leader_required,
          ministry_required: program.ministry_required,
          status: "PUBLISHED",
        },
        { id: String(program.id) }
      );
      tracker.success();
      showNotification("Program published", "success");
      onSaved?.();
    } catch (error) {
      tracker.failure({ error });
      showNotification(
        error instanceof Error ? error.message : "Could not publish the program",
        "error"
      );
    }
  };

  const confirmDelete = (program: { id: number; title: string }) =>
    showDeleteDialog({ name: program.title, id: program.id }, async () => {
      const tracker = createLmsActionTracker("admin.program.delete", {
        programId: String(program.id),
      });
      try {
        await api.delete.deleteProgram({ id: String(program.id) });
        tracker.success();
        showNotification("Program deleted", "success");
        onDeleted?.();
      } catch (error) {
        tracker.failure({ error });
        showNotification("Could not delete the program", "error");
      }
    });

  const modal = (
    <Modal open={open} onClose={close} className="!max-w-[46rem]" title="Program">
      <ProgramForm
        onClose={close}
        program={editing}
        prerequisitesDropdown={allPrograms
          .filter((p) => p.id !== editing?.id)
          .map((p) => ({ value: String(p.id), label: p.title }))}
        handleSubmit={handleSubmit}
        loading={saving}
      />
    </Modal>
  );

  return { openCreate, openEdit, publish, confirmDelete, modal };
};
