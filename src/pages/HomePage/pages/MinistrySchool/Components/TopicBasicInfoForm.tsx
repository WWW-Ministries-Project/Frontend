import TextEditor from "@/components/TextEditor";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { api, LearningUnitType, Topic } from "@/utils";
import { useEffect, useState } from "react";
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

interface LearningUnit {
  type: LearningUnitType;
  data: any;
}

interface TopicBasicInfoFormProps {
  creation?: boolean;
  onClose?: () => void;
  topicToEdit?: {
    id: number;
    name: string;
    description: string;
    learningUnit: LearningUnit;
    type: LearningUnitType;
  } | null;
  refetchProgram?: () => void;
}





const TopicBasicInfoForm = ({ onClose, topicToEdit, refetchProgram }: TopicBasicInfoFormProps) => {
    const { id: programId } = useParams();

    console.log("topicToEdit",topicToEdit);
    

    const [topicForm, setTopicForm] = useState<TopicForm>({
      topicName: '',
      topicDescription: '',
    });
    // const [isEditing, setIsEditing] = useState<boolean>(true);

    const [learningUnit, setLearningUnit] = useState<LearningUnit | null>(null);

    const {postData: postTopic, loading: postLoading} = usePost<unknown, Topic>(api.post.createTopic);
    const {updateData: putTopic, loading: updateLoading} = usePut<unknown, Topic>(api.put.updateTopic);

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

    useEffect(() => {
  if (!topicToEdit) return;

  setTopicForm({
    topicName: topicToEdit.name,
    topicDescription: topicToEdit.description,
  });

  // Backend may send LearningUnit (capital L)
  const rawUnit: any =
    (topicToEdit as any).learningUnit ??
    (topicToEdit as any).LearningUnit ??
    null;

  if (!rawUnit) {
    setLearningUnit(null);
    return;
  }

  // Assignment (MCQ)
  if (rawUnit.type === "assignment") {
    setLearningUnit({
      type: rawUnit.type,
      data: {
        questions: rawUnit.data?.questions ?? [],
        maxAttempts:
          rawUnit.data?.maxAttempts ??
          rawUnit.maxAttempts ??
          2,
        passMark:
          rawUnit.data?.passMark ?? 50,
      },
    });
    return;
  }

  // Lesson note
  if (rawUnit.type === "lesson-note") {
    setLearningUnit({
      type: rawUnit.type,
      data: {
        content: rawUnit.data?.content ?? "",
      },
    });
    return;
  }

  // All other learning unit types
  setLearningUnit({
    type: rawUnit.type,
    data: rawUnit.data ?? {},
  });
}, [topicToEdit]);

    const validateAssignment = () => {
      if (!learningUnit || learningUnit.type !== "assignment") return true;
      if (
  learningUnit.data.maxAttempts < 1 ||
  learningUnit.data.passMark < 0 ||
  learningUnit.data.passMark > 100
) {
  alert("Please provide valid max attempts and pass mark values.");
  return false;
}

      const questions = learningUnit.data.questions as AssignmentQuestion[];

      if (!questions.length) {
        alert("Assignment must have at least one question.");
        return false;
      }

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (q.options.length < 2) {
          alert(`Question ${i + 1} must have at least two options.`);
          return false;
        }
        if (!q.correctOptionId) {
          alert(`Question ${i + 1} must have one correct answer.`);
          return false;
        }
      }

      return true;
    };

    const handleDragStart = (index: number) => {
      (window as any).dragIndex = index;
    };

    const handleDrop = (index: number) => {
      const fromIndex = (window as any).dragIndex;
      if (fromIndex === undefined || fromIndex === index) return;

      const questions = [...learningUnit!.data.questions];
      const [moved] = questions.splice(fromIndex, 1);
      questions.splice(index, 0, moved);

      setLearningUnit({
        ...learningUnit!,
        data: { questions },
      });

      (window as any).dragIndex = undefined;
    };

      const handleClose = () => {
    setTopicForm({
      topicName: '',
      topicDescription: '',
    });
    onClose?.();
  };

/**
 * Create a new Topic
 */
const createTopic = (payload: Topic) => {
  console.log("Creating topic with payload:", payload);
  postTopic(payload);
};

/**
 * Update an existing Topic
 */
const updateTopic = (payload: Topic, id: any) => {
  console.log("Updating topic with payload:", payload);
  putTopic(payload, {id: id});
};

