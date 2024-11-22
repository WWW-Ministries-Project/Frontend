import { ChangeEvent, memo, useEffect, useState } from "react";
import cloud_upload from "../assets/cloud_upload.svg";
import useFileUpload from "@/CustomHooks/useFileUpload";

export type image = { image: string; id: number; file: File };

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
          !images?.length ? "w-full h-full" : "w-24 h-24 border border-dashed "
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
        >
          <div className="flex items-center justify-center flex-col">
            <img className="mx-auto" src={cloud_upload} alt="Upload an image" />
            <span className="text-sm">
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
const MultiImageComponent = ({
  placeholder,
  imageChange,
}: {
  placeholder?: string;
  imageChange: (images: image[]) => void;
}) => {
  const { handleFileChange } = useFileUpload();
  const [images, setImages] = useState<image[]>([]);
  const handleFileChangeWithStore = (event: ChangeEvent<HTMLInputElement>) => {
    handleFileChange(event);
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file, index) => {
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
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (id: number) => {
    setImages((images) => images.filter((image) => image.id !== id));
  };

  useEffect(() => {
    imageChange(images);
  }, [images]);

  return (
    <div>
      {placeholder && (
        <p className="font-semibold text-dark900 pb-1 ">{placeholder}</p>
      )}
      <div
        className={`flex p-2 flex-wrap gap-2 items-center justify-center  overflow-hidden  w-full h-[9.5rem] border border-dashed rounded-xl focus:outline-none`}
      >
        {images?.map((image) => {
          return (
            <div className="relative" key={image.id}>
              <img
                src={image.image}
                alt={`Image ${image.id}`}
                className="w-24 h-24 shadow-sm rounded-lg"
                onClick={() => removeImage(image.id)}
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
