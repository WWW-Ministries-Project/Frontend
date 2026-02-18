import TextEditor from "@/components/TextEditor";
import { showNotification } from "@/pages/HomePage/utils";
import { LearningUnitType, Topic } from "@/utils";
import { ApiCreationCalls } from "@/utils/api/apiPost";
import { ApiUpdateCalls } from "@/utils/api/apiPut";
import { useMemo, useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";

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

  const persistTopic = async (payload: Topic) => {
    setSaving(true);
    try {
      const response = topicToEdit
        ? await apiPut.updateTopic(payload, { id: String(topicToEdit.id) })
        : await apiPost.createTopic(payload);

      const success = (response as { success?: boolean })?.success;
      if (success === false) {
        showNotification("Unable to save topic. Please try again.", "error");
        return false;
      }

      showNotification(topicToEdit ? "Topic updated successfully." : "Topic created successfully.", "success");
      return true;
    } catch {
      showNotification("Unable to save topic. Please try again.", "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateAssignment()) return;

    if (!learningUnit) {
      showNotification("Please select a learning unit type.", "error");
      return;
    }

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

      <div className="flex-1 space-y-4 overflow-y-auto p-6">
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

        <div className="space-y-2 border-t pt-4">
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
                      <label className="text-xs font-medium text-primaryGray">Max Attempts</label>
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
          disabled={saving || !topicForm.topicName.trim()}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
};

export default TopicBasicInfoForm;
