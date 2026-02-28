import { ChangeEvent, memo, useEffect, useState, useCallback } from "react";
import cloud_upload from "@/assets/cloud_upload.svg";
import { showNotification } from "@/pages/HomePage/utils";
import { validateUploadFile } from "@/utils/uploadValidation";

export type image = { image: string; id: number; file?: File };

const UploadButton = memo(
  ({
    handleFileChange,
    images,
  }: {
    handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
    images: image[];
  }) => {
    return (
      <div
        className={`rounded-xl cursor-pointer focus:outline-none ${
          !images?.length
            ? "w-full h-full"
            : "w-20 h-20 text-center text-sm border border-dashed "
        }`}
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          id="fileUpload"
          multiple
        />
        <label
          htmlFor="fileUpload"
          className="flex items-center justify-center h-full cursor-pointer"
          aria-label="Upload images"
        >
          <div className="flex items-center justify-center flex-col px-1">
            <img className="mx-auto" src={cloud_upload} alt="Upload a file" />
            <span className="text-xs">
              {!images?.length
                ? " Click here to add attachments"
                : "Add image(s)"}
            </span>
          </div>
        </label>
      </div>
    );
  }
);
UploadButton.displayName = "MultiImageUploadButton";
const MultiImageComponent = ({
  placeholder,
  imageChange,
  MAX_IMAGES = 5,
  initialImages,
}: {
  placeholder?: string;
  imageChange: (images: image[]) => void;
  MAX_IMAGES?: number;
  initialImages: image[];
}) => {
  const [images, setImages] = useState<image[]>([]);

  useEffect(() => {
    if (initialImages.length > 0) {
      setImages(initialImages);
    } 
  }, [initialImages]);

  const handleFileChangeWithStore = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files) {
        if (files.length + images.length > MAX_IMAGES) {
          showNotification(
            `You can only upload a maximum of ${MAX_IMAGES} images.`,
            "error",
            "Add image"
          );
          return;
        }
        Array.from(files).forEach((file, index) => {
          const validation = validateUploadFile(file, {
            allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          });

          if (!validation.valid) {
            showNotification(
              validation.message || "Invalid image selected.",
              "error",
              "Add image"
            );
            return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            const imagePreview = reader.result as string;
            setImages((prev) => [
              ...prev,
              { id: prev.length + index + 1, image: imagePreview, file },
            ]);
          };
          reader.onerror = () => {
            console.error("File reading has failed.");
            showNotification(
              "There was an error reading the file. Please try again.",
              "error"
            );
          };
          reader.readAsDataURL(file);
        });
      }
    },
    [MAX_IMAGES, images.length]
  );

  const removeImage = useCallback((id: number) => {
    setImages((images) => images.filter((image) => image.id !== id));
  }, []);

  useEffect(() => {
    imageChange(images);
  }, [imageChange, images]);

  return (
    <div>
      {placeholder && (
        <p className="font-semibold text-primary pb-1 ">{placeholder}</p>
      )}
      <div
        className={`flex p-2 overflow-auto flex-wrap gap-2 items-center justify-center   w-full h-[9.5rem] border border-dashed rounded-xl focus:outline-none`}
      >
        {images?.map((image) => {
          return (
            <div className="relative" key={image.id}>
              <img
                src={image.image}
                alt={`item ${image.id}`}
                className="w-20 h-20 shadow-sm rounded-lg"
              />
              <button
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center"
                onClick={() => removeImage(image.id)}
                aria-label="Remove image"
              >
                &times;
              </button>
            </div>
          );
        })}
        <UploadButton
          handleFileChange={handleFileChangeWithStore}
          images={images}
        />
      </div>
    </div>
  );
};

export default MultiImageComponent;
