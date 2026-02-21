import React, { useCallback, useState } from "react";
import { Button } from "@/components/Button";
import TopicBasicInfoForm from "./TopicBasicInfoForm";
import { FileCard } from "./FileCard";
import NewStepper from "./NewStepper";

export type TopicStep = "info" | "material" | "assignment" | "confirmation";

export interface TopicFileItem {
  id: number;
  name: string;
  sizeLabel?: string;
  source: "file" | "url";
}

export interface TopicFormState {
  topicName: string;
  topicDescription: string;
  materialName: string;
  materialFiles: TopicFileItem[];
  assignmentName: string;
  assignmentItems: TopicFileItem[];
}

export type TopicFormPayload = TopicFormState;

interface TopicFormProps {
  open: boolean;
  onClose: () => void;
  /**
   * Called when the user finishes the wizard (Save and exit).
   * You can persist the data in the parent.
   */
  onSubmit?: (payload: TopicFormPayload) => void;
}

const topicSteps: { id: TopicStep; label: string }[] = [
  { id: "info", label: "Topic Info" },
  { id: "material", label: "Course material" },
  { id: "assignment", label: "Assignment" },
  { id: "confirmation", label: "Confirmation" },
];

export const TopicForm: React.FC<TopicFormProps> = ({ open: _open, onClose, onSubmit }) => {
  const [topicStep, setTopicStep] = useState<TopicStep>("info");
  const [topicForm, setTopicForm] = useState<TopicFormState>({
    topicName: "",
    topicDescription: "",
    materialName: "",
    materialFiles: [],
    assignmentName: "",
    assignmentItems: [],
  });
  const [materialUrlInput, setMaterialUrlInput] = useState("");
  const [assignmentUrlInput, setAssignmentUrlInput] = useState("");
  const [_fileIdCounter, setFileIdCounter] = useState(0);

  const resetTopicForm = useCallback(() => {
    setTopicForm({
      topicName: "",
      topicDescription: "",
      materialName: "",
      materialFiles: [],
      assignmentName: "",
      assignmentItems: [],
    });
    setMaterialUrlInput("");
    setAssignmentUrlInput("");
    setTopicStep("info");
  }, []);

  const handleClose = () => {
    resetTopicForm();
    onClose();
  };

  const goToStep = (step: TopicStep) => {
    setTopicStep(step);
  };

  const goToNextStep = () => {
    const currentIndex = topicSteps.findIndex((s) => s.id === topicStep);
    if (currentIndex < topicSteps.length - 1) {
      setTopicStep(topicSteps[currentIndex + 1].id);
    }
  };

  const goToPrevStep = () => {
    const currentIndex = topicSteps.findIndex((s) => s.id === topicStep);
    if (currentIndex > 0) {
      setTopicStep(topicSteps[currentIndex - 1].id);
    }
  };

  const registerFiles = (
    files: FileList | null,
    target: "material" | "assignment"
  ) => {
    if (!files || files.length === 0) return;
    setFileIdCounter((prev) => {
      let nextId = prev;
      const items: TopicFileItem[] = [];
      Array.from(files).forEach((file) => {
        nextId += 1;
        items.push({
          id: nextId,
          name: file.name,
          sizeLabel: `${(file.size / (1024 * 1024)).toFixed(1)} mb`,
          source: "file",
        });
      });
      setTopicForm((old) => ({
        ...old,
        materialFiles:
          target === "material" ? [...old.materialFiles, ...items] : old.materialFiles,
        assignmentItems:
          target === "assignment" ? [...old.assignmentItems, ...items] : old.assignmentItems,
      }));
      return nextId;
    });
  };

  const addUrlItem = (target: "material" | "assignment") => {
    const url = target === "material" ? materialUrlInput.trim() : assignmentUrlInput.trim();
    if (!url) return;
    setFileIdCounter((prev) => {
      const id = prev + 1;
      const item: TopicFileItem = {
        id,
        name: url,
        source: "url",
      };
      setTopicForm((old) => ({
        ...old,
        materialFiles:
          target === "material" ? [...old.materialFiles, item] : old.materialFiles,
        assignmentItems:
          target === "assignment" ? [...old.assignmentItems, item] : old.assignmentItems,
      }));
      return id;
    });
    if (target === "material") {
      setMaterialUrlInput("");
    } else {
      setAssignmentUrlInput("");
    }
  };

  const removeItem = (target: "material" | "assignment", id: number) => {
    setTopicForm((old) => ({
      ...old,
      materialFiles:
        target === "material" ? old.materialFiles.filter((f) => f.id !== id) : old.materialFiles,
      assignmentItems:
        target === "assignment" ? old.assignmentItems.filter((f) => f.id !== id) : old.assignmentItems,
    }));
  };

  const handleSubmit = () => {
    const payload: TopicFormPayload = {
      ...topicForm,
    };

    if (onSubmit) {
      onSubmit(payload);
    }
    handleClose();
  };

  return (
    <div className="flex h-[90vh] w-[90vw] flex-col gap-4 rounded-lg p-4 md:flex-row md:gap-0 md:p-6">
      <div className="w-full md:w-auto md:shrink-0">
        <NewStepper
          title="Topic creation"
          steps={topicSteps}
          activeStep={topicStep}
          onStepChange={goToStep}
          className="md:max-w-xs"
        />
      </div>

      {/* Main content */}
      <div className="flex min-h-0 flex-1 flex-col rounded-lg bg-white shadow-sm md:ml-6">
          {/* Header */}
          <div className="flex items-center justify-between py-4 border-b border-lightGray">
            <div className="font-semibold ">
              {topicStep === "info" && "Topic Information"}
              {topicStep === "material" && "Course material"}
              {topicStep === "assignment" && "Assignment"}
              {topicStep === "confirmation" && "Confirmation"}
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close topic form"
              className="text-primaryGray hover:text-primaryGray text-xl leading-none"
            >
              &times;
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto  py-4 space-y-4 text-sm ">
            {topicStep === "info" && (
              <div className="space-y-4">
                <TopicBasicInfoForm creation={true} />
              </div>
            )}

            {topicStep === "material" && (
              <div>
                <div className="rounded-md border border-dashed border-lightGray p-4 text-sm text-primaryGray">
                  Add learning unit resources in this step.
                </div>
              </div>
            )}

            {topicStep === "assignment" && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-primaryGray">
                    Name <span className="text-red-500">Required</span>
                  </label>
                  <input
                    className="w-full rounded-md border border-lightGray px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    value={topicForm.assignmentName}
                    onChange={(e) =>
                      setTopicForm((old) => ({ ...old, assignmentName: e.target.value }))
                    }
                    placeholder="Enter assignment name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-primaryGray">File</label>
                  <label className="flex flex-col items-center justify-center rounded-md border border-dashed border-lightGray px-4 py-6 text-xs text-primaryGray cursor-pointer">
                    <span>Click to upload or drag and drop</span>
                    <span className="mt-1 text-xxs text-primaryGray">
                      image, document or video (5mb max)
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mov,.avi,.mkv,.png,.jpg,.jpeg"
                      onChange={(e) => registerFiles(e.target.files, "assignment")}
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  <div className="text-center text-xxs text-primaryGray">or</div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-primaryGray">Link</label>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 rounded-md border border-lightGray px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Paste assignment URL"
                        value={assignmentUrlInput}
                        onChange={(e) => setAssignmentUrlInput(e.target.value)}
                      />
                      <Button
                        value="Add file"
                        variant="secondary"
                        onClick={() => addUrlItem("assignment")}
                      />
                    </div>
                  </div>
                </div>

                {topicForm.assignmentItems.length > 0 && (
                  <div className="space-y-2">
                    {topicForm.assignmentItems.map((item) => (
                      
                      <FileCard key={item.id} name={item.name} size={item.sizeLabel || ""} removeItem={() => removeItem("assignment", item.id)} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {topicStep === "confirmation" && (
              <div className="space-y-4 text-sm">
                <p className="text-primaryGray">
                  Review the information below before creating the topic.
                </p>
                <div className="space-y-2">
                  <div>
                    <div className="text-xs font-medium text-primaryGray">Topic name</div>
                    <div className="text-sm text-primary">{topicForm.topicName || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-primaryGray">Description</div>
                    <div 
                        className="text-sm text-primary prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ 
                            __html: topicForm.topicDescription || "—" 
                        }}
                        />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-primaryGray">Course materials</div>
                    <div className="text-sm text-primary">
                      {topicForm.materialFiles.length === 0
                        ? "No materials added"
                        : `${topicForm.materialFiles.length} item(s)`}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-primaryGray">Assignments</div>
                    <div className="text-sm text-primary">
                      {topicForm.assignmentItems.length === 0
                        ? "No assignments added"
                        : `${topicForm.assignmentItems.length} item(s)`}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-lightGray text-xs">
            <button
              type="button"
              onClick={goToPrevStep}
              disabled={topicStep === "info"}
              className={`flex items-center gap-1 text-primaryGray ${
                topicStep === "info" ? "opacity-40 cursor-default" : "hover:text-primaryGray"
              }`}
            >
              <span>← Prev</span>
            </button>

            <div className="flex items-center gap-3">
              {topicStep === "confirmation" ? (
                <Button value="Save and exit" onClick={handleSubmit} />
              ) : (
                <Button
                  value="Continue"
                  onClick={() => {
                    goToNextStep();
                  }}
                />
              )}
            </div>
          </div>
      </div>
    </div>
  );
};

export default TopicForm;
