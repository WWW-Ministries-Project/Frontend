import * as Dialog from "@radix-ui/react-dialog";

interface IProps {
  open: boolean;
  persist?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal = ({ open, persist = true, onClose, children }: IProps) => {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <Dialog.Portal>
        {/* Fullscreen overlay */}
        <Dialog.Overlay
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-10"
          style={{ animation: "fadeIn 0.2s" }}
        />

        {/* Flex container to center the modal */}
        <div className="fixed inset-0 z-10 flex items-center justify-center p-4">
          <Dialog.Content
            className="relative max-h-[90vh] w-full max-w-xl rounded-2xl bg-white shadow-md "
            onPointerDownOutside={
              persist ? (e) => e.preventDefault() : undefined
            }
            onEscapeKeyDown={
              persist ? (e) => e.preventDefault() : undefined
            }
          >
            <Dialog.Title className="hidden">title</Dialog.Title>
            {children}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
