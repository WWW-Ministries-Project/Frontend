interface ModalProps {
  open: boolean;
  persist?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ open, persist = false, onClose, children }) => {
  const closeModal = () => {
    if (!persist) {
      onClose();
    }
  };

  const closeModalOutside = (event: React.MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).classList.contains('closeModal')) {
      closeModal();
    }
  };

  if (!open) return null;

  return (
    <div>
      <div 
        className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50 closeModal"
        onClick={closeModalOutside}
      >
        <div className="rounded-2xl shadow-md m-10 bg-white">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;