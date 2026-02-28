export type AiRole = "user" | "assistant" | "system";
export type AiProvider = "openai" | "gemini";
export type AiUsageInterval = "day" | "week" | "month";

export interface AiChatRequest {
  message: string;
  model: string;
  conversation_id?: string;
  context?: {
    module?: string;
    scope?: string;
    reference_id?: string;
    [key: string]: unknown;
  };
}

export interface AiCredentialRecord {
  id: string;
  provider: AiProvider;
  is_active: boolean;
  has_secret: boolean;
  created_by?: number;
  rotated_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAiCredentialPayload {
  provider: AiProvider;
  api_key: string;
  api_secret?: string | null;
  is_active?: boolean;
}

export interface UpdateAiCredentialPayload {
  api_key?: string;
  api_secret?: string | null;
  is_active?: boolean;
}

export interface AiUsageSnapshot {
  period_start?: string;
  period_end?: string;
  message_limit?: number;
  message_used?: number;
  message_remaining?: number;
  token_limit?: number;
  token_used?: number;
  token_remaining?: number;
}

export interface AiChatResponse {
  conversation_id: string;
  message_id?: string;
  role?: AiRole;
  reply: string;
  created_at?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  usage_snapshot?: AiUsageSnapshot;
}

export interface AiUsageSummary extends AiUsageSnapshot {
  model?: string;
  updated_at?: string;
  message_window?: "daily" | "weekly" | "monthly" | string;
  token_window?: "daily" | "weekly" | "monthly" | string;
}

export interface AiUsageHistoryPoint {
  date: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  message_count?: number;
  cost_estimate?: number;
}

export interface AiUsageHistoryResponse {
  from: string;
  to: string;
  interval: AiUsageInterval | string;
  points: AiUsageHistoryPoint[];
}

export interface AiInsightsRequest {
  model: string;
  message?: string;
  context?: AiChatRequest["context"];
}

export interface AiInsightResponse extends AiChatResponse {
  module: string;
}
