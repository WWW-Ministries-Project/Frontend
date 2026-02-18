import { Button } from "@/components";

interface TopicDetailsProps {
  topicName: string;
  topicDetails: string;
  canEdit?: boolean;
  handleEdit?: () => void;
}

const TopicDetails = ({ topicName, topicDetails, handleEdit, canEdit }: TopicDetailsProps) => {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold text-primary">{topicName}</h2>
        {canEdit && (
          <div>
            <Button variant="secondary" value="Edit" onClick={handleEdit} />
          </div>
        )}
      </div>

      <div className="whitespace-pre-wrap leading-8 text-primaryGray">{topicDetails}</div>
    </div>
  );
};

export default TopicDetails;
