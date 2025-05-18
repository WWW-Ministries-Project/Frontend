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
      <dialog ref={dialog} className="rounded p-5 shadow-lg text-primary">
        <h1 className="H600">Delete {dialogData.name}</h1>
        <div className="mt-3">
          Are you sure you want to delete {dialogData.name}. <br /> This action
          cannot be undone.
        </div>
        <div className="mt-3 flex justify-between p-2">
          <Button
            value="Cancel"
            variant="ghost"
            onClick={handleShowModal}
          />
          <Button value="Delete" variant="primary" onClick={handleDelete} />
        </div>
      </dialog>
    </div>
  );
};
