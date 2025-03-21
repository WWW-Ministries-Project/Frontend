import { useDialogStore } from "@/pages/HomePage/store/globalComponentsStore";
import { useEffect, useRef } from "react";
import Button from "./Button";

const Dialog = () => {
  const dialog = useRef<HTMLDialogElement>(null);
  const { dialogData } = useDialogStore();
  useEffect(() => {
    dialogData.showModal ? dialog.current?.showModal() : dialog.current?.close();
  }, [dialogData.showModal]);
  function handleShowModal() {
    dialogData.onCancel();
  }
  function handleDelete() {
    dialogData.onConfirm();
  }
  return (
    <div>
      <dialog ref={dialog} className="rounded p-5 shadow-lg text-dark900">
        <h1 className="H600">Delete {dialogData.name}</h1>
        <div className="mt-3">
          Are you sure you want to delete {dialogData.name}. <br /> This action
          cannot be undone.
        </div>
        <div className="mt-3 flex justify-between p-2">
          <Button
            value="Cancel"
            className="tertiary"
            onClick={handleShowModal}
          />
          <Button value="Delete" className="primary" onClick={handleDelete} />
        </div>
      </dialog>
    </div>
  );
};

export default Dialog;
