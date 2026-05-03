import { useEffect, useMemo, useState } from "react";

import { showNotification } from "@/pages/HomePage/utils";
import { validateUploadFile } from "@/utils/uploadValidation";

const OUTPUT_WIDTH = 1920;
const OUTPUT_HEIGHT = 640;
const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export interface CroppedThemeImage {
  file: File;
  previewUrl: string;
}

interface ThemeImageCropperProps {
  initialImageUrl?: string;
  onCroppedImageChange: (image: CroppedThemeImage | null) => void;
}

const createImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load selected image"));
    image.src = src;
  });

const canvasToBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to crop selected image"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.92
    );
  });

const cropImage = async (
  sourceUrl: string,
  sourceFileName: string,
  horizontalPosition: number,
  verticalPosition: number,
  zoom: number
): Promise<CroppedThemeImage> => {
  const image = await createImage(sourceUrl);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_WIDTH;
  canvas.height = OUTPUT_HEIGHT;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to prepare image crop");
  }

  const baseScale = Math.max(
    OUTPUT_WIDTH / image.naturalWidth,
    OUTPUT_HEIGHT / image.naturalHeight
  );
  const scale = baseScale * zoom;
  const sourceWidth = OUTPUT_WIDTH / scale;
  const sourceHeight = OUTPUT_HEIGHT / scale;
  const sourceX =
    (image.naturalWidth - sourceWidth) * (horizontalPosition / 100);
  const sourceY =
    (image.naturalHeight - sourceHeight) * (verticalPosition / 100);

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    OUTPUT_WIDTH,
    OUTPUT_HEIGHT
  );

  const blob = await canvasToBlob(canvas);
  const fileName = sourceFileName.replace(/\.[^.]+$/, "") || "theme-image";
  const file = new File([blob], `${fileName}-cropped.jpg`, {
    type: "image/jpeg",
  });
  const previewUrl = URL.createObjectURL(blob);

  return { file, previewUrl };
};

const ThemeImageCropper = ({
  initialImageUrl,
  onCroppedImageChange,
}: ThemeImageCropperProps) => {
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceFileName, setSourceFileName] = useState("theme-image");
  const [previewUrl, setPreviewUrl] = useState(initialImageUrl || "");
  const [horizontalPosition, setHorizontalPosition] = useState(50);
  const [verticalPosition, setVerticalPosition] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [hasSelectedImage, setHasSelectedImage] = useState(false);

  const inputId = useMemo(
    () => `theme-image-upload-${Math.random().toString(36).slice(2)}`,
    []
  );

  useEffect(() => {
    if (!hasSelectedImage) {
      setPreviewUrl(initialImageUrl || "");
    }
  }, [hasSelectedImage, initialImageUrl]);

  useEffect(() => {
    if (!sourceUrl || !hasSelectedImage) return;

    let isCurrent = true;

    cropImage(
      sourceUrl,
      sourceFileName,
      horizontalPosition,
      verticalPosition,
      zoom
    )
      .then((croppedImage) => {
        if (!isCurrent) {
          URL.revokeObjectURL(croppedImage.previewUrl);
          return;
        }
        setPreviewUrl((currentPreviewUrl) => {
          if (currentPreviewUrl && currentPreviewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(currentPreviewUrl);
          }
          return croppedImage.previewUrl;
        });
        onCroppedImageChange(croppedImage);
      })
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : "Unable to crop image";
        showNotification(message, "error", "Theme image");
      });

    return () => {
      isCurrent = false;
    };
  }, [
    hasSelectedImage,
    horizontalPosition,
    onCroppedImageChange,
    sourceFileName,
    sourceUrl,
    verticalPosition,
    zoom,
  ]);

  useEffect(() => {
    return () => {
      if (sourceUrl.startsWith("blob:")) {
        URL.revokeObjectURL(sourceUrl);
      }
    };
  }, [sourceUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const validation = validateUploadFile(selectedFile, {
      allowedMimeTypes: IMAGE_MIME_TYPES,
    });

    if (!validation.valid) {
      showNotification(
        validation.message || "Invalid theme image selected.",
        "error",
        "Theme image"
      );
      event.target.value = "";
      return;
    }

    setHorizontalPosition(50);
    setVerticalPosition(50);
    setZoom(1);
    setSourceFileName(selectedFile.name);
    setSourceUrl((currentSourceUrl) => {
      if (currentSourceUrl.startsWith("blob:")) {
        URL.revokeObjectURL(currentSourceUrl);
      }
      return URL.createObjectURL(selectedFile);
    });
    setHasSelectedImage(true);
  };

  const handleClearReplacement = () => {
    setHasSelectedImage(false);
    setSourceUrl((currentSourceUrl) => {
      if (currentSourceUrl.startsWith("blob:")) {
        URL.revokeObjectURL(currentSourceUrl);
      }
      return "";
    });
    setSourceFileName("theme-image");
    setHorizontalPosition(50);
    setVerticalPosition(50);
    setZoom(1);
    onCroppedImageChange(null);
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Theme preview"
            className="aspect-[3/1] max-h-56 w-full object-cover"
          />
        ) : (
          <label
            htmlFor={inputId}
            className="flex aspect-[3/1] max-h-56 w-full cursor-pointer items-center justify-center px-4 text-center text-sm text-gray-600"
          >
            Select a welcome header banner
          </label>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
        <label
          htmlFor={inputId}
          className="cursor-pointer rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {previewUrl ? "Replace image" : "Upload image"}
        </label>
        {hasSelectedImage && initialImageUrl && (
          <button
            type="button"
            onClick={handleClearReplacement}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Keep current image
          </button>
        )}
      </div>

      {hasSelectedImage && (
        <div className="grid gap-3 rounded-xl border border-gray-200 p-3 md:grid-cols-3">
          <label className="text-sm font-medium text-gray-700">
            Zoom
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Horizontal position
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={horizontalPosition}
              onChange={(event) =>
                setHorizontalPosition(Number(event.target.value))
              }
              className="mt-2 w-full"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Vertical position
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={verticalPosition}
              onChange={(event) =>
                setVerticalPosition(Number(event.target.value))
              }
              className="mt-2 w-full"
            />
          </label>
        </div>
      )}
    </div>
  );
};

export default ThemeImageCropper;
