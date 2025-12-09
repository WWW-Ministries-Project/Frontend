import React from 'react';

import { mockText, materials, assignments } from '@/pages/HomePage/utils/dummydata';
import { Button } from '@/components';

const UploadButton: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
  <button onClick={onClick} style={{
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #2b2b39',
    background: 'white',
    cursor: 'pointer'
  }}>Upload</button>
);

const FileCard: React.FC<{ name: string; size: string }> = ({ name, size }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    border: '1px dashed #e1e1e6',
    borderRadius: 6,
    marginBottom: 12,
    background: '#fbfbfd'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3v10" stroke="#6b6b75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 7l4-4 4 4" stroke="#6b6b75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#6b6b75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div>
        <div style={{ fontWeight: 600 }}>{name}</div>
        <div style={{ fontSize: 12, color: '#8b8b95' }}>{size}</div>
      </div>
    </div>
    <button aria-label="remove" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9a9aa4' }}>✕</button>
  </div>
);

const ViewTopic: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      gap: 32,
      padding: 32,
      fontFamily: "Inter, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
      color: '#2b2b39'
    }}>

      {/* Left content area */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Global prayer place</h2>
          <div>
            <button style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #2b2b39',
              background: 'white',
              cursor: 'pointer'
            }}>Edit</button>
          </div>
        </div>

        <div style={{ color: '#6b6b75', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{mockText}</div>
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