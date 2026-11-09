// Animated floating AI-bot that launches the Assistant drawer.
// Ported from the "AI bot" artboard: floating robot with blinking eyes,
// pulsing antenna, expanding ring, soft shadow, and a periodic tooltip.
// Honors prefers-reduced-motion.
//
// The bot is draggable: the user can pick it up and drop it anywhere on screen.
// Its position is clamped to the viewport and remembered per browser via
// localStorage. A drag never counts as a click, so moving it does not open the
// drawer.

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

const LAUNCHER_STYLES = `
.wwm-bot-btn{position:relative;display:flex;align-items:flex-end;justify-content:center;width:72px;height:88px;padding:0;border:none;border-radius:999px;background:transparent;cursor:grab;pointer-events:auto;touch-action:none}
.wwm-bot-btn.wwm-bot-dragging{cursor:grabbing}
.wwm-bot-btn:focus-visible{outline:none;box-shadow:0 0 0 4px rgb(var(--color-primary)/0.08)}
.wwm-bot-float{position:absolute;left:4px;top:0;width:64px;height:64px;animation:wwmBotFloat 3.2s ease-in-out infinite;transition:transform .2s ease}
.wwm-bot-btn:hover .wwm-bot-float{animation-duration:1.4s}
.wwm-bot-btn:active .wwm-bot-float{transform:scale(.94)}
.wwm-bot-btn.wwm-bot-dragging .wwm-bot-float{animation:none;transform:scale(1.05)}
.wwm-bot-eye{transform-box:fill-box;transform-origin:center;animation:wwmBotBlink 4.5s infinite}
.wwm-bot-ant{transform-box:fill-box;transform-origin:center;animation:wwmBotAnt 1.6s ease-in-out infinite}
.wwm-bot-ring{position:absolute;left:8px;top:4px;width:56px;height:56px;border:2px solid rgb(var(--color-primary)/0.25);border-radius:999px;animation:wwmBotRing 2.8s ease-out infinite}
.wwm-bot-shadow{position:absolute;left:18px;bottom:4px;width:36px;height:8px;border-radius:999px;background:rgb(var(--color-primary)/0.25);animation:wwmBotShadow 3.2s ease-in-out infinite}
.wwm-bot-tip{opacity:0;transform-origin:bottom right;animation:wwmBotTip 14s ease-in-out 3s infinite}
@keyframes wwmBotFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes wwmBotBlink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(0.1)}}
@keyframes wwmBotAnt{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(1.35)}}
@keyframes wwmBotRing{0%{transform:scale(.8);opacity:.5}80%,100%{transform:scale(1.4);opacity:0}}
@keyframes wwmBotShadow{0%,100%{transform:scaleX(1);opacity:.25}50%{transform:scaleX(.75);opacity:.12}}
@keyframes wwmBotTip{0%{opacity:0;transform:translateY(6px) scale(.96)}4%,28%{opacity:1;transform:none}32%,100%{opacity:0;transform:translateY(6px) scale(.96)}}
@media (prefers-reduced-motion:reduce){.wwm-bot-float,.wwm-bot-eye,.wwm-bot-ant,.wwm-bot-ring,.wwm-bot-shadow,.wwm-bot-tip{animation:none!important}}
`;

const POS_STORAGE_KEY = "wwm-assistant-pos";
// Fallback offsets (match the old fixed bottom-6 right-6 position).
const EDGE_GAP = 24;
// Footprint used for viewport clamping (button is 72×88).
const BOT_W = 72;
const BOT_H = 88;
// Pointer travel (px) past which a press is treated as a drag, not a click.
const DRAG_THRESHOLD = 4;

type Pos = { x: number; y: number };

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const clampToViewport = (pos: Pos): Pos => ({
  x: clamp(pos.x, EDGE_GAP, Math.max(EDGE_GAP, window.innerWidth - BOT_W - EDGE_GAP)),
  y: clamp(pos.y, EDGE_GAP, Math.max(EDGE_GAP, window.innerHeight - BOT_H - EDGE_GAP)),
});

const readStoredPos = (): Pos | null => {
  try {
    const raw = localStorage.getItem(POS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
      return clampToViewport(parsed);
    }
  } catch {
    /* ignore corrupt/unavailable storage */
  }
  return null;
};

const storePos = (pos: Pos) => {
  try {
    localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(pos));
  } catch {
    /* storage may be unavailable (private mode) — position just won't persist */
  }
};

interface AssistantLauncherProps {
  taskCount: number;
  onOpen: () => void;
  hidden?: boolean;
}

