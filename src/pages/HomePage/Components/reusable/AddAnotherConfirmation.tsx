import React from "react";

type AddAnotherConfirmationProps = {
  /** Content/message shown in the modal body */
  content: React.ReactNode;
  /** Called when user cancels */
  cancelAction: () => void;
  /** Called when user confirms adding another */
  confirmationAction: () => void;
};

const AddAnotherConfirmation: React.FC<AddAnotherConfirmationProps> = ({
  cancelAction,
  confirmationAction,
  content,
}) => {
  return (
    <div className="p-6 space-y-4">
      <div>{content}</div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          className="px-4 py-2 border rounded hover:bg-gray-50"
          onClick={cancelAction}
        >
          No, close
        </button>

        <button
          type="button"
          className="px-4 py-2 bg-primary text-white rounded hover:opacity-90"
          onClick={confirmationAction}
        >
          Yes, add another
        </button>
      </div>
    </div>
  );
};

export default AddAnotherConfirmation;