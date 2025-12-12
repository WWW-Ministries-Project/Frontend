import { useState } from 'react';
import Editor from "@/components/Editor";

interface TopicForm {
  topicName: string;
  topicDescription: string;
}

const TopicBasicInfoForm = () => {
    const [topicForm, setTopicForm] = useState<TopicForm>({
      topicName: '',
      topicDescription: '',
    });

    return ( 
        <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Name <span className="text-red-500">Required</span>
                  </label>
                  <input
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    value={topicForm.topicName}
                    onChange={(e) =>
                      setTopicForm((old) => ({ ...old, topicName: e.target.value }))
                    }
                    placeholder="Enter topic name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Description</label>
                  <Editor
                    value={topicForm.topicDescription}
                    onChange={(data) =>
                      setTopicForm((old) => ({
                        ...old,
                        topicDescription: data,
                      }))
                    }
                  />
                </div>
              </div>
     );
}
 
export default TopicBasicInfoForm;