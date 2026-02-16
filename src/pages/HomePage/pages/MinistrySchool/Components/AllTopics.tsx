import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Update the path below to the actual location of your ellipse image file
import ellipse from "@/assets/ellipse.svg";
import { Button } from '@/components';
import { Modal } from '@/components/Modal';
import TopicBasicInfoForm from './TopicBasicInfoForm';
import { api } from '@/utils/api/apiCalls';
import { useDelete } from '@/CustomHooks/useDelete';
import DOMPurify from "dompurify";
import { Badge } from '@/components/Badge';

interface ITopic {
  id: string | number;
  name: string;
  description?: string | TrustedHTML | null | undefined;
  learningUnit?: { type?: string } | string;
  type?: string;
}

interface IProps {
  topics: ITopic[];
  refetchProgram?: () => void;
 
}

const AllTopics = ({topics, refetchProgram}: IProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState<string | number | null>(null);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [TopicToEdit, setTopicToEdit] = useState<ITopic | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const{executeDelete: deleteTopic, loading: deleteLoading} = useDelete(api.delete.deleteTopic);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<ITopic | null>(null);

  const toggleMenu = (topicId: string | number) => {
    setIsMenuOpen(isMenuOpen === topicId ? null : topicId);
  };

  const handleEdit = (topic: ITopic) => {
    setTopicToEdit(topic);
    setIsTopicModalOpen(true);
    console.log("Topic to be edited", topic);
    
    setIsMenuOpen(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return ( 
    <div className="">
      <div className="space-y-4 ">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold mb-2">Topics</h2>
          <Button value="Create New Topic" onClick={() => setIsTopicModalOpen(true)} />
        </div>

        {/* Created Topics */}
        <div className='grid grid-cols-1  gap-4'>
          {topics.map((topic) => (
            <div key={topic?.id} className="border rounded-lg p-4 flex justify-between items-center ">
              <div>
                <div className='flex gap-4 items-center'>
                  <div className="font-medium">
                  {topic?.name}
                </div>
                {(topic?.learningUnit || topic?.type) && (
                  <Badge>
                    {typeof topic.learningUnit === "string"
                      ? topic.learningUnit
                      : topic.learningUnit?.type || topic?.type}
                  </Badge>
                )}
                </div>
                <div className="gap-x-4 flex text-sm text-gray-600">
                  <div 
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(String(topic?.description ?? "")),
                    }}
                  />
                  
                </div>
              </div>
              <div>
                <div className="relative">
                  <button
                    ref={buttonRef}
                    className="text-primary"
                    onClick={() => toggleMenu(topic?.id)}
                  >
                    <img
                      src={ellipse}
                      alt="options"
                      className="cursor-pointer"
                    />
                  </button>
                  {isMenuOpen === topic?.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 bottom-0 mt-2 w-48 bg-white border border-lightGray rounded-lg shadow-lg"
                    >
                      <ul className="py-1">
                        {/* <li
                          className="px-4 py-2 hover:bg-lightGray cursor-pointer"
                          onClick={() => navigate(`topic/${topic.id}`)}
                        >
                          Manage topic
                        </li> */}
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
          ))}
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
                    typeof TopicToEdit.learningUnit === "string"
                      ? null
                      : ((TopicToEdit.learningUnit as unknown) as {
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
          <p className="text-sm text-gray-600">
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

                // if (isNaN(id)) {
                //   console.error("Invalid topicId", topicToDelete.id);
                //   return;
                // }

                await deleteTopic({ id });
                console.log("Deleted topic", id);

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
