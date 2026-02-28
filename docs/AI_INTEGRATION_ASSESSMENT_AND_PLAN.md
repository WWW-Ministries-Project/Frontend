# AI Integration Assessment and Implementation Plan

## Objective

Enable production-grade AI capabilities across the application to:

- improve decision quality with real-time insights,
- reduce manual operational work,
- increase response speed across people, process, and administration workflows,
- maintain strict control over security, cost, and usage (messages/tokens/remaining quota).

---

## Current Application Assessment

The current frontend surface shows strong module coverage and rich operational data sources:

- Membership and directory management
- Visitor management and follow-ups
- Events and attendance
- Appointments and staff availability
- Life center administration and analytics
- Requisitions and approval flow
- Marketplace and orders
- Finance configuration and financial records
- School of ministry and learner progress
- Settings, access rights, and users

### Readiness Summary

1. Strengths
- clear module boundaries and route structure,
- existing analytics pages in most core modules,
- role and permission framework already in place.

2. Gaps to close before broad AI rollout
- no standardized AI service contract yet (`chat`, `usage`, `insights`, `automation`),
- no shared AI telemetry model for token/message tracking,
- no retrieval layer for institutional knowledge and historical records,
- no explicit AI guardrails/policy enforcement endpoints.

---

## Where AI Should Be Used

## 1) Membership and Visitors

- Lead scoring and follow-up prioritization
- Auto-generated member/visitor summaries from profile + activity history
- Churn and disengagement early-warning signals

Business impact:
- faster pastoral/operations response,
- improved retention and assimilation rates.

## 2) Events and Attendance

- Attendance forecasting by event type, department, and week
- Drop-off analysis with probable causes and interventions
- AI-generated post-event summary and action checklist

Business impact:
- better event planning, staffing, and outreach.

## 3) Appointments

- Staff capacity optimization suggestions
- No-show risk scoring with reminder recommendations
- AI summary notes for completed appointments

Business impact:
- better utilization and reduced scheduling friction.

## 4) Requisitions and Operations

- Auto-categorize requisition requests
- Detect stalled approvals and predict SLA breach risk
- Summarize approval history and blockers for decision makers

Business impact:
- shorter approval cycle time and better governance.

## 5) Finance and Marketplace

- Anomaly detection (suspicious or unusual movement patterns)
- Revenue trend explanation and plain-language summaries
- Product demand trend and stock recommendations

Business impact:
- stronger financial control and inventory decisions.

## 6) School of Ministry and Learning

- Learner risk flags (late submissions, weak engagement trends)
- Personalized learning recommendations
- Instructor assistant for grading notes and cohort summary

Business impact:
- better learner outcomes and instructor productivity.

## 7) Admin and Settings

- Policy assistant for access rights configuration guidance
- AI-generated executive dashboard summaries across modules
- Natural-language analytics query interface for admins

Business impact:
- faster executive reporting and safer admin operations.

---

## Priority Rollout Plan

## Phase 1 (0-4 weeks): Foundation

- Stand up AI backend service contracts:
  - `GET /ai/credentials?provider=openai|gemini`
  - `POST /ai/credentials`
  - `PUT /ai/credentials/{id}`
  - `POST /ai/chat`
  - `GET /ai/usage-summary`
  - `GET /ai/usage-history`
  - `POST /ai/insights/{module}`
- Add quota policy model (message/token budgets per deployment, role, or user)
- Add full audit and observability baseline
- Ship admin-only AI entry point and access guard (frontend complete)

Deliverable:
- controlled AI pilot for admins with usage visibility.

## Phase 2 (4-8 weeks): Insight Use Cases

- Launch AI insights for:
  - visitors follow-up,
  - attendance trend explanation,
  - requisition risk/stall alerts.
- Add citation mode (source records included in response metadata)
- Add quality evaluation workflow (human rating + correction loop)

Deliverable:
- first measurable operational benefits.

## Phase 3 (8-12 weeks): Workflow Automation

- AI-generated task recommendations and optional auto-actions
- Approval reminder automation with confidence thresholds
- Scheduled intelligence reports for leadership

Deliverable:
- reduced repetitive manual operations.

## Phase 4 (12+ weeks): Optimization and Scale

- Model routing (cost/performance based)
- Semantic retrieval over internal data/docs
- Per-module fine-tuning prompts and policy pack hardening

Deliverable:
- optimized cost-quality-performance at production scale.

---

## Production Quality Requirements

All AI features should meet these standards:

1. Security and access control
- enforce RBAC for every AI endpoint,
- isolate sensitive data domains (members, finance, requisitions),
- redact sensitive fields before model calls.

2. Reliability
- strict request timeouts,
- retriable and idempotent operations where applicable,
- graceful degradation when provider is unavailable.

3. Observability
- request tracing from UI to provider,
- latency, error, token, and cost dashboards,
- alerting on quota exhaustion and abnormal usage spikes.

4. Governance
- prompt/version registry,
- audit logs for requests, outputs, and actions,
- manual override and human review for high-risk decisions.

---

## Success Metrics

Track monthly:

- operational cycle-time reduction (requisitions, follow-ups, scheduling),
- AI response acceptance rate (without manual rewrite),
- user adoption (active admin users and session frequency),
- message/token consumption vs allocated quotas,
- cost per useful action and cost per module.

---

## Immediate Next Steps

1. Implement backend contracts and usage ledger (see backend guide document).
2. Enable AI pilot for admin users only.
3. Start with three high-impact use cases:
- visitor follow-up prioritization,
- requisition stall detection,
- attendance intelligence summaries.
4. Review outcomes after 2-4 weeks and expand module coverage.
