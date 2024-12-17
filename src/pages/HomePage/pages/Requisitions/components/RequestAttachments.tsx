import DeleteIcon from "@/assets/DeleteIcon";
import DownloadIcon from "@/assets/DownloadIcon";
import FileIcon from "@/assets/FileIcon";
import Button from "@/components/Button";
import PageHeader from "@/pages/HomePage/Components/PageHeader";

function RequestAttachments({
  attachments,
}: Readonly<{
  attachments: { URL: string }[];
}>) {
  return (
    <div className="border rounded-lg p-3 border-[#D9D9D9] h-fit">
      <div className="font-semibold text-dark900 flex items-center justify-between">
        <PageHeader title="Attachments" />
        <Button value="+ upload file" className="font-light text-primaryViolet"  />

      </div>
      <div className="flex flex-col gap-2 max-h-[12.5rem] overflow-y-auto">
        {attachments.map((attachment) => (
          <div
            key={attachment.URL}
            className="border p-2 rounded-lg flex gap-3 "
          >
              <FileIcon/>
            <div className="flex gap-2 flex-col">
              <div className="text-sm text-mainGray">{attachment.URL?.split("/")[7]}/{attachment.URL?.split("/")[8]}</div>
            <div className="flex items-center gap-2">
                <DownloadIcon/>
                <DeleteIcon fill="#D92D20"/>
            </div>
            </div>

          </div>
        ))}

        {!attachments?.length && <p>No attachments found</p>}
      </div>
    </div>
  );
}

export default RequestAttachments;
