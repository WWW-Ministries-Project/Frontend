import type {
  MessageTemplate,
  MessageTemplateKey,
  MessagingSettings,
  TemplateStats,
} from "@/utils/api/messaging/interfaces";
import { TemplateCard } from "./TemplateCard";

const SET_PASSWORD_NOTE =
  "New app sign-ups always also get the account email with their set-password link.";

interface WelcomeTabProps {
  templates: MessageTemplate[];
  settings: MessagingSettings | null;
  stats: TemplateStats | null;
  canManage: boolean;
  onOpenSettings: () => void;
  onDirtyChange: (key: string, dirty: boolean) => void;
  onSaved: () => void;
}

export const WelcomeTab = ({ templates, settings, stats, canManage, onOpenSettings, onDirtyChange, onSaved }: WelcomeTabProps) => {
  const byKey: Partial<Record<MessageTemplateKey, MessageTemplate>> = Object.fromEntries(
    templates.map((t) => [t.key, t])
  );
  const storeLinksMissing = !settings?.app_store_url && !settings?.play_store_url;
  const common = { canManage, onDirtyChange, onSaved };
  const member = byKey.WELCOME_MEMBER;
  const guest = byKey.WELCOME_GUEST;
  const visitor = byKey.WELCOME_VISITOR;

  return (
    <div className="space-y-6">
      {member && (
        <TemplateCard {...common} template={member} stats={stats?.WELCOME_MEMBER}
          title="Member sign-up" description="Sent when someone joins as a member in the mobile app."
          channelNote={SET_PASSWORD_NOTE} />
      )}
      {guest && (
        <TemplateCard {...common} template={guest} stats={stats?.WELCOME_GUEST}
          title="Guest sign-up" description="Sent when someone joins as a guest in the mobile app."
          channelNote={SET_PASSWORD_NOTE} />
      )}
      {visitor && (
        <TemplateCard {...common} template={visitor} stats={stats?.WELCOME_VISITOR}
          title="Visitor added" description="Sent when a visitor who agreed to be contacted is added."
          allowAppLink storeLinksMissing={storeLinksMissing} onOpenSettings={onOpenSettings} />
      )}
    </div>
  );
};
