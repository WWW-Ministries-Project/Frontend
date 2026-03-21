export type AiRole = "user" | "assistant" | "system";
export type AiProvider = "openai" | "gemini" | "claude";
export type AiUsageInterval = "day" | "week" | "month";

export interface AiChatContext {
  module?: string;
  scope?: string;
  reference_id?: string;
  [key: string]: unknown;
}

export interface AiChatRequest {
  message: string;
  model: string;
  conversation_id?: string;
  context?: AiChatContext;
}

export interface AiChatbotRequest {
  message: string;
  model?: string;
  conversation_id?: string;
  context?: AiChatContext;
}

export interface AiChatbotModelOption {
  provider: AiProvider;
  model: string;
  label: string;
}

export interface AiChatbotConfig {
  enabled: boolean;
  default_model?: string | null;
  provider?: AiProvider | null;
  available_models?: AiChatbotModelOption[];
  default_context?: AiChatContext;
  welcome_message?: string;
  suggested_prompts?: string[];
  unavailable_reason?: string | null;
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

export interface AiDisplayTable {
  columns: string[];
  rows: string[][];
}

export type AiDisplayBlock =
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "list";
      items: string[];
    }
  | {
      type: "table";
      columns: string[];
      rows: string[][];
    };

export interface AiDisplaySection {
  heading: string;
  blocks: AiDisplayBlock[];
  paragraphs: string[];
  items: string[];
  tables: AiDisplayTable[];
}

export interface AiDisplay {
  format?: "structured_markdown_v1" | string;
  title?: string | null;
  summary?: string | null;
  sections: AiDisplaySection[];
  markdown?: string;
  plain_text?: string;
}

export interface AiResponsePerformance {
  latency_ms?: number;
}

export interface AiChatResponse {
  conversation_id: string;
  message_id?: string;
  role?: AiRole;
  reply: string;
  display?: AiDisplay;
  provider?: AiProvider;
  model?: string;
  fallback_used?: boolean;
  fallback_reason?: string;
  created_at?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  usage_snapshot?: AiUsageSnapshot;
  performance?: AiResponsePerformance;
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
  context?: AiChatContext;
}

export interface AiInsightResponse extends AiChatResponse {
  module: string;
}
