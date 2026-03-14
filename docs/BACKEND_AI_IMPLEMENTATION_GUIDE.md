# Backend AI Implementation Guide (Production Standard)

This document defines the backend architecture, API contracts, reliability controls, and usage-tracking model required to support AI features in production.

## 1. Architecture Blueprint

Recommended services:

1. `ai-gateway` (HTTP API)
- authn/authz, quota checks, request validation, response shaping.

2. `ai-orchestrator`
- prompt templates, model routing, retrieval orchestration, fallback logic.

3. `ai-usage-service`
- token/message metering, quota tracking, budget enforcement.

4. `ai-policy-service`
- content policy checks, prompt injection defenses, sensitive-data rules.

5. `ai-worker` (async jobs)
- scheduled insights, report generation, heavy summarization tasks.

6. `ai-observability`
- centralized logging, tracing, model latency/cost metrics.

Core dependencies:
- relational DB (usage, audit, conversations, policies),
- cache (Redis) for rate limits and hot usage counters,
- queue (BullMQ/SQS/RabbitMQ) for long-running jobs,
- vector store (optional phase 2+) for retrieval augmented generation (RAG).

---

## 1.1 Deployment Scope (Current)

Current assumption: single-organization deployment (no tenant partitioning yet).

- Keep schema and APIs single-scope for now.
- If multi-organization support is added later, introduce `organization_id` across usage, conversations, and audit tables via backward-compatible migration.

---

## 2. Security and Access Control

Enforce all items below before production launch:

1. RBAC
- `admin`-only access for `/ai/*` admin endpoints.
- reject unauthorized requests with `403`.

2. Scope isolation (single-organization mode)
- enforce role-based and data-domain boundaries (admin vs member, finance vs general modules).
- ensure prompts only include records the current user is allowed to access.

3. Secret management
- model API keys in a secret manager (not `.env` committed in repo).
- key rotation policy and access audit.

4. Data safety
- redact PII/highly sensitive fields before model requests.
- keep raw prompts/responses encrypted at rest when persisted.

5. Audit trail
- log actor id, endpoint, prompt hash, model id, usage, and action outcome.

---

## 3. API Contract

Primary route family: `/ai/*`  
Compatibility aliases: `/api/v1/ai/*`

Use one route family consistently in frontend config.

## 3.0 Credentials endpoints

- `GET /ai/credentials?provider=openai|gemini|claude`
- `POST /ai/credentials`
- `PUT /ai/credentials/{id}`

## 3.1 Chat endpoint

`POST /ai/chat`

Request:

```json
{
  "message": "Summarize visitor follow-up risk for this week",
  "model": "claude-sonnet-4-6",
  "conversation_id": "optional-uuid",
  "context": {
    "module": "visitors",
    "scope": "admin",
    "reference_id": "optional"
  }
}
```

Response:

```json
{
  "data": {
    "conversation_id": "uuid",
    "message_id": "uuid",
    "reply": "Here are the highest-risk visitors...",
    "created_at": "2026-02-28T08:30:00.000Z",
    "provider": "claude",
    "model": "claude-sonnet-4-6",
    "fallback_used": false,
    "usage": {
      "prompt_tokens": 640,
      "completion_tokens": 372,
      "total_tokens": 1012
    },
    "usage_snapshot": {
      "message_limit": 5000,
      "message_used": 1234,
      "message_remaining": 3766,
      "token_limit": 5000000,
      "token_used": 1865000,
      "token_remaining": 3135000
    }
  }
}
```

## 3.2 Usage summary endpoint

`GET /ai/usage-summary`

Response:

```json
{
  "data": {
    "period_start": "2026-02-01T00:00:00.000Z",
    "period_end": "2026-02-28T23:59:59.999Z",
    "message_window": "monthly",
    "token_window": "monthly",
    "message_limit": 5000,
    "message_used": 1234,
    "message_remaining": 3766,
    "token_limit": 5000000,
    "token_used": 1865000,
    "token_remaining": 3135000,
    "updated_at": "2026-02-28T08:30:00.000Z"
  }
}
```

## 3.3 Usage history endpoint

`GET /ai/usage-history?from=YYYY-MM-DD&to=YYYY-MM-DD&interval=day`

Use for admin analytics charts and anomaly monitoring.

## 3.4 Optional insights endpoint

`POST /ai/insights/{module}`

