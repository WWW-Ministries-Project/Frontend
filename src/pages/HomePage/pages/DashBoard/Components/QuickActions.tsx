import { relativePath } from "@/utils/const";
import { useNavigate } from "react-router-dom";

type QuickAction = { label: string; desc?: string; to?: string };

const ACTIONS: QuickAction[] = [
  { label: "Book an appointment", to: relativePath.member.appointments },
  { label: "Join a Life Center", to: relativePath.member.lifeCenter },
  { label: "Browse Market Place", to: relativePath.member.market },
  { label: "Give", desc: "Coming soon" },
  { label: "Redeem pledge", desc: "Coming soon" },
];

export const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col gap-1 rounded-2xl border border-[#E5E7EB] bg-white p-6">
      <h3 className="mb-2 text-lg font-semibold leading-7 text-[#080D2D]">Quick actions</h3>
      {ACTIONS.map((action) => (
        <button
          key={action.label}
          type="button"
          disabled={!action.to}
          onClick={() => action.to && navigate(action.to)}
          className="-mx-3 flex min-h-[44px] items-center justify-between gap-3 rounded-lg px-3 text-left hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-sm font-semibold text-[#080D2D]">{action.label}</span>
          {action.desc && <span className="text-xs text-[#6B7280]">{action.desc}</span>}
        </button>
      ))}
    </section>
  );
};
