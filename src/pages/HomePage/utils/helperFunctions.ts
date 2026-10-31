import { notify, recentApiErrorToast } from "@/components/feedback/notify";
import {
  useDialogStore,
  useLoaderStore,
  useNotificationStore,
} from "../store/globalComponentsStore";
import type {
  AlertDetailSection,
  ConfirmDialogOptions,
} from "../store/globalComponentsStore";

type DialogValue = {
  id: string | number;
  name: string;
};

export const maxMinValueForDate = () => {
  const currentYear = new Date().getFullYear();
  const today = new Date();
  const maxDate = currentYear + "-12-31";
  const minDate = today.toISOString().split("T")[0];
  return { minDate, maxDate };
};

const isPromise = (value: unknown): value is Promise<unknown> =>
  !!value && typeof (value as Promise<unknown>).then === "function";

/**
 * Opens the global confirm dialog. If `onConfirm` returns a promise the
 * dialog shows a spinner, closes on success and shows the error inside on
 * failure.
 */
export const confirmAction = (options: ConfirmDialogOptions) => {
  const dialogStore = useDialogStore.getState();
  dialogStore.setDialog({
    ...options,
    showModal: true,
    onConfirm: () => {
      const result = options.onConfirm();
      if (isPromise(result)) return result;
      dialogStore.dialogDataReset();
    },
    onCancel: () => {
      options.onCancel?.();
      dialogStore.dialogDataReset();
    },
  });
};

export const showDeleteDialog = <T extends DialogValue>(
  val: T,
  handleDelete: (id: string | number) => void | Promise<unknown>,
  options?: Partial<Omit<ConfirmDialogOptions, "onConfirm">>
) => {
  confirmAction({
    title: `Delete ${val.name}?`,
    confirmLabel: "Delete",
    tone: "danger",
    ...options,
    onConfirm: () => handleDelete(val.id),
  });
};

export const showConfirmDialog = (
  title: string,
  onConfirm: () => void | Promise<unknown>,
  options?: Partial<Omit<ConfirmDialogOptions, "title" | "onConfirm">>
) => {
  confirmAction({
    title,
    confirmLabel: "Confirm",
    tone: "default",
    points: [],
    ...options,
    onConfirm,
  });
};

// Legacy titles that only restate the tone; the message makes a better title.
const GENERIC_TITLES = new Set([
  "error",
  "success",
  "action",
  "action failed",
  "action completed",
  "failed",
  "warning",
  "info",
  "notice",
]);

/**
 * Legacy wrapper kept during migration. Prefer `notify` from
 * "@/components/feedback" for new code.
 */
export const showNotification = (
  message: string,
  type: "success" | "error" | "info" | "warning" = "success",
  optionsOrOnClose?:
    | {
        title?: string;
        details?: AlertDetailSection[];
        onClose?: () => void;
        durationMs?: number;
      }
    | (() => void)
    | string,
  legacyTitle?: string
) => {
  let title: string | undefined = legacyTitle;
  let details: AlertDetailSection[] | undefined;
  let onClose: (() => void) | undefined;
  let durationMs: number | undefined;

  if (typeof optionsOrOnClose === "function") {
    onClose = optionsOrOnClose;
  } else if (typeof optionsOrOnClose === "string") {
    title = optionsOrOnClose;
  } else if (optionsOrOnClose) {
    title = optionsOrOnClose.title ?? title;
    details = optionsOrOnClose.details;
    onClose = optionsOrOnClose.onClose;
    durationMs = optionsOrOnClose.durationMs;
  }

  const useTitle = !!title && !GENERIC_TITLES.has(title.trim().toLowerCase());

  // The request already raised an error toast; fold this copy into it.
  const recent = type === "error" ? recentApiErrorToast() : undefined;
  if (recent) {
    const text = message.trim();
    const repeatsServer = text === recent.message || text === recent.title;
    useNotificationStore.getState().patch(recent.id, {
      source: undefined,
      ...(repeatsServer ? {} : { title: useTitle ? (title as string) : text }),
      ...(useTitle && !repeatsServer ? { message: text } : {}),
    });
    return;
  }

  notify[type]({
    title: useTitle ? (title as string) : message,
    message: useTitle ? message : undefined,
    details,
    onClose,
    duration: durationMs,
  });
};

export const showLoader = (val: boolean) => {
  const { setLoading } = useLoaderStore.getState();
  setLoading(val);
};

export const isArray = function (data: unknown) {
  return Array.isArray(data);
};

export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export async function handleDownload(imageSrc: string) {
  try {
    // Fetch the image from the source URL
    const response = await fetch(imageSrc);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const imageBlob = await response.blob();
    const imageURL = URL.createObjectURL(imageBlob);

    // Create a download link
    const link = document.createElement("a");
    link.href = imageURL;

    // Extract filename or use a default name
    const filename = imageSrc.split("/").pop() || "downloaded-file";
    link.download = filename;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Revoke the object URL to free memory
    URL.revokeObjectURL(imageURL);
  } catch {
    showNotification("Unable to download file.", "error");
  }
}

export const markTouchedFields = (
  //TODO fix this after fixing events
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: Record<string, any>,
  touched: Record<string, boolean> = {}
) => {
  Object.keys(errors).forEach((field) => {
    if (typeof errors[field] === "object" && errors[field] !== null) {
      markTouchedFields(errors[field], touched);
    } else {
      touched[field] = true;
    }
  });

  return touched;
};

export const encodeQuery = (query: string | number) => {
  return encodeURIComponent(btoa(query + ""));
};

export const decodeQuery = (query: string) => {
  if (!query) return "";

  try {
    return atob(decodeURIComponent(query));
  } catch {
    return query;
  }
};
