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
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50"
          style={{ animation: "fadeIn 0.2s" }}
        />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-auto max-w-xlg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-md m-4 overflow-y-auto"
          onPointerDownOutside={persist ? (e) => e.preventDefault() : undefined}
          onEscapeKeyDown={persist ? (e) => e.preventDefault() : undefined}
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