Use for deterministic AI jobs per module (e.g., attendance insights, requisition risks).
Send `model` in request body for insights as well.

Provider routing is model-based:
- `gpt-*` and `o*` route to OpenAI
- `claude-*` route to Claude
- `gemini-*` route to Gemini

---

## 4. Usage Tracking Model (Messages/Tokens/Remaining)

Track at three levels:

1. request-level usage
- stored per AI message completion.

2. application aggregate usage
- counters used for quotas, budgeting, and billing.

3. model-level usage
- cost attribution by model/provider.

Required tracked fields:

- `prompt_tokens`
- `completion_tokens`
- `total_tokens`
- `message_count` (1 per successful assistant response)
- `cost_estimate` (based on model pricing table)
- `remaining_messages` and `remaining_tokens`

Enforcement flow:

1. pre-check quota before calling model provider,
2. reserve soft budget in Redis (to prevent race overrun),
3. call model,
4. commit exact usage to DB + counters,
5. release/adjust reservation.

If quota exceeded:
- return `429` with current remaining values and reset timestamp.

---

## 5. Suggested Database Tables

1. `ai_conversations`
- `id`, `created_by`, `title`, `status`, `created_at`, `updated_at`.

2. `ai_messages`
- `id`, `conversation_id`, `role`, `content`, `model`, `created_at`.

3. `ai_usage_ledger`
- `id`, `conversation_id`, `message_id`,
- `prompt_tokens`, `completion_tokens`, `total_tokens`,
- `message_count`, `cost_estimate`, `provider`, `model`, `created_at`.

4. `ai_usage_quota`
- `period_start`, `period_end`,
- `message_limit`, `token_limit`,
- `message_used`, `token_used`,
- `updated_at`.

5. `ai_pricing_catalog`
- `provider`, `model`, `input_token_cost`, `output_token_cost`, `effective_from`.

6. `ai_audit_log`
- `id`, `actor_id`, `action`, `resource`, `metadata`, `created_at`.

Indexes:
- `(created_at)` on ledger and messages,
- `(period_start, period_end)` on quota.

---

## 6. Reliability, Performance, and Failure Handling

1. Timeouts and retries
- provider timeout: 20-30s max,
- retry only transient failures (5xx/network),
- no retry for policy or auth failures.

2. Idempotency
- support `Idempotency-Key` for `/ai/chat` to avoid double billing.

3. Circuit breaker
- open on sustained provider failure rate,
- fallback model/provider or degraded response.

4. Queue heavy jobs
- long insight generation and scheduled reports should run async.

5. Caching
- short cache for identical prompt+context (if policy allows),
- cache usage summary for fast dashboard reads.

---

## 7. Observability and Operations

Minimum telemetry:

1. Metrics
- request count, p95 latency, error rates,
- tokens per request, cost per request,
- quota-exceeded events.

2. Logs (structured)
- request id, user id, model, usage, status.

3. Traces
- UI request -> gateway -> orchestrator -> provider.

4. Alerts
- provider error spike,
- budget threshold crossing (80%, 90%, 100%),
- unusual token burst anomalies.

---

## 8. Policy and Guardrails

Must enforce:

1. Prompt injection resistance
- isolate system prompt and untrusted user content,
- strip tool execution commands unless explicitly permitted.

2. Output constraints
- schema validation for structured responses,
- reject unsafe output categories by policy.

3. Human-in-the-loop
- high-risk recommendations require manual approval before action.

---

## 9. Rollout Strategy

1. Stage 1 (internal)
- enable for test environments only,
- verify quotas, logs, and error handling.

2. Stage 2 (admin pilot)
- enable admin-only AI console,
- monitor quality and cost for 2-4 weeks.

3. Stage 3 (module expansion)
- add insights endpoints by module and schedule automations.

Exit criteria before broad release:
- stable latency and error budgets,
- accurate token/message metering,
- no unresolved critical security findings.

---

## 10. Backend Acceptance Checklist

- [ ] Admin-only access enforced for AI entrypoints
- [ ] Quota checks and remaining counters returned in API responses
- [ ] Usage ledger stores exact prompt/completion/total tokens
- [ ] Idempotency protection implemented for chat requests
- [ ] Observability dashboards and alerts configured
- [ ] Security controls (PII redaction, secret storage, audit logs) active
- [ ] Load and failure tests completed
- [ ] Runbook available for quota breach and provider outage events
