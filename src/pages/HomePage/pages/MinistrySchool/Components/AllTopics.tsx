import { DragEvent, useEffect, useRef, useState } from "react";
import ellipse from "@/assets/ellipse.svg";
import { Button } from "@/components";
import { useRouteAccess } from "@/context/RouteAccessContext";
import { Modal } from "@/components/Modal";
import TopicBasicInfoForm from "./TopicBasicInfoForm";
import { api } from "@/utils/api/apiCalls";
import { useDelete } from "@/CustomHooks/useDelete";
import DOMPurify from "dompurify";
import { Badge } from "@/components/Badge";
import { showNotification } from "@/pages/HomePage/utils";

interface ITopic {
  id: string | number;
  programId?: number;
  name: string;
  description?: string | TrustedHTML | null | undefined;
  order?: number;
  order_number?: number;
  learningUnit?: { type?: string } | string;
  LearningUnit?: { type?: string } | string;
  type?: string;
}

interface IProps {
  topics: ITopic[];
  programId?: number;
  refetchProgram?: () => void;
 
}

const sortTopicsByOrder = (items: ITopic[]) =>
  [...items].sort(
    (a, b) =>
      (a.order_number ?? a.order ?? Number.MAX_SAFE_INTEGER) -
      (b.order_number ?? b.order ?? Number.MAX_SAFE_INTEGER)
  );

const reorderTopics = (
  items: ITopic[],
  draggedTopicId: string | number,
  targetTopicId: string | number,
  position: "above" | "below"
) => {
  const next = [...items];
  const fromIndex = next.findIndex((item) => String(item.id) === String(draggedTopicId));
  const targetIndex = next.findIndex((item) => String(item.id) === String(targetTopicId));

  if (fromIndex < 0 || targetIndex < 0 || fromIndex === targetIndex) return items;

  const [moved] = next.splice(fromIndex, 1);
  let insertIndex = targetIndex;

  if (position === "below") insertIndex += 1;
  if (fromIndex < insertIndex) insertIndex -= 1;

  next.splice(insertIndex, 0, moved);
  return next;
};

