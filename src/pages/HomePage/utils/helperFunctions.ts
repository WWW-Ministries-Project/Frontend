import {
  useDialogStore,
  useLoaderStore,
  useNotificationStore,
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

export const showDeleteDialog = <T extends DialogValue>(
  val: T,
  handleDelete: (id: string | number) => void
) => {
  const dialogStore = useDialogStore.getState();
  dialogStore.setDialog({
    name: val.name,
    showModal: true,
    onConfirm: () => {
      handleDelete(val.id);
      dialogStore.dialogDataReset();
    },
    onCancel: dialogStore.dialogDataReset,
  });
};

export const showNotification = (
  message: string,
  type: "success" | "error" = "success",
  handleClose = () => {},
  title?:string,
) => {
  const notification = useNotificationStore.getState().setNotification;
  notification({ message, show: true, onClose: handleClose, type,title });
};

export const showLoader = (val: boolean) => {
  const {setLoading} = useLoaderStore.getState();
  setLoading(val);
}

export const isArray = function (data: unknown) {
  return Array.isArray(data);
};

export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
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
  } catch (error) {
    console.error("Error downloading the image:", error);
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
