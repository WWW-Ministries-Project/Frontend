import React, { useState, useEffect, ReactNode, MutableRefObject } from 'react'

import { calculateDynamicModalPosition } from '../utils/CalendaHelpers'
import { debounce } from '../utils/CalendaHelpers'

export interface EnhancedModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback to close the modal */
  onClose: () => void
  /** Reference element to position the modal against */
  triggerElement: HTMLElement | null
  /** Modal contents */
  children: ReactNode
  /** Ref for the modal container */
  modalRef?: MutableRefObject<HTMLElement | null>
  /** Width & height of modal */
  dimensions?: { width: number; height: number }
  /** Extra wrapper classes */
  className?: string
}

const EnhancedModal: React.FC<EnhancedModalProps> = ({
  isOpen,
  onClose,
  triggerElement,
  children,
  modalRef,
  dimensions = { width: 300, height: 300 },
  className = '',
}) => {
  const [position, setPosition] = useState<{ top: string; left: string }>({ top: '50%', left: '50%' })
  const [placement, setPlacement] = useState<string>('bottom')
  const [isPositioned, setIsPositioned] = useState<boolean>(false)

  // Calculate initial position whenever opened or trigger changes
  useEffect(() => {
    if (isOpen && triggerElement) {
      const pos = calculateDynamicModalPosition(triggerElement, dimensions, {
        preferredPosition: 'auto',
        offset: 12,
        centerIfNoSpace: true,
      })
      setPosition({ top: pos.top, left: pos.left })
      setPlacement(pos.placement)
      setIsPositioned(true)
    } else {
      setIsPositioned(false)
    }
  }, [isOpen, triggerElement, dimensions])

  // Reposition on scroll/resize
  useEffect(() => {
    if (!isOpen || !triggerElement) return
    const reposition = () => {
      const pos = calculateDynamicModalPosition(triggerElement, dimensions, {
        preferredPosition: 'auto',
        offset: 12,
        centerIfNoSpace: true,
      })
      setPosition({ top: pos.top, left: pos.left })
    }
    const debounced = debounce(reposition, 50)
    window.addEventListener('resize', debounced)
    window.addEventListener('scroll', debounced, true)
    return () => {
      window.removeEventListener('resize', debounced)
      window.removeEventListener('scroll', debounced, true)
      debounced.cancel()
    }
  }, [isOpen, triggerElement, dimensions])

  if (!isOpen) return null

  const modalClasses = [
    'inline-block',
    'align-bottom',
    'bg-white',
    'rounded-xl',
    'text-left',
    'overflow-hidden',
    'shadow-xl',
    'transform',
    'transition-all',
    'duration-200',
    'ease-out',
    className,
    isPositioned ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
  ].join(' ')

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-gray-500 transition-opacity duration-200 ${
            isPositioned ? 'opacity-75' : 'opacity-0'
          }`}
          onClick={onClose}
        />

        {/* Spacer for vertical centering */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        {/* Modal container */}
        <div
          className={modalClasses}
          style={{
            position: 'absolute',
            top: position.top,
            left: position.left,
            width: dimensions.width,
            height: dimensions.height,
            maxWidth: '90vw',
            maxHeight: '90vh',
            zIndex: 60,
          }}
          ref={modalRef as any}
          data-placement={placement}
        >
          {/* Close button */}
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-150"
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {children}
        </div>
      </div>
    </div>
  )
}

export default EnhancedModal
