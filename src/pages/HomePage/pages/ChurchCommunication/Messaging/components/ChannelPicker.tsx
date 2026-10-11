import type { MessageChannels } from "@/utils/api/messaging/interfaces";

const OPTIONS: { key: keyof MessageChannels; label: string; hint: string }[] = [
  { key: "sms", label: "SMS", hint: "Text message to their phone" },
  { key: "email", label: "Email", hint: "Email to their address" },
  { key: "inApp", label: "In-app", hint: "App inbox and push notification" },
];

interface ChannelPickerProps {
  value: MessageChannels;
  onChange: (value: MessageChannels) => void;
  disabled?: boolean;
  /** Channels that cannot reach this audience (e.g. in-app for visitors). */
  unavailable?: Partial<Record<keyof MessageChannels, string>>;
}

export const ChannelPicker = ({
  value,
  onChange,
  disabled,
  unavailable,
}: ChannelPickerProps) => (
  <fieldset className="space-y-2">
    <legend className="text-sm font-medium text-primary">Send by</legend>
    <div className="flex flex-wrap gap-4">
      {OPTIONS.map((option) => (
        <label
          key={option.key}
          className="flex items-start gap-2 text-sm"
          title={unavailable?.[option.key] ?? option.hint}
        >
          <input
            type="checkbox"
            checked={value[option.key]}
            disabled={disabled}
            onChange={(e) =>
              onChange({ ...value, [option.key]: e.target.checked })
            }
            className="mt-0.5"
          />
          <span>
            {option.label}
            {unavailable?.[option.key] && value[option.key] && (
              <span className="block text-xs text-gray-500">
                {unavailable[option.key]}
              </span>
            )}
          </span>
        </label>
      ))}
    </div>
  </fieldset>
);