export const AssistantLauncher = ({ taskCount, onOpen, hidden }: AssistantLauncherProps) => {
  const [pos, setPos] = useState<Pos | null>(null);
  const [dragging, setDragging] = useState(false);

  // Drag bookkeeping that must not trigger re-renders.
  const grabOffset = useRef<Pos>({ x: 0, y: 0 });
  const startPoint = useRef<Pos>({ x: 0, y: 0 });
  const movedRef = useRef(false);

  // Restore the saved position once mounted (localStorage is client-only).
  useEffect(() => {
    const stored = readStoredPos();
    if (stored) setPos(stored);
  }, []);

  // Keep the bot on-screen if the window is resized smaller.
  useEffect(() => {
    const onResize = () => setPos((prev) => (prev ? clampToViewport(prev) : prev));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    // Only the primary button / touch / pen starts a drag.
    if (event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    grabOffset.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    startPoint.current = { x: event.clientX, y: event.clientY };
    movedRef.current = false;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (!dragging) return;
      const dx = event.clientX - startPoint.current.x;
      const dy = event.clientY - startPoint.current.y;
      if (!movedRef.current && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      movedRef.current = true;
      setPos(
        clampToViewport({
          x: event.clientX - grabOffset.current.x,
          y: event.clientY - grabOffset.current.y,
        }),
      );
    },
    [dragging],
  );

  const endDrag = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragging) return;
    setDragging(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* pointer already released */
    }
    if (movedRef.current) {
      setPos((prev) => {
        if (prev) storePos(prev);
        return prev;
      });
    }
  }, [dragging]);

  const handleClick = useCallback(() => {
    // Swallow the click that ends a drag so moving the bot never opens it.
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }
    onOpen();
  }, [onOpen]);

  if (hidden) return null;

  // Default (unmoved) sits bottom-right via classes; once moved it is driven by
  // explicit left/top so it can live anywhere.
  const positioned = pos !== null;
  const containerStyle: CSSProperties | undefined = positioned
    ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" }
    : undefined;

  return (
    <div
      data-screen-label="AI bot"
      style={containerStyle}
      className={
        positioned
          ? "pointer-events-none fixed z-[100] flex flex-col items-end gap-2"
          : "pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2"
      }
    >
      <style>{LAUNCHER_STYLES}</style>
      <div
        className="wwm-bot-tip relative mr-1 whitespace-nowrap rounded-xl border border-lightGray bg-white px-3 py-2 text-sm font-medium leading-5 text-primary shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_24px_rgb(var(--color-primary)/0.08)]"
        aria-hidden="true"
      >
        Hi! Need a hand?
        <span className="absolute -bottom-1.5 right-[26px] h-2.5 w-2.5 rotate-45 border-b border-r border-lightGray bg-white" />
      </div>
      <button
        type="button"
        className={dragging ? "wwm-bot-btn wwm-bot-dragging" : "wwm-bot-btn"}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        aria-label="Ask the AI assistant (drag to move)"
        title="Ask the AI assistant — drag to move"
      >
        <span className="wwm-bot-ring" aria-hidden="true" />
        <span className="wwm-bot-shadow" aria-hidden="true" />
        <span className="wwm-bot-float">
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            aria-hidden="true"
            style={{ display: "block", filter: "drop-shadow(0 8px 12px rgb(var(--color-primary)/0.25))" }}
          >
            <line x1="32" y1="7" x2="32" y2="15" stroke="rgb(var(--color-primary))" strokeWidth="2.5" strokeLinecap="round" />
            <circle className="wwm-bot-ant" cx="32" cy="6" r="3.5" fill="rgb(var(--color-secondary))" />
            <rect x="4" y="26" width="7" height="12" rx="3.5" fill="rgb(var(--color-primary))" />
            <rect x="53" y="26" width="7" height="12" rx="3.5" fill="rgb(var(--color-primary))" />
            <rect x="9" y="14" width="46" height="36" rx="13" fill="rgb(var(--color-primary))" />
            <rect x="14" y="19" width="36" height="26" rx="9" fill="rgb(var(--color-white))" />
            <ellipse className="wwm-bot-eye" cx="24.5" cy="30" rx="3.2" ry="4.2" fill="rgb(var(--color-primary))" />
            <ellipse className="wwm-bot-eye" cx="39.5" cy="30" rx="3.2" ry="4.2" fill="rgb(var(--color-primary))" />
            <path d="M26.5 37.5 Q32 42 37.5 37.5" stroke="rgb(var(--color-primary))" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <rect x="22" y="52" width="20" height="8" rx="4" fill="rgb(var(--color-primary))" />
          </svg>
        </span>
        {taskCount > 0 ? (
          <span className="absolute right-0 top-0 min-w-[20px] rounded-full border-2 border-white bg-red-700 px-1.5 text-center text-xs font-semibold leading-5 text-white">
            {taskCount > 99 ? "99+" : taskCount}
          </span>
        ) : null}
      </button>
    </div>
  );
};
