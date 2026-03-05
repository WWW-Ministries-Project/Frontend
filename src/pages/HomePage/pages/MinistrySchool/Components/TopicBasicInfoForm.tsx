import TextEditor from "@/components/TextEditor";
import { ProgressStepper } from "@/components/ui";
import { showNotification } from "@/pages/HomePage/utils";
import { LearningUnitType, Topic } from "@/utils";
import { ApiCreationCalls } from "@/utils/api/apiPost";
import { ApiUpdateCalls } from "@/utils/api/apiPut";
import { useMemo, useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { createLmsActionTracker, isLmsFeatureEnabled } from "../utils/lmsGuardrails";

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
  question: string;
  options: AssignmentOption[];
  correctOptionId: string | null;
}

interface AssignmentData {
  questions: AssignmentQuestion[];
  maxAttempts: number;
  passMark: number;
}

interface TopicLearningUnit {
  type: LearningUnitType;
  data:
    | AssignmentData
    | { content: string }
    | { value: string }
    | { link: string }
    | { question: string }
    | Record<string, unknown>;
}

type EditableTopic = {
  id: string | number;
  name: string;
  description?: string | TrustedHTML | null | undefined;
  learningUnit?: TopicLearningUnit | null;
  LearningUnit?: TopicLearningUnit | null;
  type?: LearningUnitType;
};

interface TopicBasicInfoFormProps {
  creation?: boolean;
  onClose?: () => void;
  topicToEdit?: EditableTopic | null;
  refetchProgram?: () => void;
}

const LEARNING_UNIT_TYPES: { label: string; value: LearningUnitType }[] = [
  { label: "Playback Video", value: "video" },
  { label: "Live Session", value: "live" },
  { label: "In-Person Session", value: "in-person" },
  { label: "PowerPoint (PPT)", value: "ppt" },
  { label: "PDF Document", value: "pdf" },
  { label: "Assignment (MCQ)", value: "assignment" },
  { label: "Lesson Note", value: "lesson-note" },
  { label: "Assignment (Essay)", value: "assignment-essay" },
];

type TopicStep = "details" | "learning-unit" | "publish";

const TOPIC_STEPS: { id: TopicStep; label: string; description: string }[] = [
  {
    id: "details",
    label: "Topic Details",
    description: "Name and description",
  },
  {
    id: "learning-unit",
    label: "Learning Unit",
    description: "Configure content format",
  },
  {
    id: "publish",
    label: "Publish",
    description: "Review and save",
  },
];

const createId = () => crypto.randomUUID();

