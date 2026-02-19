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
          className="fixed inset-0 z-50 bg-primary/45 backdrop-blur-sm"
          style={{ animation: "fadeIn 0.2s" }}
        />

        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 md:p-6">
          <Dialog.Content
            aria-describedby="dialog-description"
            className={cn(
              "app-scrollbar relative flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-y-auto rounded-2xl border border-lightGray bg-white shadow-2xl focus:outline-none md:max-h-[calc(100dvh-3rem)]",
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
