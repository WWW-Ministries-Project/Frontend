import type {
  MessageChannels,
  MessagePreview,
} from "@/utils/api/messaging/interfaces";

interface MessagePreviewPanelProps {
  preview: MessagePreview | null;
  channels: MessageChannels;
}

/** How the message reads for a sample person ("Ama Mensah"). */
export const MessagePreviewPanel = ({
  preview,
  channels,
}: MessagePreviewPanelProps) => {
  if (!preview) {
    return (
      <p className="text-sm text-gray-500">Type a message to see a preview.</p>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">
        Preview for a sample member
      </p>
      {(channels.sms || channels.inApp) && (
        <div className="max-w-sm whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-lightGray px-4 py-3 text-sm">
          {preview.body}
        </div>
      )}
      {channels.email && (
        <div className="rounded-lg border border-lightGray">
          <div className="border-b border-lightGray px-4 py-2 text-sm font-medium">
            {preview.subject || "(no subject)"}
          </div>
          <div className="whitespace-pre-wrap px-4 py-3 text-sm">
            {preview.body}
          </div>
        </div>
      )}
    </div>
  );
};