const handleSubmit = () => {
  if (!validateAssignment()) return;

  if (!learningUnit) {
    alert("Please select a learning unit type.");
    return;
  }

  if (!programId) {
    console.error("Program ID is missing from route");
    return;
  }

  const payload: Topic = {
    id: topicToEdit ? topicToEdit.id : 0,
    name: topicForm.topicName,
    description: topicForm.topicDescription,
    programId: Number(programId),
    type: learningUnit.type,
    learningUnit,
  };

  if (topicToEdit) {
    updateTopic(payload, topicToEdit.id);
    onClose?.();
    console.log("Id of topic to edit", topicToEdit.id);
  } else {
    createTopic(payload);
    onClose?.();
  }
}

    return ( 
      <div className="flex h-full flex-col">
        <div className="sticky top-0 z-10 bg-white border-b p-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            {topicToEdit ? "Edit Topic" : "Create New Topic"}
          </h2>
          <p className="text-sm text-gray-600">
            {topicToEdit
              ? "Fill in the details below to edit the topic."
              : "View the details of the topic below."}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Name <span className="text-red-500">Required</span>
            </label>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={topicForm.topicName}
              onChange={(e) =>
                setTopicForm((old) => ({ ...old, topicName: e.target.value }))
              }
              placeholder="Enter topic name"
              // disabled={!topicToEdit}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <TextEditor
              value={topicForm.topicDescription}
              onChange={(value) =>
                setTopicForm((old) => ({
                  ...old,
                  topicDescription: value,
                }))
              }
              placeholder="Enter topic description"
              // readOnly={!topicToEdit}
            />
          </div>

          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Learning Unit</h3>
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
                className="w-full rounded-md border px-3 py-2 text-sm"
                onChange={(e) =>
                  setLearningUnit({
                    type: e.target.value as LearningUnitType,
                    data:
                      e.target.value === "assignment"
                        ? { questions: [], maxAttempts: 2, passMark: 50 }
                        : e.target.value === "lesson-note"
                        ? { content: "" }
                        : e.target.value === "assignment-essay"
                        ? { question: "" }
                        : {},
                  })
                }
              >
                <option value="">Select learning unit type</option>
                {LEARNING_UNIT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            )}

            {learningUnit && (
              <div className="space-y-3 ">

                {["video", "live", "in-person"].includes(learningUnit.type) && (
                  <input
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder={
                      learningUnit.type === "video"
                        ? "Video URL"
                        : learningUnit.type === "live"
                        ? "Meeting link"
                        : "Location / Venue"
                    }
                    value={learningUnit.data.value || ""}
                    onChange={(e) =>
                      setLearningUnit({
                        ...learningUnit,
                        data: { value: e.target.value },
                      })
                    }
                  />
                )}

                {["ppt", "pdf"].includes(learningUnit.type) && (
                  <input
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="External file link"
                    value={learningUnit.data.link || ""}
                    onChange={(e) =>
                      setLearningUnit({
                        ...learningUnit,
                        data: { link: e.target.value },
                      })
                    }
                  />
                )}

                {learningUnit.type === "lesson-note" && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600">
                      Lesson Content
                    </label>
                    <TextEditor
                      value={learningUnit.data.content}
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
                    <label className="text-xs font-medium text-gray-600">
                      Assignment Question / Instructions
                    </label>
                    <TextEditor
                      value={learningUnit.data.question}
                      onChange={(value) =>
                        setLearningUnit({
                          ...learningUnit,
                          data: { question: value },
                        })
                      }
                      placeholder="Describe the assignment task. Students will upload their answers."
                    />
                    <p className="text-xs text-gray-500">
                      Students will submit their answers by uploading a document.
                    </p>
                  </div>
                )}

                {learningUnit.type === "assignment" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
  <div className="space-y-1">
    <label className="text-xs font-medium text-gray-600">
      Max Attempts
    </label>
    <input
      type="number"
      min={1}
      className="w-full rounded-md border px-3 py-2 text-sm"
      value={learningUnit.data.maxAttempts ?? 2}
      onChange={(e) =>
        setLearningUnit({
          ...learningUnit,
          data: {
            ...learningUnit.data,
            maxAttempts: Number(e.target.value),
          },
        })
      }
    />
  </div>

  <div className="space-y-1">
    <label className="text-xs font-medium text-gray-600">
      Pass Mark (%)
    </label>
    <input
      type="number"
      min={0}
      max={100}
      className="w-full rounded-md border px-3 py-2 text-sm"
      value={learningUnit.data.passMark ?? 50}
      onChange={(e) =>
        setLearningUnit({
          ...learningUnit,
          data: {
            ...learningUnit.data,
            passMark: Number(e.target.value),
          },
        })
      }
    />
  </div>
</div>
                    {(learningUnit.data.questions as AssignmentQuestion[]).map((q, qIndex) => (
                      <div
                        key={q.id}
                        draggable
                        onDragStart={() => handleDragStart(qIndex)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(qIndex)}
                        className="space-y-2 rounded-md border p-3 cursor-move bg-white"
                      >
                        <input
                          className="w-full rounded-md border px-2 py-1 text-sm"
                          placeholder={`Question ${qIndex + 1}`}
                          value={q.question}
                          onChange={(e) => {
                            const questions = [...learningUnit.data.questions];
                            questions[qIndex].question = e.target.value;
                            setLearningUnit({ ...learningUnit, data: { questions } });
                          }}
                        />

                        {q.options.map((opt, optIndex) => (
                          <div key={opt.id} className="flex items-center gap-2">
                            <input
                              type="radio"
                              checked={q.correctOptionId === opt.id}
                              onChange={() => {
                                const questions = [...learningUnit.data.questions];
                                questions[qIndex].correctOptionId = opt.id;
                                setLearningUnit({ ...learningUnit, data: { questions } });
                              }}
                            />
                            <input
                              className="flex-1 rounded-md border px-2 py-1 text-sm"
                              placeholder={`Option ${optIndex + 1}`}
                              value={opt.text}
                              onChange={(e) => {
                                const questions = [...learningUnit.data.questions];
                                questions[qIndex].options[optIndex].text = e.target.value;
                                setLearningUnit({ ...learningUnit, data: { questions } });
                              }}
                            />
                          </div>
                        ))}

                        <button
                          type="button"
                          className="text-xs text-primary underline"
                          onClick={() => {
                            const questions = [...learningUnit.data.questions];
                            questions[qIndex].options.push({
                              id: createId(),
                              text: "",
                            });
                            setLearningUnit({ ...learningUnit, data: { questions } });
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
                          ...learningUnit.data.questions,
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
                        setLearningUnit({ ...learningUnit, data: { questions } });
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
        <div className="sticky bottom-0 z-10 bg-white border-t p-4 flex gap-2 justify-end">
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:opacity-90"
            onClick={
              () => {
                handleSubmit();
                refetchProgram?.();
          }}
          >
            Save
          </button>
          <button
            type="button"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            onClick={handleClose}
          >
            Cancel
          </button>
        </div>
      </div>
    );
}
 
export default TopicBasicInfoForm;