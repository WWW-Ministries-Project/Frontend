import { useEffect, useState } from "react";
import { api } from "@/utils/api/apiCalls";
import type {
  MessageTemplate,
  MessagingSettings,
  TemplateStats,
  UpcomingBirthday,
} from "@/utils/api/messaging/interfaces";
import { TemplateCard } from "./TemplateCard";

interface BirthdayTabProps {
  template: MessageTemplate | undefined;
  settings: MessagingSettings | null;
  stats: TemplateStats | null;
  canManage: boolean;
  onOpenSettings: () => void;
  onDirtyChange: (key: string, dirty: boolean) => void;
  onSaved: () => void;
}

const formatDay = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

export const BirthdayTab = ({ template, settings, stats, canManage, onOpenSettings, onDirtyChange, onSaved }: BirthdayTabProps) => {
  const [upcoming, setUpcoming] = useState<UpcomingBirthday[]>([]);

  // Plain fetch (not useFetch): useFetch toggles the full-screen loader.
  useEffect(() => {
    let cancelled = false;
    api.fetch
      .fetchUpcomingBirthdays({ days: 7 })
      .then((response) => {
        if (!cancelled) setUpcoming(response.data ?? []);
      })
      .catch(() => {
        // The list is informational; the template card still works.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Sends daily at <strong>{settings?.birthday_send_time ?? "07:00"}</strong> ({settings?.timezone ?? "Africa/Accra"}) to members and guests with a date of birth on file.{" "}
        <button type="button" className="text-primary underline" onClick={onOpenSettings}>Change time</button>
      </p>
      {template && (
        <TemplateCard template={template} stats={stats?.BIRTHDAY} canManage={canManage}
          title="Birthday message" description="People born on 29 February get theirs on 28 February in non-leap years."
          onDirtyChange={onDirtyChange} onSaved={onSaved} />
      )}
      <section className="rounded-xl border border-lightGray bg-white p-5">
        <h3 className="mb-3 text-base font-semibold text-primary">Upcoming birthdays (next 7 days)</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-500">No birthdays in the next 7 days.</p>
        ) : (
          <ul className="divide-y divide-lightGray text-sm">
            {upcoming.map((b) => (
              <li key={`${b.userId}-${b.date}`} className="flex justify-between py-2">
                <span>{b.name}</span>
                <span className="text-gray-500">{formatDay(b.date)}{b.age ? ` · turning ${b.age}` : ""}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