const AllTopics = ({ topics, programId, refetchProgram }: IProps) => {
  const { canManageCurrentRoute } = useRouteAccess();
  const [isMenuOpen, setIsMenuOpen] = useState<string | number | null>(null);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [TopicToEdit, setTopicToEdit] = useState<ITopic | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [orderedTopics, setOrderedTopics] = useState<ITopic[]>([]);
  const [draggingTopicId, setDraggingTopicId] = useState<string | number | null>(null);
  const [dragOverTopic, setDragOverTopic] = useState<{
    id: string | number;
    position: "above" | "below";
  } | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  const { executeDelete: deleteTopic, loading: deleteLoading } = useDelete(api.delete.deleteTopic);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<ITopic | null>(null);

  const toggleMenu = (topicId: string | number) => {
    setIsMenuOpen(isMenuOpen === topicId ? null : topicId);
  };

  const handleEdit = (topic: ITopic) => {
    setTopicToEdit(topic);
    setIsTopicModalOpen(true);
    setIsMenuOpen(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsMenuOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setOrderedTopics(sortTopicsByOrder(topics));
  }, [topics]);

  const persistTopicOrder = async (nextTopics: ITopic[], previousTopics: ITopic[]) => {
    const resolvedProgramId = programId ?? nextTopics[0]?.programId;
    if (!resolvedProgramId) {
      showNotification("Program ID is missing. Unable to save topic order.", "error");
      setOrderedTopics(previousTopics);
      return;
    }

    const orderedPayload = nextTopics.map((topic, index) => ({
      id: Number(topic.id),
      order_number: index + 1,
    }));

    if (orderedPayload.some((item) => Number.isNaN(item.id))) {
      showNotification("Invalid topic ID found. Unable to save topic order.", "error");
      setOrderedTopics(previousTopics);
      return;
    }

    setIsReordering(true);

    try {
      await api.put.reorderProgramTopics({
        programId: resolvedProgramId,
        topics: orderedPayload,
      });
      refetchProgram?.();
      showNotification("Topic order updated.", "success");
    } catch {
      setOrderedTopics(previousTopics);
      showNotification("Could not save topic order. Please try again.", "error");
    } finally {
      setIsReordering(false);
    }
  };

  const handleTopicDragStart = (
    event: DragEvent<HTMLDivElement>,
    topicId: string | number
  ) => {
    if (isReordering) return;
    setDraggingTopicId(topicId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(topicId));
  };

  const handleTopicDragOver = (
    event: DragEvent<HTMLDivElement>,
    topicId: string | number
  ) => {
    if (draggingTopicId === null || isReordering) return;
    event.preventDefault();

    const rect = event.currentTarget.getBoundingClientRect();
    const position = event.clientY - rect.top < rect.height / 2 ? "above" : "below";

    setDragOverTopic((current) => {
      if (current?.id === topicId && current.position === position) return current;
      return { id: topicId, position };
    });
  };

  const handleTopicDrop = (
    event: DragEvent<HTMLDivElement>,
    targetTopicId: string | number
  ) => {
    event.preventDefault();
    if (draggingTopicId === null || isReordering) return;

    const dropPosition =
      dragOverTopic?.id === targetTopicId ? dragOverTopic.position : "below";
    const previousTopics = orderedTopics;
    const nextTopics = reorderTopics(
      orderedTopics,
      draggingTopicId,
      targetTopicId,
      dropPosition
    );

    setDraggingTopicId(null);
    setDragOverTopic(null);
    if (nextTopics === orderedTopics) return;

    setOrderedTopics(nextTopics);
    void persistTopicOrder(nextTopics, previousTopics);
  };

  const handleTopicDragEnd = () => {
    setDraggingTopicId(null);
    setDragOverTopic(null);
  };

  return (
    <div className="" ref={rootRef}>
      <div className="space-y-4 ">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold mb-2">Topics</h2>
          <Button
            value="Create New Topic"
            onClick={() => setIsTopicModalOpen(true)}
            disabled={!canManageCurrentRoute}
          />
        </div>
        <p className="text-sm text-primaryGray">
          Drag and drop topics to reorder them.
        </p>

        {/* Created Topics */}
        <div className="grid grid-cols-1 gap-4">
          {orderedTopics.map((topic) => {
            const topicLearningUnit = topic?.learningUnit ?? topic?.LearningUnit;
            const isDragOverTop =
              dragOverTopic?.id === topic.id && dragOverTopic.position === "above";
            const isDragOverBottom =
              dragOverTopic?.id === topic.id && dragOverTopic.position === "below";

            return (
              <div
                key={topic?.id}
                draggable={!isReordering}
                onDragStart={(event) => handleTopicDragStart(event, topic.id)}
                onDragOver={(event) => handleTopicDragOver(event, topic.id)}
                onDrop={(event) => handleTopicDrop(event, topic.id)}
                onDragEnd={handleTopicDragEnd}
                className={`relative border rounded-lg p-4 flex justify-between items-center transition-colors ${
                  draggingTopicId === topic.id ? "opacity-60" : ""
                } ${
                  isReordering ? "cursor-wait" : "cursor-grab"
                }`}
              >
                {isDragOverTop && (
                  <div className="absolute left-3 right-3 top-0 h-0.5 bg-primary" />
                )}
                {isDragOverBottom && (
                  <div className="absolute left-3 right-3 bottom-0 h-0.5 bg-primary" />
                )}
                <div>
                  <div className="flex gap-4 items-center">
                    <span
                      className="select-none text-primaryGray"
                      aria-label={`Drag ${topic.name}`}
                      title="Drag to reorder"
                    >
                      ::
                    </span>
                    <div className="font-medium">
                      {topic?.name}
                    </div>
                    {(topicLearningUnit || topic?.type) && (
                      <Badge>
                        {typeof topicLearningUnit === "string"
                          ? topicLearningUnit
                          : topicLearningUnit?.type || topic?.type}
                      </Badge>
                    )}
                  </div>
                  <div className="gap-x-4 flex text-sm text-primaryGray">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(String(topic?.description ?? "")),
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    {canManageCurrentRoute && (
                      <button
                        className="text-primary"
                        onClick={() => toggleMenu(topic?.id)}
                        disabled={isReordering}
                      >
                        <img
                          src={ellipse}
                          alt="options"
                          className="cursor-pointer"
                        />
                      </button>
                    )}
                    {canManageCurrentRoute && isMenuOpen === topic?.id && (
                      <div
                        className="absolute right-0 bottom-0 mt-2 w-48 bg-white border border-lightGray rounded-lg shadow-lg"
                      >
                        <ul className="py-1">
                          <li
                            className="px-4 py-2 hover:bg-lightGray cursor-pointer"
                            onClick={() => handleEdit(topic)}
                          >
                            Edit topic
                          </li>

                          <hr className="text-lightGray" />
                          <li
                            onClick={() => {
                              setTopicToDelete(topic);
                              setIsDeleteModalOpen(true);
                              setIsMenuOpen(null);
                            }}
                            className="px-4 py-2 cursor-pointer text-red-600 hover:bg-red-50"
                          >
                            Delete topic
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Topic creation */}
      <Modal open={isTopicModalOpen} onClose={() => setIsTopicModalOpen(false)} className="w-[80vw] h-full">
        <TopicBasicInfoForm
          onClose={() => setIsTopicModalOpen(false)}
          topicToEdit={
            TopicToEdit
              ? {
                  id: TopicToEdit.id,
                  name: TopicToEdit.name,
                  description: String(TopicToEdit.description ?? ""),
                  learningUnit:
                    typeof (TopicToEdit.learningUnit ?? TopicToEdit.LearningUnit) === "string"
                      ? null
                      : (((TopicToEdit.learningUnit ?? TopicToEdit.LearningUnit) as unknown) as {
                          type: "video" | "live" | "in-person" | "ppt" | "pdf" | "lesson-note" | "assignment" | "assignment-essay";
                          data: unknown;
                        }) || null,
                  type: TopicToEdit.type as
                    | "video"
                    | "live"
                    | "in-person"
                    | "ppt"
                    | "pdf"
                    | "lesson-note"
                    | "assignment"
                    | "assignment-essay"
                    | undefined,
                }
              : null
          }
          refetchProgram={refetchProgram}
        />
      </Modal>
      {/* Delete confirmation */}
      <Modal
        open={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTopicToDelete(null);
        }}
        className="w-[400px]"
      >
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Delete Topic</h3>
          <p className="text-sm text-primaryGray">
            Are you sure you want to delete{" "}
            <span className="font-medium">
              {topicToDelete?.name}
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              value="Cancel"
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setTopicToDelete(null);
              }}
            />
            <Button
              value={deleteLoading ? "Deleting..." : "Delete"}
              variant="primary"
              disabled={deleteLoading}
              onClick={async () => {
                if (!topicToDelete) return;

                const id = topicToDelete.id;
                await deleteTopic({ id });
                showNotification("Topic deleted successfully.", "success");
                setIsDeleteModalOpen(false);
                setTopicToDelete(null);
                refetchProgram?.();
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
 
export default AllTopics;
