import React from 'react';

import { mockText, materials, assignments, dummyTopics } from '@/pages/HomePage/utils/dummydata';
import { Button } from '@/components';
import TopicDetails from './TopicDetails';
import TopicBasicInfoForm from './TopicBasicInfoForm';
import { FileCard } from './FileCard';





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
    <div style={{
      display: 'flex',
      gap: 32,
      padding: 32,
      fontFamily: "Inter, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
      color: '#2b2b39'
    }}>

      {/* Left content area */}
      <div className=''>
        {!edit?<TopicDetails topicName={dummyTopics} topicDetails={mockText} handleEdit={handleEdit} canEdit/>:
        <TopicBasicInfoForm />}

      </div>

      {/* Vertical divider and right sidebar */}
      <div style={{ width: 320, borderLeft: '1px solid #e6e6ea', paddingLeft: 24 }}>
        <section style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Materials</h3>
            <Button value="Upload" />
          </div>

          {materials.map(m => (
            <FileCard key={m.id} name={m.name} size={m.size} />
          ))}
        </section>

        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Assignment</h3>
            <Button value="Upload" />
          </div>

          {assignments.map(a => (
            <FileCard key={a.id} name={a.name} size={a.size} />
          ))}
        </section>
      </div>
    </div>
  );
};

export default ViewTopic;