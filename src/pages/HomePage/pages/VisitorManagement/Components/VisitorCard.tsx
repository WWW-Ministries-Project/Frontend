import {
  ActionMenu,
  ActionMenuItem,
  Pill,
  UiButton,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import {
  formatDate,
  plural,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUiUtils";

import { STAGE_PILL, VisitorRecord } from "../utils/visitorHelpers";

export const VisitorCard = ({
  record,
  onOpen,
  actions,
}: {
  record: VisitorRecord;
  onOpen: () => void;
  actions: ActionMenuItem[];
}) => {
  const stage = STAGE_PILL[record.stage];
  const facts = [
    { label: "Phone", value: record.phone },
    { label: "Event", value: record.eventName || "—" },
    {
      label: "Last follow-up",
      value: record.lastFollowUp ? formatDate(record.lastFollowUp) : "None yet",
    },
  ];

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-lightGray bg-white p-4 shadow-[0_8px_24px_rgb(var(--color-shadow)_/_0.08)] transition-shadow hover:shadow-[0_10px_28px_rgb(var(--color-shadow)_/_0.2)]">
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-lightGray bg-lightGray text-lg font-semibold text-primary/70">
          {record.initials}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <button
            type="button"
            onClick={onOpen}
            className="overflow-hidden text-ellipsis whitespace-nowrap bg-transparent p-0 text-left text-lg font-semibold leading-7 text-primary"
          >
            {record.name}
          </button>
          <p className="text-sm text-gray-600">Last visit {formatDate(record.lastVisit)}</p>
        </div>
        <ActionMenu items={actions} ariaLabel="Visitor actions" />
      </div>
      <dl className="flex flex-col gap-2">
        {facts.map((fact) => (
          <div key={fact.label} className="grid grid-cols-[120px_minmax(0,1fr)] gap-2 text-sm">
            <dt className="text-gray-600">{fact.label}</dt>
            <dd className="overflow-hidden text-ellipsis whitespace-nowrap text-primary">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-2">
        <Pill tone="neutral">{plural(record.visitCount, "visit")}</Pill>
        <Pill tone={stage.tone}>{stage.label}</Pill>
      </div>
      <UiButton className="mt-auto w-full" onClick={onOpen}>
        View full profile
      </UiButton>
    </article>
  );
};
