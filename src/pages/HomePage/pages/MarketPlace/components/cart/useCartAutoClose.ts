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
 * a touch, or focus is inside the drawer panel; resumes a fresh countdown
 * when it leaves. Only ever runs while `cartAutoCloseArmed` is true (i.e.
 * the drawer was opened by addToCart, not by a manual cart-icon click).
 */
export function useCartAutoClose(
  containerRef: RefObject<HTMLDivElement>
): UseCartAutoCloseResult {
  const { cartOpen, cartAutoCloseArmed, cartAddPulse, toggleCart } = useCart();
  // Tracked independently so that one input channel releasing (e.g. the
  // pointer leaving) doesn't clear the pause while another channel (e.g.
  // keyboard focus) is still active inside the drawer.
  const [pointerOrTouchActive, setPointerOrTouchActive] = useState(false);
  const [focusActive, setFocusActive] = useState(false);
  const interacting = pointerOrTouchActive || focusActive;

  // The drawer panel unmounts when closed, so pointerleave/blur never fire
  // for an interaction that was in progress. Reset on close so the next
  // add-to-cart open starts with a clean countdown.
  useEffect(() => {
    if (cartOpen) return;
    setPointerOrTouchActive(false);
    setFocusActive(false);
  }, [cartOpen]);

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
    // Safari doesn't always populate relatedTarget on blur when focus moves
    // via a mousedown on a non-focusable element; in that case this resumes
    // the countdown slightly early rather than getting stuck open.
    const nextFocusTarget = event.relatedTarget;
    if (
      containerRef.current &&
      nextFocusTarget instanceof Node &&
      containerRef.current.contains(nextFocusTarget)
    ) {
      // Focus moved to another element still inside the drawer — stay paused.
      return;
    }
    setFocusActive(false);
  };

  return {
    onPointerEnter: () => setPointerOrTouchActive(true),
    onPointerLeave: () => setPointerOrTouchActive(false),
    onTouchStart: () => setPointerOrTouchActive(true),
    onTouchEnd: () => setPointerOrTouchActive(false),
    onFocus: () => setFocusActive(true),
    onBlur: handleBlur,
  };
}
