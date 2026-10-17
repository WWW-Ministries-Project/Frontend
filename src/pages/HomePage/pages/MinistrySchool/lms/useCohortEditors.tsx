import { Modal } from "@/components/Modal";
import { showDeleteDialog, showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils";
import {
  COHORT_STATUS,
  normalizeCohortStatus,
  type SomClass,
  type SomCohort,
} from "@/utils/api/ministrySchool/interfaces";
import { useState } from "react";
import { ClassForm, IClassForm } from "../Components/ClassForm";
import { CohortForm, ICohortForm } from "../Components/CohortForm";
import { createLmsActionTracker } from "../utils/lmsGuardrails";

const toCohortForm = (cohort: SomCohort): ICohortForm => ({
  id: cohort.id,
  name: cohort.name,
  duration: cohort.duration,
  description: cohort.description,
  startDate: cohort.startDate,
  applicationDeadline: cohort.applicationDeadline,
  status: normalizeCohortStatus(cohort.status) ?? COHORT_STATUS.UPCOMING,
  branch_id: "",
});

const toClassForm = (cls: SomClass): IClassForm => ({
  id: cls.id,
  name: cls.name,
  capacity: cls.capacity,
  schedule: cls.schedule,
  classFormat: cls.classFormat ?? "",
  location: cls.location ?? "",
  meetingLink: cls.meetingLink ?? "",
  instructorId: cls.instructor?.id || undefined,
  branch_id: "",
});

/** Create / edit / delete for cohorts and their classes, reusing the existing forms. */
export const useCohortEditors = ({ onChanged }: { onChanged: () => void }) => {
  const [cohortModal, setCohortModal] = useState<{ programId: number; cohort?: ICohortForm } | null>(null);
  const [classModal, setClassModal] = useState<{ cohortId: number; cls?: IClassForm } | null>(null);
  const [savingClass, setSavingClass] = useState(false);

  const newCohort = (programId: number) => setCohortModal({ programId });
  const editCohort = (cohort: SomCohort) =>
    setCohortModal({ programId: cohort.programId, cohort: toCohortForm(cohort) });
  const deleteCohort = (cohort: { id: number; name: string }, after?: () => void) =>
    showDeleteDialog({ name: cohort.name, id: cohort.id }, async () => {
      try {
        await api.delete.deleteCohort({ id: String(cohort.id) });
        showNotification("Cohort deleted", "success");
        onChanged();
        after?.();
      } catch {
        showNotification("Could not delete the cohort", "error");
      }
    });

  const newClass = (cohortId: number) => setClassModal({ cohortId });
  const editClass = (cls: SomClass) => setClassModal({ cohortId: cls.cohortId, cls: toClassForm(cls) });
  const deleteClass = (cls: { id: number; name: string }, after?: () => void) =>
    showDeleteDialog({ name: cls.name, id: cls.id }, async () => {
      try {
        await api.delete.deleteCourse({ id: String(cls.id) });
        showNotification("Class deleted", "success");
        onChanged();
        after?.();
      } catch {
        showNotification("Could not delete the class", "error");
      }
    });

  const submitClass = async (values: IClassForm) => {
    if (!classModal) return;
    const branchPayload = values.branch_id !== "" ? { branch_id: values.branch_id } : {};
    const editing = classModal.cls?.id;
    const tracker = createLmsActionTracker(editing ? "admin.class.update" : "admin.class.create", {
      cohortId: String(classModal.cohortId),
    });
    setSavingClass(true);
    try {
      if (editing) {
        await api.put.updateClass({ ...values, ...branchPayload, id: Number(editing) }, { id: String(editing) });
      } else {
        await api.post.createCourse({ ...values, ...branchPayload, cohortId: classModal.cohortId });
      }
      tracker.success();
      showNotification(editing ? "Class updated" : "Class created", "success");
      setClassModal(null);
      onChanged();
    } catch (error) {
      tracker.failure({ error });
      showNotification(error instanceof Error ? error.message : "Could not save the class", "error");
    } finally {
      setSavingClass(false);
    }
  };

  const modals = (
    <>
      <Modal open={Boolean(cohortModal)} onClose={() => setCohortModal(null)} className="!max-w-[46rem]" title="Cohort">
        {cohortModal && (
          <CohortForm
            onClose={() => setCohortModal(null)}
            cohort={cohortModal.cohort}
            programId={cohortModal.programId}
            onSuccess={() => {
              setCohortModal(null);
              onChanged();
            }}
          />
        )}
      </Modal>
      <Modal open={Boolean(classModal)} onClose={() => setClassModal(null)} className="!max-w-[46rem]" title="Class">
        {classModal && (
          <ClassForm
            onClose={() => setClassModal(null)}
            initialData={classModal.cls}
            onSubmit={submitClass}
            loading={savingClass}
          />
        )}
      </Modal>
    </>
  );

  return { newCohort, editCohort, deleteCohort, newClass, editClass, deleteClass, modals };
};
