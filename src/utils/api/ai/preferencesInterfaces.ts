// Per-user assistant reminder preferences. Mirrors /ai/preferences.
export interface AiPreferences {
  brief: boolean;
  nudges: boolean;
  quiet: boolean;
  emailCopy: boolean;
  approvalAfter: string;
  reportLead: string;
  visitorAfter: string;
}

export type AiPreferencesPatch = Partial<AiPreferences>;
