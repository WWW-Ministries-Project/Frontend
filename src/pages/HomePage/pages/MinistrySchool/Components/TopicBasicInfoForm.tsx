import TextEditor from "@/components/TextEditor";
import { useFetch } from "@/CustomHooks/useFetch";
import { showNotification } from "@/pages/HomePage/utils";
import { api, LearningUnitType, Topic } from "@/utils";
import type { AssignmentQuestionType } from "@/utils/api/ministrySchool/interfaces";
import { ApiCreationCalls } from "@/utils/api/apiPost";
import { ApiUpdateCalls } from "@/utils/api/apiPut";
import { cn } from "@/utils/cn";
import { uploadImageFile } from "@/utils/uploadImage";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { createLmsActionTracker } from "../utils/lmsGuardrails";

interface TopicForm {
  topicName: string;
  topicDescription: string;
}

interface AssignmentOption {
  id: string;
  text: string;
}

interface AssignmentQuestion {
  id: string;
  type: AssignmentQuestionType;
  question: string;
  points: number;
  options: AssignmentOption[];
  correctOptionId: string | null;
}

interface AssignmentData {
  questions: AssignmentQuestion[];
  maxAttempts: number;
  passMark: number;
  weight: string;
}

interface EssayData {
  question: string;
  maxAttempts: number;
  passMark: number;
  weight: string;
}

interface TopicLearningUnit {
  type: LearningUnitType;
  data: Record<string, unknown>;
}

type EditableTopic = {
  id: string | number;
  name: string;
  description?: string | TrustedHTML | null | undefined;
  learningUnit?: (TopicLearningUnit & { rubricId?: number | null }) | null;
  LearningUnit?: (TopicLearningUnit & { rubricId?: number | null }) | null;
  type?: LearningUnitType;
};

interface TopicBasicInfoFormProps {
  creation?: boolean;
  onClose?: () => void;
  topicToEdit?: EditableTopic | null;
  refetchProgram?: () => void;
  /** Module the new unit is created in (curriculum board adders). Ignored on edit. */
  moduleId?: number | null;
  /** Human label for the owning module, e.g. "Module 2 · Foundations". Shown as context. */
  moduleLabel?: string;
  /** Pre-selects the learning-unit type when creating a new unit. Ignored on edit. */
  initialUnitType?: LearningUnitType;
}

const createId = () => crypto.randomUUID();

const blankOption = (): AssignmentOption => ({ id: createId(), text: "" });

/** A fresh quiz question for the given type. */
const newQuestion = (type: AssignmentQuestionType = "MULTIPLE_CHOICE"): AssignmentQuestion => {
  if (type === "TRUE_FALSE") {
    return {
      id: createId(),
      type,
      question: "",
      points: 1,
      options: [
        { id: "true", text: "True" },
        { id: "false", text: "False" },
      ],
      correctOptionId: "true",
    };
  }
  if (type === "SHORT_ANSWER" || type === "ESSAY") {
    return { id: createId(), type, question: "", points: 1, options: [], correctOptionId: null };
  }
  return {
    id: createId(),
    type: "MULTIPLE_CHOICE",
    question: "",
    points: 1,
    options: [blankOption(), blankOption(), blankOption(), blankOption()],
    correctOptionId: null,
  };
};

/** Blank learning-unit data for a freshly picked type. */
const defaultUnitData = (type: LearningUnitType): Record<string, unknown> => {
  if (type === "assignment") return { questions: [], maxAttempts: 2, passMark: 50, weight: "" };
  if (type === "assignment-essay") return { question: "", maxAttempts: 2, passMark: 50, weight: "" };
  if (type === "lesson-note") return { content: "" };
  if (type === "video") return { url: "" };
  if (type === "live") return { meetingLink: "", startsAt: "", takeAttendance: true };
  if (type === "in-person") return { venue: "", startsAt: "" };
  if (type === "pdf" || type === "ppt") return { link: "" };
  return {};
};

/** Order and labels mirror the prototype's unit-type picker. */
const LEARNING_UNIT_TYPES: { label: string; value: LearningUnitType }[] = [
  { label: "Lesson", value: "lesson-note" },
  { label: "Video", value: "video" },
  { label: "Live class", value: "live" },
  { label: "In person", value: "in-person" },
  { label: "PDF", value: "pdf" },
  { label: "Slides", value: "ppt" },
  { label: "Quiz", value: "assignment" },
  { label: "Essay", value: "assignment-essay" },
];

