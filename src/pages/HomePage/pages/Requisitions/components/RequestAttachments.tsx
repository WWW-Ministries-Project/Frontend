import DeleteIcon from "@/assets/DeleteIcon";
import DownloadIcon from "@/assets/DownloadIcon";
import FileIcon from "@/assets/FileIcon";
import LoaderIcon from "@/assets/LoaderIcon";
import UploadButton from "@/components/UploadButton";
import { handleDownload } from "@/pages/HomePage/utils";
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
  attachments: { URL: string; id?: number }[];
  isEditable: boolean;
  addAttachement: (attachment: string) => void;
  removAttachment: (id: number) => void;
  isLoading: boolean;
  action: ActionType;
  fileId: string;
}>) {
  const { handleUpload, addingImage } = useImageUpload();

  const onFileChange = async (file: File | null) => {
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    const response = await handleUpload(formData);

    if (response?.URL) {
      addAttachement(response.URL);
    }
  };

  return (
    <aside className="app-card h-fit p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-primary">Attachments</h3>
        {isEditable && (
          <UploadButton
            className="text-sm font-medium text-primary"
            onFileChange={onFileChange}
          >
            <span className="inline-flex items-center gap-2">
              + Upload file
              {(addingImage || (action === "addAttachment" && isLoading)) && (
                <LoaderIcon />
              )}
            </span>
          </UploadButton>
        )}
      </div>

      <div className="mt-3 max-h-[18rem] space-y-2 overflow-y-auto pr-1">
        {attachments.length > 0 ? (
          attachments.map((attachment) => {
            const isDeleting =
              action === "removeAttachment" &&
              isLoading &&
              Number(fileId) === attachment.id;

            return (
              <article
                key={`${attachment.id ?? attachment.URL}-${attachment.URL}`}
                className="flex items-start gap-3 rounded-lg border border-lightGray bg-white p-3"
              >
                <FileIcon />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-primary">
                    {attachment.URL?.split("/").pop() || "Attachment"}
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownload(attachment.URL)}
                      className="app-icon-btn"
                      aria-label="Download attachment"
                    >
                      <DownloadIcon />
                    </button>

                    {isEditable && (
                      <button
                        type="button"
                        onClick={() =>
                          attachment.id !== undefined && removAttachment(attachment.id)
                        }
                        className="app-icon-btn app-icon-btn-danger"
                        aria-label="Delete attachment"
                      >
                        <DeleteIcon fill="#D92D20" />
                      </button>
                    )}

                    {isDeleting && <LoaderIcon />}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <p className="rounded-lg border border-dashed border-lightGray px-3 py-4 text-center text-sm text-primaryGray">
            No attachments found.
          </p>
        )}
      </div>
    </aside>
  );
}

export default RequestAttachments;
