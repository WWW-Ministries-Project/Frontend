import { useEffect, useState } from "react";

import { notify } from "@/components/feedback";
import { validateUploadFile } from "@/utils/uploadValidation";

import {
  ImageDropField,
} from "../ui/commUi";

// 16:9 to match the app's Home screen artwork slot.
const OUTPUT_WIDTH = 1600;
const OUTPUT_HEIGHT = 900;
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
        notify.error({ title: "Couldn't crop the image", message: `${message}. Try another image.` });
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

  const handleFile = (selectedFile: File) => {
    const validation = validateUploadFile(selectedFile, {
      allowedMimeTypes: IMAGE_MIME_TYPES,
    });

    if (!validation.valid) {
      notify.error({
        title: "Couldn't use that image",
        message: validation.message || "Choose a JPG, PNG, WebP or GIF image.",
      });
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

  const slider = (
    label: string,
    value: number,
    onChange: (value: number) => void,
    min: number,
    max: number,
    step: number
  ) => (
    <label className="flex flex-col gap-1 text-sm text-primary">
      {label}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-primary"
      />
    </label>
  );

  return (
    <div className="flex flex-col gap-3">
      <ImageDropField
        label="Theme artwork"
        help="16:9, at least 1600×900px. You can crop after uploading."
        previewUrl={previewUrl}
        onFile={handleFile}
        onClear={hasSelectedImage && initialImageUrl ? handleClearReplacement : undefined}
        clearLabel="Keep current image"
      />
      {hasSelectedImage && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3 rounded-lg border border-lightGray p-3">
          {slider("Zoom", zoom, setZoom, 1, 3, 0.05)}
          {slider("Left and right", horizontalPosition, setHorizontalPosition, 0, 100, 1)}
          {slider("Up and down", verticalPosition, setVerticalPosition, 0, 100, 1)}
        </div>
      )}
    </div>
  );
};

export default ThemeImageCropper;
