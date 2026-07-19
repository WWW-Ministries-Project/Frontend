import { relativePath } from "@/utils";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { JoinDepartmentModal } from "./JoinDepartmentModal";

type QuickAction = {
  key: string;
  label: string;
  description: string;
  icon: string;
  onClick?: () => void;
  disabled?: boolean;
};

export const QuickActions = () => {
  const navigate = useNavigate();
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  const actions: QuickAction[] = [
    {
      key: "give",
      label: "Give",
      description: "Coming soon",
      icon: "💝",
      disabled: true,
    },
    {
      key: "redeem-pledge",
      label: "Redeem Pledge",
      description: "Coming soon",
      icon: "🤝",
      disabled: true,
    },
    {
      key: "join-department",
      label: "Join a Department",
      description: "Request to serve",
      icon: "👥",
      onClick: () => setIsJoinOpen(true),
    },
    {
      key: "view-learning",
      label: "View My Learning",
      description: "Enrolled programs",
      icon: "🎓",
      onClick: () =>
        navigate(
          `/member/${relativePath.member.schoolOfMinistries.myEnrolledPrograms}`
        ),
    },
    {
      key: "book-appointment",
      label: "Book an Appointment",
      description: "Schedule a session",
      icon: "📅",
      onClick: () => navigate(relativePath.member.appointments),
    },
  ];

  return (
    <div className="rounded-xl bg-gradient-to-br from-blue-900 to-purple-900 p-6 text-white">
      <h3 className="mb-4 text-xl font-semibold">Quick Actions</h3>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className={`flex flex-col items-start gap-1 rounded-xl border border-white/15 bg-white/10 p-4 text-left transition ${
              action.disabled
                ? "cursor-not-allowed opacity-50"
                : "hover:border-white/40 hover:bg-white/20"
            }`}
          >
            <span className="text-2xl" aria-hidden>
              {action.icon}
            </span>
            <span className="text-sm font-semibold leading-tight">
              {action.label}
            </span>
            <span className="text-xs text-blue-100/80">
              {action.description}
            </span>
          </button>
        ))}
      </div>

      <JoinDepartmentModal
        open={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
      />
    </div>
  );
};
