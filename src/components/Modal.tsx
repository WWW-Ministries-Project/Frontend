import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/utils/cn";

interface IProps {
  open: boolean;
  persist?: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Modal = ({ open, persist = true, onClose, children, className }: IProps) => {
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
          className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm"
          style={{ animation: "fadeIn 0.2s" }}
        />

        {/* Flex container to center the modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Content
            aria-describedby="dialog-description"
            className={cn(
              "relative w-full max-w-xl rounded-2xl bg-white shadow-md max-h-[90vh] focus:outline-none",
              className
            )}
            onPointerDownOutside={
              persist ? (e) => e.preventDefault() : undefined
            }
            onEscapeKeyDown={
              persist ? (e) => e.preventDefault() : undefined
            }
          >
            <Dialog.Title className="hidden">title</Dialog.Title>
            <Dialog.Description id="dialog-description" className="sr-only">
              Modal dialog content
            </Dialog.Description>
            {children}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
