export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
] as const;

export const ASSIGNMENT_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const DEFAULT_UPLOAD_ACCEPT =
  ".jpg,.jpeg,.png,.webp,.gif,.pdf,image/jpeg,image/png,image/webp,image/gif,application/pdf";

export const ASSIGNMENT_DOCUMENT_ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export type UploadValidationOptions = {
  allowedMimeTypes?: readonly string[];
  maxSizeBytes?: number;
  invalidTypeMessage?: string;
  invalidSizeMessage?: string;
};

export type UploadValidationResult = {
  valid: boolean;
  message?: string;
};

export const validateUploadFile = (
  file: File,
  options: UploadValidationOptions = {}
): UploadValidationResult => {
  const allowedMimeTypes =
    options.allowedMimeTypes ?? ALLOWED_UPLOAD_MIME_TYPES;
  const maxSizeBytes = options.maxSizeBytes ?? MAX_UPLOAD_SIZE_BYTES;

  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      message:
        options.invalidTypeMessage ||
        "Unsupported file type. Allowed types are JPG, PNG, WEBP, GIF, and PDF.",
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      message:
        options.invalidSizeMessage ||
        "File size exceeds 5 MB. Please choose a smaller file.",
    };
  }

  return { valid: true };
};
