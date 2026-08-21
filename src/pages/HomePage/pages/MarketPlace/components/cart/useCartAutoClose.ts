import { useEffect, useState } from "react";
import type { FocusEvent, RefObject } from "react";

import { useCart } from "../../utils/cartSlice";

/** How long the drawer stays open with no interaction before auto-closing. */
export const AUTO_CLOSE_DELAY_MS = 5000;

interface UseCartAutoCloseResult {
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onTouchStart: () => void;
  onTouchEnd: () => void;
  onFocus: () => void;
  onBlur: (event: FocusEvent<HTMLDivElement>) => void;
}

/**
 * Owns the 5s auto-close countdown for CartDrawer. Pauses while the pointer,
 * a touch, or focus is inside the drawer; resumes a fresh countdown when it
 * leaves. Only ever runs while `cartAutoCloseArmed` is true (i.e. the drawer
 * was opened by addToCart, not by a manual cart-icon click).
 */
export function useCartAutoClose(
  containerRef: RefObject<HTMLDivElement>
): UseCartAutoCloseResult {
  const { cartOpen, cartAutoCloseArmed, cartAddPulse, toggleCart } = useCart();
  const [interacting, setInteracting] = useState(false);

  useEffect(() => {
    if (!cartOpen || !cartAutoCloseArmed || interacting) return;

    const timer = window.setTimeout(() => {
      toggleCart(false);
    }, AUTO_CLOSE_DELAY_MS);

    return () => window.clearTimeout(timer);
    // cartAddPulse isn't read here, but including it means a re-add while
    // the drawer's already open restarts the countdown even though
    // cartOpen/cartAutoCloseArmed/interacting didn't themselves change.
  }, [cartOpen, cartAutoCloseArmed, interacting, cartAddPulse, toggleCart]);

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextFocusTarget = event.relatedTarget;
    if (
      containerRef.current &&
      nextFocusTarget instanceof Node &&
      containerRef.current.contains(nextFocusTarget)
    ) {
      // Focus moved to another element still inside the drawer — stay paused.
      return;
    }
    setInteracting(false);
  };

  return {
    onPointerEnter: () => setInteracting(true),
    onPointerLeave: () => setInteracting(false),
    onTouchStart: () => setInteracting(true),
    onTouchEnd: () => setInteracting(false),
    onFocus: () => setInteracting(true),
    onBlur: handleBlur,
  };
}
