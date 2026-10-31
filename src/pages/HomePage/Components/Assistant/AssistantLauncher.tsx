// Animated floating AI-bot that launches the Assistant drawer.
// Ported from the "AI bot" artboard: floating robot with blinking eyes,
// pulsing antenna, expanding ring, soft shadow, and a periodic tooltip.
// Honors prefers-reduced-motion.

const LAUNCHER_STYLES = `
.wwm-bot-btn{position:relative;display:flex;align-items:flex-end;justify-content:center;width:72px;height:88px;padding:0;border:none;border-radius:999px;background:transparent;cursor:pointer;pointer-events:auto}
.wwm-bot-btn:focus-visible{outline:none;box-shadow:0 0 0 4px rgba(8,13,45,0.08)}
.wwm-bot-float{position:absolute;left:4px;top:0;width:64px;height:64px;animation:wwmBotFloat 3.2s ease-in-out infinite;transition:transform .2s ease}
.wwm-bot-btn:hover .wwm-bot-float{animation-duration:1.4s}
.wwm-bot-btn:active .wwm-bot-float{transform:scale(.94)}
.wwm-bot-eye{transform-box:fill-box;transform-origin:center;animation:wwmBotBlink 4.5s infinite}
.wwm-bot-ant{transform-box:fill-box;transform-origin:center;animation:wwmBotAnt 1.6s ease-in-out infinite}
.wwm-bot-ring{position:absolute;left:8px;top:4px;width:56px;height:56px;border:2px solid rgba(8,13,45,0.25);border-radius:999px;animation:wwmBotRing 2.8s ease-out infinite}
.wwm-bot-shadow{position:absolute;left:18px;bottom:4px;width:36px;height:8px;border-radius:999px;background:rgba(8,13,45,0.25);animation:wwmBotShadow 3.2s ease-in-out infinite}
.wwm-bot-tip{opacity:0;transform-origin:bottom right;animation:wwmBotTip 14s ease-in-out 3s infinite}
@keyframes wwmBotFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes wwmBotBlink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(0.1)}}
@keyframes wwmBotAnt{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(1.35)}}
@keyframes wwmBotRing{0%{transform:scale(.8);opacity:.5}80%,100%{transform:scale(1.4);opacity:0}}
@keyframes wwmBotShadow{0%,100%{transform:scaleX(1);opacity:.25}50%{transform:scaleX(.75);opacity:.12}}
@keyframes wwmBotTip{0%{opacity:0;transform:translateY(6px) scale(.96)}4%,28%{opacity:1;transform:none}32%,100%{opacity:0;transform:translateY(6px) scale(.96)}}
@media (prefers-reduced-motion:reduce){.wwm-bot-float,.wwm-bot-eye,.wwm-bot-ant,.wwm-bot-ring,.wwm-bot-shadow,.wwm-bot-tip{animation:none!important}}
`;

interface AssistantLauncherProps {
  taskCount: number;
  onOpen: () => void;
  hidden?: boolean;
}

export const AssistantLauncher = ({ taskCount, onOpen, hidden }: AssistantLauncherProps) => {
  if (hidden) return null;

  return (
    <div
      data-screen-label="AI bot"
      className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2"
    >
      <style>{LAUNCHER_STYLES}</style>
      <div
        className="wwm-bot-tip relative mr-1 whitespace-nowrap rounded-xl border border-[#D8DAE5] bg-white px-3 py-2 text-sm font-medium leading-5 text-[#080D2D] shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_24px_rgba(8,13,45,0.08)]"
        aria-hidden="true"
      >
        Hi! Need a hand?
        <span className="absolute -bottom-1.5 right-[26px] h-2.5 w-2.5 rotate-45 border-b border-r border-[#D8DAE5] bg-white" />
      </div>
      <button
        type="button"
        className="wwm-bot-btn"
        onClick={onOpen}
        aria-label="Ask the AI assistant"
        title="Ask the AI assistant"
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
            style={{ display: "block", filter: "drop-shadow(0 8px 12px rgba(8,13,45,0.25))" }}
          >
            <line x1="32" y1="7" x2="32" y2="15" stroke="#080D2D" strokeWidth="2.5" strokeLinecap="round" />
            <circle className="wwm-bot-ant" cx="32" cy="6" r="3.5" fill="#9A5D1A" />
            <rect x="4" y="26" width="7" height="12" rx="3.5" fill="#080D2D" />
            <rect x="53" y="26" width="7" height="12" rx="3.5" fill="#080D2D" />
            <rect x="9" y="14" width="46" height="36" rx="13" fill="#080D2D" />
            <rect x="14" y="19" width="36" height="26" rx="9" fill="#fff" />
            <ellipse className="wwm-bot-eye" cx="24.5" cy="30" rx="3.2" ry="4.2" fill="#080D2D" />
            <ellipse className="wwm-bot-eye" cx="39.5" cy="30" rx="3.2" ry="4.2" fill="#080D2D" />
            <path d="M26.5 37.5 Q32 42 37.5 37.5" stroke="#080D2D" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <rect x="22" y="52" width="20" height="8" rx="4" fill="#080D2D" />
          </svg>
        </span>
        {taskCount > 0 ? (
          <span className="absolute right-0 top-0 min-w-[20px] rounded-full border-2 border-white bg-[#B91C1C] px-1.5 text-center text-xs font-semibold leading-5 text-white">
            {taskCount > 99 ? "99+" : taskCount}
          </span>
        ) : null}
      </button>
    </div>
  );
};
