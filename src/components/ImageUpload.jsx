import useFileUpload from "@/CustomHooks/useFileUpload";
import cloud_upload from "../assets/cloud_upload.svg";

const ImageUpload = ({ onFileChange, src, disabled=false }) => {
  const {
    isDragActive,
    file,
    preview,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileChange,
  } = useFileUpload(onFileChange);
  return (
    <div
      className={`flex justify-center items-center  overflow-hidden   h-[10rem] border border-dashed rounded-xl cursor-pointer focus:outline-none ${isDragActive ? "border-gray-500" : "border-gray-300"
        }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        id="fileUpload"
        disabled={disabled}
      />
      <label htmlFor="fileUpload" className="flex items-center">
        {preview || src ? (
          <img
            src={preview || src}
            alt="Preview"
            className="object-cover p-2 rounded-xl cursor-pointer"
            style={{ transform: "scale(1)" }}
          />
        ) : (
          <div>
            <img className="mx-auto" src={cloud_upload} alt="Upload a file" srcSet="" />
            <div className="text-center">
              Click here to upload the event banner
            </div>
          </div>
        )}
      </label>
    </div>
  );
};

export default ImageUpload;
