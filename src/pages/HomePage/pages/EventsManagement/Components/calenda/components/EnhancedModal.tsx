import React, {
  ReactNode,
  MutableRefObject,
  useLayoutEffect,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';

interface EnhancedModalProps {
  isOpen: boolean;
  onClose: () => void;
  anchor?: { x: number; y: number } | null;
  children: ReactNode;
  modalRef?: MutableRefObject<HTMLElement | null>;
  className?: string;
}

const PADDING = 8;

const placements = [
  'bottom-right',
  'bottom-left',
  'top-right',
  'top-left',
] as const;

function computePosition(
  anchor: { x: number; y: number },
  rect: DOMRect
) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  for (const p of placements) {
    let left = 0;
    let top = 0;

    switch (p) {
      case 'bottom-right':
        left = anchor.x + PADDING;
        top = anchor.y + PADDING;
        break;
      case 'bottom-left':
        left = anchor.x - rect.width - PADDING;
        top = anchor.y + PADDING;
        break;
      case 'top-right':
        left = anchor.x + PADDING;
        top = anchor.y - rect.height - PADDING;
        break;
      case 'top-left':
        left = anchor.x - rect.width - PADDING;
        top = anchor.y - rect.height - PADDING;
        break;
    }

    const fits =
      left >= 0 &&
      top >= 0 &&
      left + rect.width <= vw &&
      top + rect.height <= vh;

    if (fits) return { left, top };
  }

  // fallback: centered
  return {
    left: (vw - rect.width) / 2,
    top: (vh - rect.height) / 2,
  };
}

const EnhancedModal: React.FC<EnhancedModalProps> = ({
  isOpen,
  onClose,
  anchor,
  children,
  modalRef,
  className = '',
}) => {
  const hasPositionedRef = useRef(false);

  useLayoutEffect(() => {
    if (!isOpen || !modalRef?.current) return;

    hasPositionedRef.current = false;

    // Reset any previous inline styles
    Object.assign(modalRef.current.style, {
      left: '',
      top: '',
      transform: '',
    });
  }, [isOpen, modalRef]);

  useLayoutEffect(() => {
    if (
      !isOpen ||
      !modalRef?.current ||
      !anchor ||
      hasPositionedRef.current
    )
      return;

    const modal = modalRef.current;

    // Ensure modal has intrinsic size before measuring
    modal.style.position = 'fixed';
    modal.style.left = '0px';
    modal.style.top = '0px';
    modal.style.visibility = 'hidden';

    const rect = modal.getBoundingClientRect();
    const { left, top } = computePosition(anchor, rect);

    Object.assign(modal.style, {
      left: `${left}px`,
      top: `${top}px`,
      zIndex: '10000',
      visibility: 'visible',
    });

    hasPositionedRef.current = true;
  }, [isOpen, anchor, modalRef]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const handler = (e: MouseEvent) => {
      if (!modalRef?.current) return;
      if (!modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay binding to avoid immediate close on open
    const id = requestAnimationFrame(() => {
      document.addEventListener('mousedown', handler);
    });

    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener('mousedown', handler);
    };
  }, [isOpen, onClose, modalRef]);

  useLayoutEffect(() => {
    if (!isOpen || !modalRef?.current || !anchor) return;

    const reposition = () => {
      const rect = modalRef.current!.getBoundingClientRect();
      const { left, top } = computePosition(anchor, rect);

      Object.assign(modalRef.current!.style, {
        left: `${left}px`,
        top: `${top}px`,
      });
    };

    window.addEventListener('resize', reposition, { passive: true });
    window.addEventListener('scroll', reposition, true);

    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [isOpen, anchor, modalRef]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={modalRef as any}
      className={`bg-white rounded-xl shadow-xl max-w-[90vw] max-h-[90vh] overflow-hidden ${className}`}
      onClick={(e) => e.stopPropagation()}
      style={
        !anchor
          ? {
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10000,
            }
          : undefined
      }
    >
      {children}
    </div>,
    document.body
  );
};

export default EnhancedModal;