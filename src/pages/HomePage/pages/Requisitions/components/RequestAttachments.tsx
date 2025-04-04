import DeleteIcon from "@/assets/DeleteIcon";
import DownloadIcon from "@/assets/DownloadIcon";
import FileIcon from "@/assets/FileIcon";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import { handleDownload } from "@/pages/HomePage/utils";
import UploadButton from "@/components/UploadButton";
import LoaderIcon from "@/assets/LoaderIcon";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";
import { useImageUpload } from "@/pages/HomePage/utils/useImageUpload";
import { ActionType } from "../hooks/useRequisitionDetail";

function RequestAttachments({
  attachments,
  isEditable,
  addAttachement,
  removAttachment,
  isLoading,
  action,
  fileId,
}: Readonly<{
  attachments: { URL: string; id: number }[];
  isEditable: boolean;
  addAttachement: (attachment: string) => void;
  removAttachment: (id: number) => void;
  isLoading: boolean;
  action: ActionType;
  fileId: string;
}>) {


  const { handleUpload,addingImage } = useImageUpload();

  // Handle file change
  const onFileChange = async (file: File | null) => {
    if (file) {
      const formData = new FormData();
      formData.append(`file`, file);
      const res = await handleUpload(formData);
      if (res?.URL) {
        addAttachement(res.URL);
      }
    }
  };

  // Render attachment item
  const renderAttachmentItem = (attachment: { URL: string; id: number }, idx: number) => (
    <div key={attachment.URL}>
      <div className="border p-2 rounded-lg flex gap-3">
        <FileIcon />
        <div className="flex gap-2 flex-col">
          <div className="text-sm text-dark900">
            {attachment.URL?.split("/").pop()}
          </div>
          <div className="flex items-center gap-2">
            <DownloadIcon onClick={() => handleDownload(attachment.URL)} />
            <DeleteIcon
              fill="#D92D20"
              onClick={() => removAttachment(attachment.id)}
            />
            {action === "removeAttachment" && isLoading && Number(fileId) === attachment.id && (
              <LoaderIcon />
            )}
          </div>
        </div>
      </div>
      {idx !== attachments.length - 1 && <HorizontalLine />}
    </div>
  );

  return (
    <div className="border rounded-lg p-3 border-[#D9D9D9] h-fit">
      <div className="font-semibold text-dark900 flex items-center justify-between">
        <PageHeader title="Attachments" />
        {!isEditable && (
          <UploadButton
            className="font-light text-dark900 cursor-pointer"
            onFileChange={onFileChange}
          >
            <span>+ Upload file</span>
            {(addingImage || (action === "addAttachment" && isLoading)) && <LoaderIcon />}
          </UploadButton>
        )}
      </div>
      <div className="flex flex-col gap-0 max-h-[12.5rem] overflow-y-auto">
        {attachments.length > 0 ? (
          attachments.map(renderAttachmentItem)
        ) : (
          <p>No attachments found</p>
        )}
      </div>
    </div>
  );
}

export default RequestAttachments;
