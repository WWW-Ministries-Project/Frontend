import React from 'react';

import { mockText, materials, assignments, dummyTopics } from '@/pages/HomePage/utils/dummydata';
import { Button } from '@/components';
import TopicDetails from './TopicDetails';
import TopicBasicInfoForm from './TopicBasicInfoForm';
import { FileCard } from './FileCard';
import { dummyLearningUnits } from '@/pages/HomePage/utils/dummyLearningUnits';
import LearningUnit from './LearningUnit';





const ViewTopic: React.FC = () => {
  const [edit, setEdit] = React.useState(false);
  const handleRemoveItem = (id: number, type: 'material' | 'assignment') => {
    // Implement the logic to remove the item based on its id and type
    console.log(`Remove ${type} with id: ${id}`);
  }
  const handleEdit = () => {
    setEdit(true);
  }
  return (
    <div  className='flex flex-col 2xl:flex-row gap-8 p-6 text-gray-700'>

      {/* Left content area */}
      <div className="flex-1">
        {!edit?<TopicDetails topicName={dummyTopics} topicDetails={mockText} handleEdit={handleEdit} canEdit/>:
        <TopicBasicInfoForm />}

        {/* <div className="space-y-4">
      {dummyLearningUnits
        .sort((a, b) => a.order - b.order)
        .map((unit) => (
          <LearningUnit key={unit.id} unit={unit} />
        ))}
    </div> */}

      </div>

      {/* Vertical divider and right sidebar */}
      <div className='border-t 2xl:border-t-0 2xl:border-l border-gray-200'/>
      <div className="2xl:w-80  ">
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="m-0 font-semibold text-gray-800">Materials</h3>
            <Button value="Upload" />
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-1 gap-3">
            {materials.map((m) => (
              <FileCard key={m.id} name={m.name} size={m.size} />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="m-0 font-semibold text-gray-800">Assignment</h3>
            <Button value="Upload" />
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-1 gap-3">
            {assignments.map((a) => (
              <FileCard key={a.id} name={a.name} size={a.size} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ViewTopic;