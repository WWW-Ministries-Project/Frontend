import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Update the path below to the actual location of your ellipse image file
import ellipse from "@/assets/ellipse.svg";

interface ITopic {
  id: string;
  name: string;
  materials?: number;
  assignments?: number;
}

interface IProps {
  topics: ITopic[];
  onEdit: (topic: ITopic) => void;
  onDelete: (topicId: string) => void;
}

const AllTopics = ({topics, onEdit, onDelete}: IProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const toggleMenu = (topicId: string) => {
    setIsMenuOpen(isMenuOpen === topicId ? null : topicId);
  };

  const handleEdit = (topic: ITopic) => {
    onEdit(topic);
    setIsMenuOpen(null);
  };

  return ( 
    <div className="w-2/6">
      <div className="space-y-4 ">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold mb-2">Topics</h2>
        </div>

        {/* Created Topics */}
        <div className='space-y-2'>
          {topics.map((topic) => (
            <div key={topic.id} className="border rounded-lg p-4 flex justify-between items-center ">
              <div>
                <div className="font-medium">
                  {topic.name}
                </div>
                <div className="gap-x-4 flex text-sm text-gray-600">
                  <div>{topic.materials} materials</div>
                  <div>{topic.assignments} assignments</div>
                </div>
              </div>
              <div>
                <div className="relative">
                  <button
                    ref={buttonRef}
                    className="text-primary"
                    onClick={() => toggleMenu(topic.id)}
                  >
                    <img
                      src={ellipse}
                      alt="options"
                      className="cursor-pointer"
                    />
                  </button>
                  {isMenuOpen === topic.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 bottom-0 mt-2 w-48 bg-white border border-lightGray rounded-lg shadow-lg"
                    >
                      <ul className="py-1">
                        <li
                          className="px-4 py-2 hover:bg-lightGray cursor-pointer"
                          onClick={() => navigate(`topic/${topic.id}`)}
                        >
                          Manage topic
                        </li>
                        {/* <li
                          className="px-4 py-2 hover:bg-lightGray cursor-pointer"
                          onClick={() => handleEdit(topic)}
                        >
                          Edit topic
                        </li> */}

                        <hr className="text-lightGray" />
                        <li
                          onClick={() => onDelete(topic.id)}
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
    </div>
  );
}
 
export default AllTopics;