import {
  MemberStatusPill,
  UiButton,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { cn } from "@/utils/cn";

import type { JourneyStep } from "./profileHelpers";

export const MembershipJourneyCard = ({
  member,
  steps,
  nextLabel,
  onAdvance,
  busy,
}: {
  member: { is_active?: boolean | null; status?: string | null };
  steps: JourneyStep[];
  /** Label for the primary action; omitted when there is no next step to take. */
  nextLabel?: string;
  onAdvance: () => void;
  busy?: boolean;
}) => (
  <section className="flex flex-col gap-4 rounded-xl border border-lightGray bg-white p-6 shadow-[0_8px_24px_rgba(8,13,45,0.08)]">
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-base font-semibold text-primary">Membership journey</h2>
      <MemberStatusPill member={member} />
    </div>
    <ol className="m-0 flex list-none flex-col p-0">
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        const nextDone = !last && steps[index + 1].done;
        return (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  step.done
                    ? "border-primary bg-primary text-white"
                    : "border-lightGray bg-white text-[#4B5563]"
                )}
                aria-hidden="true"
              >
                {step.done && !step.current ? "✓" : index + 1}
              </span>
              <span
                className={cn(
                  "min-h-4 w-0.5 flex-1",
                  last ? "bg-transparent" : nextDone ? "bg-primary" : "bg-[#E5E7EB]"
                )}
              />
            </div>
            <div className="min-w-0 pb-4">
              <p
                className={cn(
                  "text-sm",
                  step.current ? "font-semibold" : "font-medium",
                  step.done ? "text-primary" : "text-[#6B7280]"
                )}
              >
                {step.label}
                {step.current && <span className="sr-only"> (current stage)</span>}
              </p>
              <p className="text-xs text-[#6B7280]">{step.sub}</p>
            </div>
          </li>
        );
      })}
    </ol>
    {nextLabel && (
      <UiButton tone="primary" onClick={onAdvance} disabled={busy}>
        {nextLabel}
      </UiButton>
    )}
  </section>
);

export const AtAGlanceCard = ({ rows }: { rows: [string, string][] }) => (
  <section className="flex flex-col gap-3 rounded-xl border border-lightGray bg-white p-6">
    <h2 className="text-base font-semibold text-primary">At a glance</h2>
    {rows.map(([label, value]) => (
      <div key={label} className="flex justify-between gap-3 text-sm">
        <span className="text-[#4B5563]">{label}</span>
        <span className="text-right font-semibold text-primary">{value || "—"}</span>
      </div>
    ))}
  </section>
);
