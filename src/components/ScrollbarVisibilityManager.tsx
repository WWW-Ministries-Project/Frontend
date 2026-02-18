import { useEffect } from "react";

const SCROLL_ACTIVE_CLASS = "is-scrolling";
const SCROLL_IDLE_TIMEOUT_MS = 700;

export const ScrollbarVisibilityManager = () => {
  useEffect(() => {
    const activeTimers = new Map<Element, number>();

    const markScrolling = (target: Element) => {
      const isScrollable =
        target.scrollHeight > target.clientHeight ||
        target.scrollWidth > target.clientWidth;

      if (!isScrollable) return;

      target.classList.add(SCROLL_ACTIVE_CLASS);

      const currentTimer = activeTimers.get(target);
      if (currentTimer) {
        window.clearTimeout(currentTimer);
      }

      const nextTimer = window.setTimeout(() => {
        target.classList.remove(SCROLL_ACTIVE_CLASS);
        activeTimers.delete(target);
      }, SCROLL_IDLE_TIMEOUT_MS);

      activeTimers.set(target, nextTimer);
    };

    const handleScroll = (event: Event) => {
      if (event.target instanceof Element) {
        markScrolling(event.target);
        return;
      }

      const scrollingRoot =
        document.scrollingElement instanceof Element
          ? document.scrollingElement
          : document.documentElement;
      markScrolling(scrollingRoot);
    };

    document.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("scroll", handleScroll, true);
      activeTimers.forEach((timerId, element) => {
        window.clearTimeout(timerId);
        element.classList.remove(SCROLL_ACTIVE_CLASS);
      });
      activeTimers.clear();
    };
  }, []);

  return null;
};