const TopicBasicInfoForm = ({ onClose, topicToEdit, refetchProgram }: TopicBasicInfoFormProps) => {
  const { id: programId } = useParams();
  const apiPost = useMemo(() => new ApiCreationCalls(), []);
  const apiPut = useMemo(() => new ApiUpdateCalls(), []);
  const dragIndexRef = useRef<number | null>(null);

  const [topicForm, setTopicForm] = useState<TopicForm>({
    topicName: "",
    topicDescription: "",
  });
  const [learningUnit, setLearningUnit] = useState<TopicLearningUnit | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState<TopicStep>("details");
  const guidedFlowEnabled = isLmsFeatureEnabled("guided_forms");

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

    if (rawUnit.type === "assignment") {
      const assignmentPayload = rawUnit.data as Partial<AssignmentData>;
      setLearningUnit({
        type: "assignment",
        data: {
          questions: assignmentPayload.questions ?? [],
          maxAttempts: assignmentPayload.maxAttempts ?? 2,
          passMark: assignmentPayload.passMark ?? 50,
        },
      });
      return;
    }

    if (rawUnit.type === "lesson-note") {
      setLearningUnit({
        type: "lesson-note",
        data: {
          content: String((rawUnit.data as { content?: string })?.content ?? ""),
        },
      });
      return;
    }

    setLearningUnit({
      type: rawUnit.type,
      data: rawUnit.data ?? {},
    });
  }, [topicToEdit]);

  const isAssignmentUnit =
    learningUnit?.type === "assignment" ? (learningUnit.data as AssignmentData) : null;

  const setAssignmentData = (nextData: AssignmentData) => {
    if (!learningUnit || learningUnit.type !== "assignment") return;
    setLearningUnit({
      ...learningUnit,
      data: nextData,
    });
  };

  const validateAssignment = () => {
    if (!isAssignmentUnit) return true;

    if (isAssignmentUnit.maxAttempts < 1 || isAssignmentUnit.passMark < 0 || isAssignmentUnit.passMark > 100) {
      showNotification("Please provide valid max attempts and pass mark values.", "error");
      return false;
    }

    if (!isAssignmentUnit.questions.length) {
      showNotification("Assignment must have at least one question.", "error");
      return false;
    }

    for (let i = 0; i < isAssignmentUnit.questions.length; i += 1) {
      const question = isAssignmentUnit.questions[i];
      if (question.options.length < 2) {
        showNotification(`Question ${i + 1} must have at least two options.`, "error");
        return false;
      }
      if (!question.correctOptionId) {
        showNotification(`Question ${i + 1} must have one correct answer.`, "error");
        return false;
      }
    }

    return true;
  };

  const validateTopicDetails = () => {
    if (!topicForm.topicName.trim()) {
      showNotification("Topic name is required.", "error");
      return false;
    }
    return true;
  };

  const validateLearningUnit = () => {
    if (!learningUnit) {
      showNotification("Please select a learning unit type.", "error");
      return false;
    }

    if (["video", "live", "in-person"].includes(learningUnit.type)) {
      const value = String((learningUnit.data as { value?: string }).value ?? "").trim();
      if (!value) {
        showNotification("Learning unit link or location is required.", "error");
        return false;
      }
    }

    if (["ppt", "pdf"].includes(learningUnit.type)) {
      const value = String((learningUnit.data as { link?: string }).link ?? "").trim();
      if (!value) {
        showNotification("Please provide the document link.", "error");
        return false;
      }
    }

    if (learningUnit.type === "lesson-note") {
      const content = String((learningUnit.data as { content?: string }).content ?? "").trim();
      if (!content) {
        showNotification("Lesson note content is required.", "error");
        return false;
      }
    }

    if (learningUnit.type === "assignment-essay") {
      const question = String((learningUnit.data as { question?: string }).question ?? "").trim();
      if (!question) {
        showNotification("Please provide assignment instructions.", "error");
        return false;
      }
    }

    return validateAssignment();
  };

  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const handleDrop = (index: number) => {
    if (!isAssignmentUnit) return;
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === index) return;

    const questions = [...isAssignmentUnit.questions];
    const [moved] = questions.splice(fromIndex, 1);
    questions.splice(index, 0, moved);
    setAssignmentData({
      ...isAssignmentUnit,
      questions,
    });
    dragIndexRef.current = null;
  };

  const handleClose = () => {
    setTopicForm({
      topicName: "",
      topicDescription: "",
    });
    onClose?.();
  };

  const activeIndex = TOPIC_STEPS.findIndex((step) => step.id === activeStep);

  const moveToNextStep = () => {
    if (!guidedFlowEnabled) return;
    if (activeStep === "details" && !validateTopicDetails()) return;
    if (activeStep === "learning-unit" && !validateLearningUnit()) return;

    const next = TOPIC_STEPS[activeIndex + 1];
    if (next) setActiveStep(next.id);
  };

  const moveToPreviousStep = () => {
    if (!guidedFlowEnabled) return;
    const previous = TOPIC_STEPS[activeIndex - 1];
    if (previous) setActiveStep(previous.id);
  };

  const persistTopic = async (payload: Topic) => {
    const tracker = createLmsActionTracker(
      topicToEdit ? "admin.topic.update" : "admin.topic.create",
      {
        topicId: topicToEdit?.id,
        programId: payload.programId,
      }
    );
    setSaving(true);
    try {
      const response = topicToEdit
        ? await apiPut.updateTopic(payload, { id: String(topicToEdit.id) })
        : await apiPost.createTopic(payload);

      const success = (response as { success?: boolean })?.success;
      if (success === false) {
        tracker.failure({ message: "API returned unsuccessful response." });
        showNotification("Unable to save topic. Please try again.", "error");
        return false;
      }

      tracker.success();
      showNotification(topicToEdit ? "Topic updated successfully." : "Topic created successfully.", "success");
      return true;
    } catch (error) {
      tracker.failure({ error });
      showNotification("Unable to save topic. Please try again.", "error");
      return false;
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

    const payload: Topic = {
      id: topicToEdit ? topicToEdit.id : 0,
      name: topicForm.topicName.trim(),
      description: topicForm.topicDescription,
      programId: Number(programId),
      type: learningUnit.type,
      learningUnit: learningUnit as Topic["learningUnit"],
    };

    const success = await persistTopic(payload);
    if (!success) return;

    refetchProgram?.();
    handleClose();
  };

  const selectedLearningUnitLabel = learningUnit
    ? LEARNING_UNIT_TYPES.find((item) => item.value === learningUnit.type)?.label ??
      learningUnit.type
    : "Not selected";

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 border-b bg-white p-6">
        <h2 className="text-2xl font-semibold text-primary">
          {topicToEdit ? "Edit Topic" : "Create New Topic"}
        </h2>
        <p className="text-sm text-primaryGray">
          {topicToEdit
            ? "Update the topic information and learning unit below."
            : "Provide the topic details and select a learning unit."}
        </p>
      </div>

      {guidedFlowEnabled && (
        <div className="px-6 pt-4">
          <ProgressStepper
            steps={TOPIC_STEPS}
            activeStep={activeStep}
            onStepChange={(step) => {
              const targetIndex = TOPIC_STEPS.findIndex((item) => item.id === step);
              if (targetIndex <= activeIndex) {
                setActiveStep(step);
              }
            }}
          />
        </div>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {(!guidedFlowEnabled || activeStep === "details") && (
          <>
            <div className="space-y-1">
              <label className="text-sm font-medium text-primary">
                Name <span className="text-red-500">Required</span>
              </label>
              <input
                className="w-full rounded-md border border-lightGray px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                value={topicForm.topicName}
                onChange={(event) =>
                  setTopicForm((old) => ({
                    ...old,
                    topicName: event.target.value,
                  }))
                }
                placeholder="Enter topic name"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-primary">Description</label>
              <TextEditor
                value={topicForm.topicDescription}
                onChange={(value) =>
                  setTopicForm((old) => ({
                    ...old,
                    topicDescription: value,
                  }))
                }
                placeholder="Enter topic description"
              />
            </div>
          </>
        )}

        {(!guidedFlowEnabled || activeStep === "learning-unit") && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-primary">Learning Unit</h3>
              <button
                type="button"
                className="text-xs text-primary underline"
                onClick={() => setLearningUnit(null)}
              >
                Change learning unit type
              </button>
            </div>

            {!learningUnit && (
              <select
                className="w-full rounded-md border border-lightGray px-3 py-2 text-sm"
                onChange={(event) =>
                  setLearningUnit({
                    type: event.target.value as LearningUnitType,
                    data:
                      event.target.value === "assignment"
                        ? { questions: [], maxAttempts: 2, passMark: 50 }
                        : event.target.value === "lesson-note"
                        ? { content: "" }
                        : event.target.value === "assignment-essay"
                        ? { question: "" }
                        : {},
                  })
                }
              >
                <option value="">Select learning unit type</option>
                {LEARNING_UNIT_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            )}

            {learningUnit && (
              <div className="space-y-3">
                {["video", "live", "in-person"].includes(learningUnit.type) && (
                  <input
                    className="w-full rounded-md border border-lightGray px-3 py-2 text-sm"
                    placeholder={
                      learningUnit.type === "video"
                        ? "Video URL"
                        : learningUnit.type === "live"
                        ? "Meeting link"
                        : "Location / Venue"
                    }
                    value={String((learningUnit.data as { value?: string }).value ?? "")}
                    onChange={(event) =>
                      setLearningUnit({
                        ...learningUnit,
                        data: { value: event.target.value },
                      })
                    }
                  />
                )}

                {["ppt", "pdf"].includes(learningUnit.type) && (
                  <input
                    className="w-full rounded-md border border-lightGray px-3 py-2 text-sm"
                    placeholder="External file link"
                    value={String((learningUnit.data as { link?: string }).link ?? "")}
                    onChange={(event) =>
                      setLearningUnit({
                        ...learningUnit,
                        data: { link: event.target.value },
                      })
                    }
                  />
                )}

                {learningUnit.type === "lesson-note" && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-primaryGray">Lesson Content</label>
                    <TextEditor
                      value={String((learningUnit.data as { content?: string }).content ?? "")}
                      onChange={(value) =>
                        setLearningUnit({
                          ...learningUnit,
                          data: { content: value },
                        })
                      }
                      placeholder="Write the lesson note here..."
                    />
                  </div>
                )}

                {learningUnit.type === "assignment-essay" && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-primaryGray">
                      Assignment Question / Instructions
                    </label>
                    <TextEditor
                      value={String((learningUnit.data as { question?: string }).question ?? "")}
                      onChange={(value) =>
                        setLearningUnit({
                          ...learningUnit,
                          data: { question: value },
                        })
                      }
                      placeholder="Describe the assignment task. Students will upload their answers."
                    />
                    <p className="text-xs text-primaryGray">
                      Students will submit their answers by uploading a document.
                    </p>
                  </div>
                )}

                {learningUnit.type === "assignment" && isAssignmentUnit && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-primaryGray">
                          Max Attempts
                        </label>
                        <input
                          type="number"
                          min={1}
                          className="w-full rounded-md border border-lightGray px-3 py-2 text-sm"
                          value={isAssignmentUnit.maxAttempts}
                          onChange={(event) =>
                            setAssignmentData({
                              ...isAssignmentUnit,
                              maxAttempts: Number(event.target.value),
                            })
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-primaryGray">Pass Mark (%)</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="w-full rounded-md border border-lightGray px-3 py-2 text-sm"
                          value={isAssignmentUnit.passMark}
                          onChange={(event) =>
                            setAssignmentData({
                              ...isAssignmentUnit,
                              passMark: Number(event.target.value),
                            })
                          }
                        />
                      </div>
                    </div>

                    {isAssignmentUnit.questions.map((question, questionIndex) => (
                      <div
                        key={question.id}
                        draggable
                        onDragStart={() => handleDragStart(questionIndex)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => handleDrop(questionIndex)}
                        className="cursor-move space-y-2 rounded-md border bg-white p-3"
                      >
                        <input
                          className="w-full rounded-md border border-lightGray px-2 py-1 text-sm"
                          placeholder={`Question ${questionIndex + 1}`}
                          value={question.question}
                          onChange={(event) => {
                            const questions = [...isAssignmentUnit.questions];
                            questions[questionIndex].question = event.target.value;
                            setAssignmentData({ ...isAssignmentUnit, questions });
                          }}
                        />

                        {question.options.map((option, optionIndex) => (
                          <div key={option.id} className="flex items-center gap-2">
                            <input
                              type="radio"
                              checked={question.correctOptionId === option.id}
                              onChange={() => {
                                const questions = [...isAssignmentUnit.questions];
                                questions[questionIndex].correctOptionId = option.id;
                                setAssignmentData({ ...isAssignmentUnit, questions });
                              }}
                            />
                            <input
                              className="flex-1 rounded-md border border-lightGray px-2 py-1 text-sm"
                              placeholder={`Option ${optionIndex + 1}`}
                              value={option.text}
                              onChange={(event) => {
                                const questions = [...isAssignmentUnit.questions];
                                questions[questionIndex].options[optionIndex].text = event.target.value;
                                setAssignmentData({ ...isAssignmentUnit, questions });
                              }}
                            />
                          </div>
                        ))}

                        <button
                          type="button"
                          className="text-xs text-primary underline"
                          onClick={() => {
                            const questions = [...isAssignmentUnit.questions];
                            questions[questionIndex].options.push({
                              id: createId(),
                              text: "",
                            });
                            setAssignmentData({ ...isAssignmentUnit, questions });
                          }}
                        >
                          Add option
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      className="text-sm text-primary underline"
                      onClick={() => {
                        const questions = [
                          ...isAssignmentUnit.questions,
                          {
                            id: createId(),
                            question: "",
                            correctOptionId: null,
                            options: [
                              { id: createId(), text: "" },
                              { id: createId(), text: "" },
                            ],
                          },
                        ];
                        setAssignmentData({ ...isAssignmentUnit, questions });
                      }}
                    >
                      Add question
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {guidedFlowEnabled && activeStep === "publish" && (
          <div className="space-y-4 rounded-lg border border-lightGray p-4">
            <h3 className="text-base font-semibold text-primary">Review and Publish</h3>
            <div className="grid gap-4 text-sm md:grid-cols-2">
              <div>
                <p className="text-primaryGray">Topic Name</p>
                <p className="font-medium text-primary">{topicForm.topicName || "-"}</p>
              </div>
              <div>
                <p className="text-primaryGray">Learning Unit</p>
                <p className="font-medium text-primary">{selectedLearningUnitLabel}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-primaryGray">Description</p>
                <p className="font-medium text-primary">
                  {topicForm.topicDescription || "No description provided"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-10 flex justify-between gap-2 border-t bg-white p-4">
        <button
          type="button"
          className="rounded-md border border-lightGray px-4 py-2 text-sm hover:bg-lightGray/20"
          onClick={handleClose}
        >
          Cancel
        </button>
        <div className="flex items-center gap-2">
          {guidedFlowEnabled && activeIndex > 0 && (
            <button
              type="button"
              className="rounded-md border border-lightGray px-4 py-2 text-sm hover:bg-lightGray/20"
              onClick={moveToPreviousStep}
            >
              Back
            </button>
          )}
          {guidedFlowEnabled ? (
            activeIndex < TOPIC_STEPS.length - 1 ? (
              <button
                type="button"
                className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:opacity-90"
                onClick={moveToNextStep}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Topic"}
              </button>
            )
          ) : (
            <button
              type="button"
              className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopicBasicInfoForm;
