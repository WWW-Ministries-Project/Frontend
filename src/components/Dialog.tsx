import { useDialogStore } from "@/pages/HomePage/store/globalComponentsStore";
import { useEffect, useRef } from "react";
import { Button } from "./Button";

export const Dialog = () => {
  const dialog = useRef<HTMLDialogElement>(null);
  const { dialogData } = useDialogStore();
  useEffect(() => {
    if (dialogData.showModal) {
      dialog.current?.showModal();
    } else {
      dialog.current?.close();
    }
  }, [dialogData.showModal]);
  function handleShowModal() {
    dialogData.onCancel();
  }
  function handleDelete() {
    dialogData.onConfirm();
  }
  return (
    <div>
      <dialog
        ref={dialog}
        className="w-full max-w-md rounded-2xl border border-lightGray p-6 text-primary shadow-2xl backdrop:bg-primary/45"
      >
        <h1 className="H600">Delete {dialogData.name}</h1>
        <div className="mt-3 text-sm text-primaryGray">
          Are you sure you want to delete {dialogData.name}. <br /> This action
          cannot be undone.
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            value="Cancel"
            variant="secondary"
            onClick={handleShowModal}
          />
          <Button value="Delete" variant="primary" onClick={handleDelete} />
        </div>
      </dialog>
    </div>
  );
};
