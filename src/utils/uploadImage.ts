import { pictureInstance as axiosPic } from "@/axiosInstance";
import {
  validateUploadFile,
  type UploadValidationOptions,
} from "./uploadValidation";

/** MIME types accepted for profile / content images. */
export const IMAGE_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

/**
 * Uploads a single file to the shared `/upload` endpoint and returns its public
 * link. Throws on an invalid file or a non-200 response so callers can keep the
 * upload inside a try/catch instead of silently continuing.
 */
export const uploadImageFile = async (
  file: File,
  options: UploadValidationOptions = { allowedMimeTypes: IMAGE_UPLOAD_MIME_TYPES }
): Promise<string> => {
  const validation = validateUploadFile(file, options);
  if (!validation.valid) {
    throw new Error(validation.message || "Invalid file selected.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosPic.post("/upload", formData);
  const link = response?.data?.result?.link as string | undefined;

  if (response?.status !== 200 || !link) {
    throw new Error("Image upload failed");
  }

  return link;
};

type SaveThenAttachImageArgs<TSaved> = {
  /** The pending file, or null/undefined when the record has no new image. */
  file: File | null | undefined;
  /** Persists the record WITHOUT the image and resolves with the saved result. */
  save: () => Promise<TSaved>;
  /** Attaches the uploaded link to the already-saved record. */
  attach: (link: string, saved: TSaved) => Promise<void>;
  /** Validation applied before anything is saved or uploaded. */
  validationOptions?: UploadValidationOptions;
  /**
   * Called when the record saved but the image upload/attach failed. Lets the
   * caller surface a soft warning and still treat the save as successful. When
   * omitted the image error propagates.
   */
  onImageError?: (error: unknown) => void;
};

/**
 * Save-first image handling: persist the record BEFORE uploading, so a failed
 * save can never leave an orphaned object in the bucket. The upload only runs
 * after the save succeeds, then the link is attached to the saved record.
 *
 * Failure modes:
 * - invalid file  -> nothing is saved or uploaded (throws before `save`)
 * - save fails    -> nothing is uploaded (throws out of `save`)
 * - upload/attach -> record is saved without the image (recoverable). Handled
 *                    via `onImageError`, otherwise rethrown.
 */
export const saveThenAttachImage = async <TSaved>({
  file,
  save,
  attach,
  validationOptions = { allowedMimeTypes: IMAGE_UPLOAD_MIME_TYPES },
  onImageError,
}: SaveThenAttachImageArgs<TSaved>): Promise<TSaved> => {
  // Validate up front so a bad image never results in a half-saved record.
  if (file instanceof File) {
    const validation = validateUploadFile(file, validationOptions);
    if (!validation.valid) {
      throw new Error(validation.message || "Invalid file selected.");
    }
  }

  const saved = await save();

  if (file instanceof File) {
    try {
      const link = await uploadImageFile(file, validationOptions);
      await attach(link, saved);
    } catch (error) {
      if (onImageError) {
        onImageError(error);
      } else {
        throw error;
      }
    }
  }

  return saved;
};