const QUESTION_TYPES: { label: string; value: AssignmentQuestionType }[] = [
  { label: "Multiple choice", value: "MULTIPLE_CHOICE" },
  { label: "True / false", value: "TRUE_FALSE" },
  { label: "Short answer", value: "SHORT_ANSWER" },
  { label: "Essay", value: "ESSAY" },
];

/** Accepted upload types per file-unit kind. */
const FILE_UPLOAD = {
  pdf: { mimes: ["application/pdf"], accept: ".pdf,application/pdf", label: "PDF" },
  ppt: {
    mimes: [
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    accept: ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation",
    label: "slides",
  },
} as const;

const isAssessmentType = (type?: LearningUnitType | null) =>
  type === "assignment" || type === "assignment-essay";

const isOpenQuestion = (type: AssignmentQuestionType) =>
  type === "SHORT_ANSWER" || type === "ESSAY";

const field =
  "w-full rounded-lg border border-lightGray bg-inputBackground px-3 py-2 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary";

const TopicBasicInfoForm = ({
  onClose,
  topicToEdit,
  refetchProgram,
  moduleId,
  moduleLabel,
  initialUnitType,
}: TopicBasicInfoFormProps) => {
  const { id: programId } = useParams();
  const apiPost = useMemo(() => new ApiCreationCalls(), []);
  const apiPut = useMemo(() => new ApiUpdateCalls(), []);
  const dragIndexRef = useRef<number | null>(null);

  const [topicForm, setTopicForm] = useState<TopicForm>({ topicName: "", topicDescription: "" });
  const [learningUnit, setLearningUnit] = useState<TopicLearningUnit | null>(null);
  const [rubricId, setRubricId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: rubricResponse } = useFetch(api.fetch.fetchRubrics);
  const rubrics = useMemo(() => rubricResponse?.data ?? [], [rubricResponse]);

  // Creating a new unit with a type preset by the curriculum adders.
  useEffect(() => {
    if (topicToEdit || !initialUnitType) return;
    setLearningUnit({ type: initialUnitType, data: defaultUnitData(initialUnitType) });
  }, [topicToEdit, initialUnitType]);

  useEffect(() => {
    if (!topicToEdit) return;

    setTopicForm({
      topicName: topicToEdit.name,
      topicDescription: String(topicToEdit.description ?? ""),
    });

    const rawUnit = topicToEdit.learningUnit ?? topicToEdit.LearningUnit ?? null;
    if (!rawUnit) {
      setLearningUnit(null);
      return;
    }

    const raw = (rawUnit.data ?? {}) as Record<string, unknown>;
    setRubricId(rawUnit.rubricId ?? null);

    if (rawUnit.type === "assignment") {
      const rawQuestions = (Array.isArray(raw.questions) ? raw.questions : []) as Array<
        Record<string, unknown>
      >;
      setLearningUnit({
        type: "assignment",
        data: {
          questions: rawQuestions.map((q) => ({
            id: (q.id as string) ?? createId(),
            type: (q.type as AssignmentQuestionType) ?? "MULTIPLE_CHOICE",
            question: (q.question as string) ?? "",
            points: Number(q.points) || 1,
            options: Array.isArray(q.options)
              ? (q.options as Array<Record<string, unknown>>).map((o) => ({
                  id: (o.id as string) ?? createId(),
                  text: (o.text as string) ?? "",
                }))
              : [],
            correctOptionId: (q.correctOptionId as string) ?? null,
          })),
          maxAttempts: Number(raw.maxAttempts ?? raw.maxAttempt) || 2,
          passMark: Number(raw.passMark) || 50,
          weight: String(raw.weight ?? ""),
        },
      });
      return;
    }

    if (rawUnit.type === "assignment-essay") {
      setLearningUnit({
        type: "assignment-essay",
        data: {
          question: String(raw.question ?? ""),
          maxAttempts: Number(raw.maxAttempts ?? raw.maxAttempt) || 2,
          passMark: Number(raw.passMark) || 50,
          weight: String(raw.weight ?? ""),
        },
      });
      return;
    }

    if (rawUnit.type === "lesson-note") {
      setLearningUnit({ type: "lesson-note", data: { content: String(raw.content ?? "") } });
      return;
    }

    if (rawUnit.type === "video") {
      setLearningUnit({ type: "video", data: { url: String(raw.url ?? raw.value ?? "") } });
      return;
    }

    if (rawUnit.type === "live") {
      setLearningUnit({
        type: "live",
        data: {
          meetingLink: String(raw.meetingLink ?? raw.value ?? ""),
          startsAt: String(raw.startsAt ?? ""),
          takeAttendance: raw.takeAttendance ?? true,
        },
      });
      return;
    }

    if (rawUnit.type === "in-person") {
      setLearningUnit({
        type: "in-person",
        data: { venue: String(raw.venue ?? raw.value ?? ""), startsAt: String(raw.startsAt ?? "") },
      });
      return;
    }

    if (rawUnit.type === "pdf" || rawUnit.type === "ppt") {
      setLearningUnit({
        type: rawUnit.type,
        data: { link: String(raw.link ?? ""), fileName: raw.fileName },
      });
      return;
    }

    setLearningUnit({ type: rawUnit.type, data: raw });
  }, [topicToEdit]);

  const assignmentData =
    learningUnit?.type === "assignment" ? (learningUnit.data as unknown as AssignmentData) : null;
  const essayData =
    learningUnit?.type === "assignment-essay" ? (learningUnit.data as unknown as EssayData) : null;

  /** Switch unit type, preserving data when the type is unchanged. */
  const pickType = (type: LearningUnitType) =>
    setLearningUnit((prev) => (prev?.type === type ? prev : { type, data: defaultUnitData(type) }));

  const setData = (patch: Record<string, unknown>) =>
    setLearningUnit((prev) => (prev ? { ...prev, data: { ...prev.data, ...patch } } : prev));

  const setAssignmentData = (next: AssignmentData) =>
    setLearningUnit((prev) =>
      prev && prev.type === "assignment" ? { ...prev, data: next as unknown as Record<string, unknown> } : prev
    );

  const setQuestions = (questions: AssignmentQuestion[]) => {
    if (!assignmentData) return;
    setAssignmentData({ ...assignmentData, questions });
  };

  const patchQuestion = (index: number, patch: Partial<AssignmentQuestion>) => {
    if (!assignmentData) return;
    setQuestions(assignmentData.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  };

  /** Re-shape a question when its type changes, keeping prompt + points. */
  const changeQuestionType = (index: number, type: AssignmentQuestionType) => {
    if (!assignmentData) return;
    const current = assignmentData.questions[index];
    let next: AssignmentQuestion;
    if (type === "TRUE_FALSE") {
      next = {
        ...current,
        type,
        options: [
          { id: "true", text: "True" },
          { id: "false", text: "False" },
        ],
        correctOptionId: current.correctOptionId === "false" ? "false" : "true",
      };
    } else if (type === "SHORT_ANSWER" || type === "ESSAY") {
      next = { ...current, type, options: [], correctOptionId: null };
    } else {
      const options =
        current.options.length >= 2 && current.type === "MULTIPLE_CHOICE"
          ? current.options
          : [blankOption(), blankOption(), blankOption(), blankOption()];
      const correctOptionId = options.some((o) => o.id === current.correctOptionId)
        ? current.correctOptionId
        : null;
      next = { ...current, type, options, correctOptionId };
    }
    patchQuestion(index, next);
  };

  const validateAssignment = () => {
    if (!assignmentData) return true;

    if (assignmentData.maxAttempts < 1 || assignmentData.passMark < 0 || assignmentData.passMark > 100) {
      showNotification("Please provide valid attempts and pass mark values.", "error");
      return false;
    }

    if (!assignmentData.questions.length) {
      showNotification("A quiz must have at least one question.", "error");
      return false;
    }

    for (let i = 0; i < assignmentData.questions.length; i += 1) {
      const q = assignmentData.questions[i];
      if (!q.question.trim()) {
        showNotification(`Question ${i + 1} needs prompt text.`, "error");
        return false;
      }
      if (q.type === "MULTIPLE_CHOICE") {
        const filled = q.options.filter((o) => o.text.trim());
        if (filled.length < 2) {
          showNotification(`Question ${i + 1} must have at least two options.`, "error");
          return false;
        }
        const correct = q.options.find((o) => o.id === q.correctOptionId);
        if (!correct || !correct.text.trim()) {
          showNotification(`Question ${i + 1} needs a correct answer selected.`, "error");
          return false;
        }
      }
      if (q.type === "TRUE_FALSE" && !q.correctOptionId) {
        showNotification(`Question ${i + 1} needs a correct answer selected.`, "error");
        return false;
      }
    }

    return true;
  };

  const validateTopicDetails = () => {
    if (!topicForm.topicName.trim()) {
      showNotification("Title is required.", "error");
      return false;
    }
    return true;
  };

  const validateLearningUnit = () => {
    if (!learningUnit) {
      showNotification("Please select a unit type.", "error");
      return false;
    }
    const data = learningUnit.data as Record<string, unknown>;

    if (learningUnit.type === "video" && !String(data.url ?? "").trim()) {
      showNotification("Video link is required.", "error");
      return false;
    }
    if (learningUnit.type === "live" && !String(data.meetingLink ?? "").trim()) {
      showNotification("Meeting link is required.", "error");
      return false;
    }
    if (learningUnit.type === "in-person" && !String(data.venue ?? "").trim()) {
      showNotification("Location is required.", "error");
      return false;
    }
    if (["ppt", "pdf"].includes(learningUnit.type) && !String(data.link ?? "").trim()) {
      showNotification("Please upload a file.", "error");
      return false;
    }
    if (learningUnit.type === "lesson-note" && !String(data.content ?? "").trim()) {
      showNotification("Lesson content is required.", "error");
      return false;
    }
    if (learningUnit.type === "assignment-essay" && !String(data.question ?? "").trim()) {
      showNotification("Please provide the essay prompt.", "error");
      return false;
    }
    return validateAssignment();
  };

  const handleUnitFile = async (file: File, type: "pdf" | "ppt") => {
    setUploading(true);
    try {
      const link = await uploadImageFile(file, { allowedMimeTypes: FILE_UPLOAD[type].mimes });
      setData({ link, fileName: file.name });
    } catch (error) {
      showNotification(error instanceof Error ? error.message : "File upload failed.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const handleDrop = (index: number) => {
    if (!assignmentData) return;
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === index) return;
    const questions = [...assignmentData.questions];
    const [moved] = questions.splice(fromIndex, 1);
    questions.splice(index, 0, moved);
    setQuestions(questions);
    dragIndexRef.current = null;
  };

  const handleClose = () => {
    setTopicForm({ topicName: "", topicDescription: "" });
    onClose?.();
  };

  /** Build the persisted learning-unit payload from form state. */
  const buildPayloadUnit = () => {
    if (!learningUnit) return null;
    const data = learningUnit.data as Record<string, unknown>;

    if (learningUnit.type === "assignment" && assignmentData) {
      return {
        type: "assignment" as const,
        maxAttempts: assignmentData.maxAttempts,
        data: {
          questions: assignmentData.questions.map((q) => ({
            id: q.id,
            type: q.type,
            question: q.question.trim(),
            points: Math.max(1, Number(q.points) || 1),
            // Open questions carry no options; choice questions drop blanks.
            options: isOpenQuestion(q.type)
              ? []
              : q.options.filter((o) => o.text.trim() || o.id === "true" || o.id === "false"),
            correctOptionId: q.correctOptionId,
          })),
          maxAttempts: assignmentData.maxAttempts,
          passMark: assignmentData.passMark,
          weight: assignmentData.weight,
        },
      };
    }

    if (learningUnit.type === "assignment-essay" && essayData) {
      return {
        type: "assignment-essay" as const,
        maxAttempts: essayData.maxAttempts,
        data: {
          question: essayData.question,
          maxAttempts: essayData.maxAttempts,
          passMark: essayData.passMark,
          weight: essayData.weight,
        },
      };
    }

    return { type: learningUnit.type, data };
  };

  const persistTopic = async (payload: Topic): Promise<{ ok: boolean; topicId?: number }> => {
    const tracker = createLmsActionTracker(topicToEdit ? "admin.topic.update" : "admin.topic.create", {
      topicId: topicToEdit?.id,
      programId: payload.programId,
    });
    setSaving(true);
    try {
      const response = topicToEdit
        ? await apiPut.updateTopic(payload, { id: String(topicToEdit.id) })
        : await apiPost.createTopic(payload);

      const success = (response as { success?: boolean })?.success;
      if (success === false) {
        tracker.failure({ message: "API returned unsuccessful response." });
        showNotification("Unable to save unit. Please try again.", "error");
        return { ok: false };
      }

      tracker.success();
      showNotification(topicToEdit ? "Unit updated successfully." : "Unit created successfully.", "success");
      const createdId = (response as { data?: { id?: number } })?.data?.id;
      return { ok: true, topicId: topicToEdit ? Number(topicToEdit.id) : createdId };
    } catch (error) {
      tracker.failure({ error });
      showNotification("Unable to save unit. Please try again.", "error");
      return { ok: false };
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateTopicDetails()) return;
    if (!validateLearningUnit()) return;

    if (!programId) {
      showNotification("Program identifier is missing. Refresh and try again.", "error");
      return;
    }

    const unit = buildPayloadUnit();
    if (!unit) return;

    const payload: Topic = {
      id: topicToEdit ? topicToEdit.id : 0,
      name: topicForm.topicName.trim(),
      description: topicForm.topicDescription,
      programId: Number(programId),
      type: unit.type,
      learningUnit: unit as Topic["learningUnit"],
      // New units are created inside the module the adder belongs to.
      ...(!topicToEdit && moduleId != null ? { moduleId } : {}),
    };

    const { ok, topicId } = await persistTopic(payload);
    if (!ok) return;

    // Essay rubric lives on the unit itself (separate endpoint).
    if (unit.type === "assignment-essay" && topicId) {
      await apiPut.setUnitRubric({ topicId, rubricId }).catch(() => undefined);
    }

    refetchProgram?.();
    handleClose();
  };

  const data = (learningUnit?.data ?? {}) as Record<string, unknown>;

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 border-b bg-white p-6">
        <h2 className="text-2xl font-semibold text-primary">
          {topicToEdit ? "Edit unit" : "Add unit"}
        </h2>
        <p className="text-sm text-primaryGray">
          {topicToEdit
            ? "Update the unit title and content below."
            : "Pick a unit type, then give it a title and content."}
        </p>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Unit type</p>
          <div className="flex flex-wrap gap-1.5">
            {LEARNING_UNIT_TYPES.map((item) => {
              const active = learningUnit?.type === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => pickType(item.value)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "border-primary bg-primary text-white"
                      : "border-lightGray bg-white text-primary hover:bg-lightGray/20"
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {moduleLabel && (
          <p className="text-sm text-primaryGray">
            Module: <span className="font-semibold text-primary">{moduleLabel}</span>
          </p>
        )}

        {learningUnit && isAssessmentType(learningUnit.type) && (
          <p className="rounded-lg border border-lightGray bg-lightGray/10 px-3 py-2.5 text-sm text-primaryGray">
            Saving also lists this under the program&apos;s{" "}
            <span className="font-semibold text-primary">Assessments</span>. Set its due date and
            publishing from the curriculum board.
          </p>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-primary">
            Title <span className="text-red-500">Required</span>
          </label>
          <input
            className={field}
            value={topicForm.topicName}
            onChange={(event) => setTopicForm((old) => ({ ...old, topicName: event.target.value }))}
            placeholder="e.g. The gifts of the Spirit"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-primary">Description</label>
          <TextEditor
            value={topicForm.topicDescription}
            onChange={(value) => setTopicForm((old) => ({ ...old, topicDescription: value }))}
            placeholder="Enter a short description"
          />
        </div>

        {learningUnit && (
          <div className="space-y-3">
            {learningUnit.type === "video" && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-primary">Video</label>
                <input
                  className={field}
                  placeholder="Paste a YouTube or Vimeo link"
                  value={String(data.url ?? "")}
                  onChange={(event) => setData({ url: event.target.value })}
                />
              </div>
            )}

            {learningUnit.type === "live" && (
              <div className="space-y-3">
                <div className="grid gap-3 tablet:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-primary">Date &amp; time</label>
                    <input
                      type="datetime-local"
                      className={field}
                      value={String(data.startsAt ?? "")}
                      onChange={(event) => setData({ startsAt: event.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-primary">Meeting link</label>
                    <input
                      className={field}
                      placeholder="Zoom, Meet or YouTube Live"
                      value={String(data.meetingLink ?? "")}
                      onChange={(event) => setData({ meetingLink: event.target.value })}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-primary">
                  <input
                    type="checkbox"
                    checked={Boolean(data.takeAttendance)}
                    onChange={(event) => setData({ takeAttendance: event.target.checked })}
                  />
                  Take attendance for this session
                </label>
              </div>
            )}

            {learningUnit.type === "in-person" && (
              <div className="grid gap-3 tablet:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-primary">Date &amp; time</label>
                  <input
                    type="datetime-local"
                    className={field}
                    value={String(data.startsAt ?? "")}
                    onChange={(event) => setData({ startsAt: event.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-primary">Location</label>
                  <input
                    className={field}
                    placeholder="Room 2, Hill City"
                    value={String(data.venue ?? "")}
                    onChange={(event) => setData({ venue: event.target.value })}
                  />
                </div>
              </div>
            )}

            {(learningUnit.type === "pdf" || learningUnit.type === "ppt") && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-primary">File</label>
                <div
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const file = event.dataTransfer.files?.[0];
                    if (file) handleUnitFile(file, learningUnit.type as "pdf" | "ppt");
                  }}
                  className="rounded-xl border-2 border-dashed border-lightGray p-6 text-center text-sm text-primaryGray"
                >
                  {uploading ? (
                    <p>Uploading…</p>
                  ) : data.link ? (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <a
                        href={String(data.link)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-primary underline"
                      >
                        {String(data.fileName ?? "View file")}
                      </a>
                      <button
                        type="button"
                        className="text-xs text-red-700 underline"
                        onClick={() => setData({ link: "", fileName: undefined })}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      Drop a {FILE_UPLOAD[learningUnit.type as "pdf" | "ppt"].label} file here, or{" "}
                      <label className="cursor-pointer font-semibold text-primary underline">
                        browse your computer
                        <input
                          type="file"
                          className="hidden"
                          accept={FILE_UPLOAD[learningUnit.type as "pdf" | "ppt"].accept}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) handleUnitFile(file, learningUnit.type as "pdf" | "ppt");
                            event.target.value = "";
                          }}
                        />
                      </label>
                    </>
                  )}
                </div>
              </div>
            )}

            {learningUnit.type === "lesson-note" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Lesson content</label>
                <TextEditor
                  value={String(data.content ?? "")}
                  onChange={(value) => setData({ content: value })}
                  placeholder="Write the lesson"
                />
              </div>
            )}

            {learningUnit.type === "assignment-essay" && essayData && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Prompt</label>
                  <TextEditor
                    value={essayData.question}
                    onChange={(value) => setData({ question: value })}
                    placeholder="Describe the assignment task. Learners will upload their answers."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-primary">Rubric</label>
                  <select
                    className={field}
                    value={rubricId ?? ""}
                    onChange={(event) => setRubricId(event.target.value ? Number(event.target.value) : null)}
                  >
                    <option value="">No rubric · score out of 100</option>
                    {rubrics.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {learningUnit.type === "assignment" && assignmentData && (
              <div className="space-y-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-primary">Questions</p>
                  <span className="text-xs text-primaryGray">
                    {assignmentData.questions.length} ready ·{" "}
                    {assignmentData.questions.reduce((n, q) => n + (Number(q.points) || 1), 0)} points
                  </span>
                </div>

                {assignmentData.questions.map((question, questionIndex) => (
                  <div
                    key={question.id}
                    draggable
                    onDragStart={() => handleDragStart(questionIndex)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(questionIndex)}
                    className="space-y-3 rounded-xl border border-lightGray bg-white p-3.5"
                  >
                    <div className="flex items-end gap-2.5">
                      <span className="flex size-7 flex-none cursor-move items-center justify-center rounded-lg bg-lightGray/40 text-sm font-bold text-primary">
                        {questionIndex + 1}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <label className="text-xs font-medium text-primaryGray">Type</label>
                        <select
                          className="h-9 w-full rounded-lg border border-lightGray bg-inputBackground px-2.5 text-sm text-primary"
                          value={question.type}
                          onChange={(event) =>
                            changeQuestionType(questionIndex, event.target.value as AssignmentQuestionType)
                          }
                        >
                          {QUESTION_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-20 flex-none space-y-1">
                        <label className="text-xs font-medium text-primaryGray">Points</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          className="h-9 w-full rounded-lg border border-lightGray bg-inputBackground px-2.5 text-sm text-primary"
                          value={question.points}
                          onChange={(event) =>
                            patchQuestion(questionIndex, { points: Number(event.target.value) })
                          }
                        />
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove question ${questionIndex + 1}`}
                        className="flex size-9 flex-none items-center justify-center rounded-lg border border-lightGray text-lg leading-none text-primaryGray hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                        onClick={() =>
                          setQuestions(assignmentData.questions.filter((_, k) => k !== questionIndex))
                        }
                      >
                        ×
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-primaryGray">Question</label>
                      <textarea
                        rows={2}
                        className={cn(field, "resize-y")}
                        placeholder="Type the question learners will see"
                        value={question.question}
                        onChange={(event) => patchQuestion(questionIndex, { question: event.target.value })}
                      />
                    </div>

                    {question.type === "MULTIPLE_CHOICE" && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-primaryGray">
                          Options · select the correct one
                        </p>
                        <div className="grid gap-x-3 gap-y-1.5 sm:grid-cols-2">
                          {question.options.map((option, optionIndex) => (
                            <div key={option.id} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${question.id}`}
                                aria-label={`Mark option ${optionIndex + 1} correct`}
                                checked={question.correctOptionId === option.id}
                                onChange={() => patchQuestion(questionIndex, { correctOptionId: option.id })}
                              />
                              <input
                                className="min-h-9 flex-1 rounded-md border border-lightGray bg-inputBackground px-2.5 py-1.5 text-sm text-primary"
                                placeholder={`Option ${"ABCD"[optionIndex] ?? optionIndex + 1}`}
                                value={option.text}
                                onChange={(event) => {
                                  const options = question.options.map((o, k) =>
                                    k === optionIndex ? { ...o, text: event.target.value } : o
                                  );
                                  patchQuestion(questionIndex, { options });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {question.type === "TRUE_FALSE" && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-primaryGray">Correct answer</p>
                        <div className="flex gap-4">
                          {[
                            { id: "true", label: "True" },
                            { id: "false", label: "False" },
                          ].map((o) => (
                            <label key={o.id} className="flex items-center gap-2 text-sm text-primary">
                              <input
                                type="radio"
                                name={`correct-${question.id}`}
                                checked={question.correctOptionId === o.id}
                                onChange={() => patchQuestion(questionIndex, { correctOptionId: o.id })}
                              />
                              {o.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {isOpenQuestion(question.type) && (
                      <p className="text-xs text-primaryGray">
                        Learners type their answer. It goes to the grading queue for the instructor.
                      </p>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className="h-9 self-start rounded-lg border border-dashed border-primary px-3.5 text-sm font-semibold text-primary hover:bg-lightGray/20"
                  onClick={() => {
                    const last = assignmentData.questions[assignmentData.questions.length - 1];
                    setQuestions([...assignmentData.questions, newQuestion(last?.type)]);
                  }}
                >
                  + Add question
                </button>
              </div>
            )}

            {learningUnit.type === "assignment" && assignmentData && (
              <div className="grid gap-3 tablet:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-primary">Weight</label>
                  <input
                    className={field}
                    placeholder="e.g. 10%"
                    value={assignmentData.weight}
                    onChange={(event) => setData({ weight: event.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-primary">Attempts</label>
                  <input
                    type="number"
                    min={1}
                    className={field}
                    value={assignmentData.maxAttempts}
                    onChange={(event) => setData({ maxAttempts: Number(event.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-primary">Pass mark (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className={field}
                    value={assignmentData.passMark}
                    onChange={(event) => setData({ passMark: Number(event.target.value) })}
                  />
                </div>
              </div>
            )}

            {learningUnit.type === "assignment-essay" && essayData && (
              <div className="grid gap-3 tablet:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-primary">Weight</label>
                  <input
                    className={field}
                    placeholder="e.g. 20%"
                    value={essayData.weight}
                    onChange={(event) => setData({ weight: event.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-primary">Attempts</label>
                  <input
                    type="number"
                    min={1}
                    className={field}
                    value={essayData.maxAttempts}
                    onChange={(event) => setData({ maxAttempts: Number(event.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-primary">Pass mark (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className={field}
                    value={essayData.passMark}
                    onChange={(event) => setData({ passMark: Number(event.target.value) })}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-10 flex justify-end gap-2 border-t bg-white p-4">
        <button
          type="button"
          className="rounded-md border border-lightGray px-4 py-2 text-sm hover:bg-lightGray/20"
          onClick={handleClose}
        >
          Cancel
        </button>
        <button
          type="button"
          className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleSubmit}
          disabled={saving || uploading}
        >
          {saving ? "Saving..." : topicToEdit ? "Save changes" : "Add unit"}
        </button>
      </div>
    </div>
  );
};

export default TopicBasicInfoForm;
