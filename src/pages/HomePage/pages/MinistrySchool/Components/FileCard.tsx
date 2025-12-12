export const FileCard: React.FC<{ name: string; size: string; removeItem?:void }> = ({ name, size, removeItem }) => (
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
    <button aria-label="remove" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9a9aa4' }} onClick={()=>removeItem}>✕</button>
  </div>
);
