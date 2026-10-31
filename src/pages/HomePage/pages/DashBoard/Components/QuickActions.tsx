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
    <section className="flex flex-col gap-1 rounded-2xl border border-gray-200 bg-white p-6">
      <h3 className="mb-2 text-lg font-semibold leading-7 text-primary">Quick actions</h3>
      {ACTIONS.map((action) => (
        <button
          key={action.label}
          type="button"
          disabled={!action.to}
          onClick={() => action.to && navigate(action.to)}
          className="-mx-3 flex min-h-[44px] items-center justify-between gap-3 rounded-lg px-3 text-left hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-sm font-semibold text-primary">{action.label}</span>
          {action.desc && <span className="text-xs text-gray-500">{action.desc}</span>}
        </button>
      ))}
    </section>
  );
};
