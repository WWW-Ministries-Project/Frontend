import { Button } from "@/components";

interface TopicDetailsProps {
  topicName: string;
  topicDetails: string;
  canEdit?: boolean;
    handleEdit?: () => void;
}

const TopicDetails = ({ topicName, topicDetails, handleEdit, canEdit }: TopicDetailsProps) => {
    return ( 
        <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h2 className="font-bold" style={{ margin: 0 }}>{topicName}</h2>
                  {canEdit&&<div>
                    <Button variant="secondary" value="Edit" onClick={handleEdit} />
                    
                  </div>}
                </div>
        
                <div style={{ color: '#6b6b75', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{topicDetails}</div>
              </div>
     );
}
 
export default TopicDetails;