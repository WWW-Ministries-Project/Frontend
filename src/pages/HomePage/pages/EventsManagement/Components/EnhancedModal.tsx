import { useEffect, useState } from "react";

interface ModalDimensions {
    width: number;
    height: number;
}

interface CalculatePositionOptions {
    preferredPosition?: 'auto' | 'top' | 'bottom' | 'left' | 'right' | 'center';
    offset?: number;
    avoidOverlap?: boolean;
    centerIfNoSpace?: boolean;
}

interface ModalPositionResult {
    top: string;
    left: string;
    placement: string;
}

interface EnhancedModalProps {
    isOpen: boolean;
    onClose: () => void;
    triggerElement: HTMLElement | null;
    children: React.ReactNode;
    modalRef?: React.Ref<HTMLDivElement>;
    dimensions?: ModalDimensions;
    className?: string;
}

export const EnhancedModal: React.FC<EnhancedModalProps> = ({ 
    isOpen, 
    onClose, 
    triggerElement, 
    children, 
    modalRef,
    dimensions = { width: 300, height: 300 },
    className = ""
}) => {
    const [position, setPosition] = useState<{ top: string; left: string }>({ top: '50%', left: '50%' });
    const [placement, setPlacement] = useState<string>('bottom');
    const [isPositioned, setIsPositioned] = useState<boolean>(false);

    const calculateDynamicModalPosition = (
        triggerElement: HTMLElement, 
        modalDimensions: ModalDimensions = { width: 300, height: 300 },
        options: CalculatePositionOptions = {}
    ): ModalPositionResult => {
        const {
            preferredPosition = 'auto',
            offset = 8,
            avoidOverlap = true,
            centerIfNoSpace = true
        } = options;

        const triggerRect = triggerElement.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        
        // Available space in each direction
        const spaceAbove = triggerRect.top;
        const spaceBelow = viewportHeight - triggerRect.bottom;
        const spaceLeft = triggerRect.left;
        const spaceRight = viewportWidth - triggerRect.right;
        
        let position = { top: 0, left: 0 };
        let placement = 'bottom';
        
        // Smart positioning logic
        const canFitBelow = spaceBelow >= modalDimensions.height + offset;
        const canFitAbove = spaceAbove >= modalDimensions.height + offset;
        const canFitRight = spaceRight >= modalDimensions.width + offset;
        const canFitLeft = spaceLeft >= modalDimensions.width + offset;
        
        if (preferredPosition === 'auto') {
            // Choose position with most available space
            const maxVerticalSpace = Math.max(spaceAbove, spaceBelow);
            const maxHorizontalSpace = Math.max(spaceLeft, spaceRight);
            
            if (maxVerticalSpace >= modalDimensions.height + offset) {
                // Position vertically (above or below)
                if (spaceBelow >= spaceAbove && canFitBelow) {
                    position.top = triggerRect.bottom + offset + scrollY;
                    placement = 'bottom';
                } else if (canFitAbove) {
                    position.top = triggerRect.top - modalDimensions.height - offset + scrollY;
                    placement = 'top';
                } else {
                    position.top = triggerRect.bottom + offset + scrollY;
                    placement = 'bottom';
                }
                
                // Center horizontally relative to trigger
                position.left = triggerRect.left + (triggerRect.width - modalDimensions.width) / 2 + scrollX;
                
                // Keep within viewport bounds
                position.left = Math.max(offset, Math.min(position.left, viewportWidth - modalDimensions.width - offset));
                
            } else if (maxHorizontalSpace >= modalDimensions.width + offset) {
                // Position horizontally (left or right)
                if (spaceRight >= spaceLeft && canFitRight) {
                    position.left = triggerRect.right + offset + scrollX;
                    placement = 'right';
                } else if (canFitLeft) {
                    position.left = triggerRect.left - modalDimensions.width - offset + scrollX;
                    placement = 'left';
                } else {
                    position.left = triggerRect.right + offset + scrollX;
                    placement = 'right';
                }
                
                // Center vertically relative to trigger
                position.top = triggerRect.top + (triggerRect.height - modalDimensions.height) / 2 + scrollY;
                
                // Keep within viewport bounds
                position.top = Math.max(offset, Math.min(position.top, viewportHeight - modalDimensions.height - offset));
                
            } else if (centerIfNoSpace) {
                // Center on screen if no good position available
                position.top = Math.max(offset, (viewportHeight - modalDimensions.height) / 2) + scrollY;
                position.left = Math.max(offset, (viewportWidth - modalDimensions.width) / 2) + scrollX;
                placement = 'center';
            } else {
                // Fallback: position below with boundary constraints
                position.top = Math.min(triggerRect.bottom + offset, viewportHeight - modalDimensions.height - offset) + scrollY;
                position.left = Math.max(offset, Math.min(triggerRect.left, viewportWidth - modalDimensions.width - offset)) + scrollX;
                placement = 'bottom';
            }
        }
        
        return {
            top: `${position.top}px`,
            left: `${position.left}px`,
            placement
        };
    };
    
    // Update position when EnhancedModal opens or trigger changes
    useEffect(() => {
        if (isOpen && triggerElement) {
            const positionData = calculateDynamicModalPosition(triggerElement, dimensions, {
                preferredPosition: 'auto',
                offset: 12,
                centerIfNoSpace: true
            });
            
            setPosition({ top: positionData.top, left: positionData.left });
            setPlacement(positionData.placement);
            setIsPositioned(true);
        } else {
            setIsPositioned(false);
        }
    }, [isOpen, triggerElement, dimensions]);
    
    // Handle repositioning on scroll/resize
    useEffect(() => {
        if (!isOpen || !triggerElement) return;
        
        const handleReposition = () => {
            const positionData = calculateDynamicModalPosition(triggerElement, dimensions, {
                preferredPosition: 'auto',
                offset: 12,
                centerIfNoSpace: true
            });
            setPosition({ top: positionData.top, left: positionData.left });
        };
        
        const debouncedReposition = debounce(handleReposition, 50);
        
        window.addEventListener('resize', debouncedReposition);
        window.addEventListener('scroll', debouncedReposition, true);
        
        return () => {
            window.removeEventListener('resize', debouncedReposition);
            window.removeEventListener('scroll', debouncedReposition, true);
        };
    }, [isOpen, triggerElement, dimensions]);
    
    if (!isOpen) return null;
    
    const modalClasses = `
        inline-block align-bottom bg-white rounded-xl text-left overflow-hidden 
        shadow-xl transform transition-all duration-200 ease-out
        ${className}
        ${isPositioned ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
    `.trim();
    
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div 
                    className={`fixed inset-0 bg-gray-500 transition-opacity duration-200 ${
                        isPositioned ? 'opacity-75' : 'opacity-0'
                    }`} 
                    onClick={onClose} 
                />
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                <div
                    className={modalClasses}
                    style={{ 
                        position: 'absolute', 
                        ...position,
                        maxWidth: '90vw',
                        maxHeight: '90vh',
                        zIndex: 60
                    }}
                    ref={modalRef}
                    data-placement={placement}
                >
                    <button
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 z-10 
                                         w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100
                                         transition-colors duration-150"
                        onClick={onClose}
                        aria-label="Close EnhancedModal"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    {children}
                </div>
            </div>
        </div>
    );
};</svg>