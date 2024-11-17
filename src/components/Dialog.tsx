import { useEffect, useRef } from "react";
import Button from "./Button";

interface IDialog<T extends { name?: string }> {
  showModal: boolean;
  onClick: () => void;
  onDelete: () => {};
  data: T;
}

const Dialog = <T extends { name?: string }>({
  showModal,
  ...props
}: IDialog<T>) => {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    showModal ? dialog.current?.showModal() : dialog.current?.close();
  }, [showModal]);
  function handleShowModal() {
    props.onClick();
  }
  function handleDelete() {
    props.onDelete();
  }
  return (
    <div>
      <dialog ref={dialog} className="rounded p-5 shadow-lg">
        <h1 className="H600">Delete {props.data?.name}</h1>
        <div className="mt-3">
          Are you sure you want to delete {props.data?.name}. <br /> This action
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
