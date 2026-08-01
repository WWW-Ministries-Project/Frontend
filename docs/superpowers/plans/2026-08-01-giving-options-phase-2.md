# Giving Options Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A member picks a giving option in the mobile app, pays through Paystack, and the payment settles into that option's subaccount with a contribution record, an emailed receipt, and an admin-visible list in the web dashboard.

**Architecture:** The Backend owns everything touching money. Mobile is the only donor surface. The web dashboard is read-only reporting. A Paystack webhook and an on-demand verify endpoint both converge on one idempotent settle function, so a payment settles exactly once regardless of which observes it first.

**Tech Stack:** Backend — Express, Prisma, MySQL, axios, nodemailer. Frontend — Vite, React, TypeScript, Tailwind, Zustand. Mobile — Expo, React Native, axios, `expo-web-browser`.

**Spec:** `docs/superpowers/specs/2026-08-01-giving-options-phase-2-design.md`

---

## Before you start

### No TDD in this plan, and that is deliberate

The writing-plans skill defaults to test-driven development. None of these three repositories has a test runner, and `Frontend/CLAUDE.md` says explicitly: *"No test runner is configured. Do not add test scripts unless asked."* User instructions outrank skill defaults, so this plan does not introduce one.

The verification gates used instead, run after every task:

| Repo | Command |
|---|---|
| Backend | `npx tsc --noEmit` |
| Frontend | `npm run lint` and `npx tsc --noEmit` |
| Mobile | `npx tsc --noEmit` |

Task 17 is a scripted manual end-to-end pass against Paystack test keys. Treat it as the real acceptance gate — the typechecks only prove the code compiles.

### Repository boundaries

Three separate git repos. One branch, one commit, one PR **per repo**. Never stage files from two repos in one commit. Always pass `-C <repo path>` to git rather than `cd`-ing.

| Repo | Path | Branch to use | PR target |
|---|---|---|---|
| Frontend | `/Users/akwaah/Documents/GitHub/Frontend` | `feat/giving-options-phase-2` (already created) | `development` |
| Backend | `/Users/akwaah/Documents/GitHub/Backend` | `feat/giving-options-phase-2` (Task 1 creates it) | `main` |
| Mobile | `/Users/akwaah/Documents/GitHub/wwm-mobile` | `codex/giving-phase-2` (Task 13 creates it) | `dev` |

Work in order: Backend (Tasks 1–10), then Frontend (Tasks 11–13), then Mobile (Tasks 14–16). The Backend must be deployed before either client ships.

### One refinement over the spec

The spec says an amount mismatch should "record the amount Paystack actually collected and flag the row for review". This plan adds a nullable `amount_paid` column rather than overwriting `amount` or inventing a fifth status. `amount` stays as the figure the donor was quoted at initialization; `amount_paid` is what Paystack reported collecting. A mismatch is then durable and queryable (`amount_paid <> amount`) instead of only existing in a log line. Task 10 updates the spec and contract docs to match.

---

## File Structure

### Backend (`/Users/akwaah/Documents/GitHub/Backend`)

| File | Responsibility |
|---|---|
| `prisma/schema.prisma` | Add `givingContribution`; add back-relations on `givingOption` and `branch` |
| `index.ts` | Capture the raw request body so webhook signatures can be verified |
| `src/libs/paystack/paystackTransaction.ts` | **New.** Initialize and verify transactions. Knows Paystack, knows nothing about our tables |
| `src/libs/paystack/paystackWebhook.ts` | **New.** HMAC SHA512 signature verification. Nothing else |
| `src/utils/mail_templates/givingReceiptTemplate.ts` | **New.** Receipt HTML |
| `src/modules/finance/GivingOption/contributionValidation.ts` | **New.** Request payload validation |
| `src/modules/finance/GivingOption/contributionService.ts` | **New.** Availability, initialize, settle, listing. The only file that knows the business rules |
| `src/modules/finance/GivingOption/contributionController.ts` | **New.** HTTP shape only — parse, delegate, respond |
| `src/modules/finance/GivingOption/route.ts` | Register the six new routes **above** the existing `GET /:id` |

Contributions get their own service/controller/validation trio rather than being bolted onto the phase 1 files. Phase 1 is configuration; phase 2 is money movement. They change for different reasons and `service.ts` is already 400+ lines.

### Frontend (`/Users/akwaah/Documents/GitHub/Frontend`)

| File | Responsibility |
|---|---|
| `src/utils/api/finance/interface.ts` | Add `GivingContribution` and `GivingContributionQuery` types |
| `src/utils/api/apiFetch.ts` | Add `fetchGivingContributions` |
| `src/pages/HomePage/pages/FinanceManagement/GivingOptions/GivingContributions.tsx` | **New.** Paginated, filterable contributions table |
| `src/routes/appRoutes.tsx` | Register `finance/giving-contributions` |

### Mobile (`/Users/akwaah/Documents/GitHub/wwm-mobile`)

| File | Responsibility |
|---|---|
| `src/types.ts` | Add `GivingOption` and `GivingContribution` |
| `src/api.ts` | Add four endpoint functions and two `normalize*` functions |
| `src/screens.tsx` | Rewrite `GiveScreen` |

---

## Phase A — Backend

### Task 1: Branch and schema

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/Backend/prisma/schema.prisma`

- [ ] **Step 1: Cut the Backend branch**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend status --short
git -C /Users/akwaah/Documents/GitHub/Backend checkout -b feat/giving-options-phase-2
```

Expected: clean status, then `Switched to a new branch 'feat/giving-options-phase-2'`.

- [ ] **Step 2: Add the `givingContribution` model**

Append after the `givingOption` model (which ends around line 1763 with its `@@index` block):

```prisma
model givingContribution {
  id                 String       @id @default(cuid())
  // Generated by us and handed to Paystack, so both sides key on the same value
  reference          String       @unique
  giving_option_id   String
  giving_option      givingOption @relation(fields: [giving_option_id], references: [id], onDelete: Restrict)
  // Snapshots. Renaming an option or a member must not rewrite past receipts.
  giving_option_name String
  subaccount_code    String?
  // Donor identity is an audit breadcrumb, deliberately without a foreign key:
  // deleting a user must never cascade into, or block, a financial record.
  user_id            Int?
  donor_name         String
  donor_email        String
  // Minor units (pesewas). Never a float - binary floats cannot hold decimal money.
  amount             Int
  // What Paystack reported collecting. Differs from `amount` only when something
  // went wrong; `amount_paid <> amount` is the query that finds those rows.
  amount_paid        Int?
  currency           String       @default("GHS")
  // pending | success | failed | abandoned
  status             String       @default("pending")
  channel            String?
  paid_at            DateTime?
  // Raw processor payload, kept for chargeback and reconciliation disputes
  paystack_response  String?      @db.LongText
  receipt_sent_at    DateTime?
  branch_id          Int?
  branch             branch?      @relation(fields: [branch_id], references: [id])
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt

  @@index([giving_option_id], map: "giving_contribution_option_id_idx")
  @@index([user_id], map: "giving_contribution_user_id_idx")
  @@index([status], map: "giving_contribution_status_idx")
  @@index([branch_id], map: "giving_contribution_branch_id_idx")
  @@index([createdAt], map: "giving_contribution_created_at_idx")
}
```

- [ ] **Step 3: Add the back-relation on `givingOption`**

In the `givingOption` model, add this line immediately after `updatedAt DateTime @updatedAt`:

```prisma
  contributions      givingContribution[]
```

- [ ] **Step 4: Add the back-relation on `branch`**

Find `model branch` and add to its relation list:

```prisma
  giving_contributions     givingContribution[]
```

- [ ] **Step 5: Generate the migration**

```bash
cd /Users/akwaah/Documents/GitHub/Backend && npx prisma migrate dev --name add_giving_contributions
```

Expected: a new folder `prisma/migrations/<timestamp>_add_giving_contributions/` containing `migration.sql` with `CREATE TABLE givingContribution`, and the Prisma client regenerated.

This requires `DATABASE_URL` and `SHADOW_DATABASE_URL` in `Backend/.env`. If the shadow database is unavailable, stop and ask rather than hand-writing the SQL — a hand-written migration that drifts from the schema breaks every later `migrate dev`.

- [ ] **Step 6: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Backend && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 7: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add prisma/schema.prisma prisma/migrations
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "Add givingContribution table

Records one Paystack transaction per giving attempt. Amounts are integer
minor units; option name, donor details and subaccount code are snapshotted
so later edits cannot rewrite past receipts."
```

---

### Task 2: Paystack transaction client

**Files:**
- Create: `/Users/akwaah/Documents/GitHub/Backend/src/libs/paystack/paystackTransaction.ts`

- [ ] **Step 1: Write the module**

This mirrors `paystackSubaccount.ts` exactly — thin typed wrappers over `paystackRequest`, which already unwraps the envelope and normalises errors into `PaystackError` (4xx → 422, everything else → 502).

```typescript
import { paystackRequest } from "./paystackClient";

export type PaystackInitializeInput = {
  email: string;
  /** Minor units (pesewas). Paystack rejects decimals here. */
  amount: number;
  currency: string;
  reference: string;
  subaccount: string;
  /** "subaccount" - the giving option bears the Paystack fee, not a main account */
  bearer: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
};

export type PaystackInitializeResult = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export type PaystackTransaction = {
  id?: number;
  /** "success" | "failed" | "abandoned" | "ongoing" | ... */
  status: string;
  reference: string;
  /** Minor units, as collected */
  amount: number;
  currency?: string;
  channel?: string | null;
  paid_at?: string | null;
  gateway_response?: string | null;
};

export const initializeTransaction = (
  input: PaystackInitializeInput,
  branchId?: number | null,
): Promise<PaystackInitializeResult> =>
  paystackRequest<PaystackInitializeResult>({
    method: "post",
    path: "/transaction/initialize",
    branchId,
    body: input,
  });

export const verifyTransaction = (
  reference: string,
  branchId?: number | null,
): Promise<PaystackTransaction> =>
  paystackRequest<PaystackTransaction>({
    method: "get",
    path: `/transaction/verify/${encodeURIComponent(reference)}`,
    branchId,
  });
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Backend && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add src/libs/paystack/paystackTransaction.ts
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "Add Paystack transaction initialize and verify wrappers"
```

---

### Task 3: Webhook signature verification

**Files:**
- Create: `/Users/akwaah/Documents/GitHub/Backend/src/libs/paystack/paystackWebhook.ts`
- Modify: `/Users/akwaah/Documents/GitHub/Backend/index.ts:46`

- [ ] **Step 1: Write the verifier**

```typescript
import { createHmac, timingSafeEqual } from "crypto";
import { resolvePaystackCredentials } from "./paystackCredentials";

/**
 * Paystack signs the RAW request bytes with the secret key (HMAC SHA512) and
 * sends the hex digest in x-paystack-signature.
 *
 * Verifying against a re-serialised body does not work: JSON.stringify of a
 * parsed object is not guaranteed to reproduce the original key order or
 * whitespace, so the digest silently stops matching for some payloads. The raw
 * buffer is captured by the express.json verify hook in index.ts.
 */
export const verifyPaystackSignature = async (
  rawBody: Buffer | undefined,
  signature: unknown,
  branchId?: number | null,
): Promise<boolean> => {
  if (!rawBody || rawBody.length === 0) {
    return false;
  }

  if (typeof signature !== "string" || signature.length === 0) {
    return false;
  }

  const { secretKey } = await resolvePaystackCredentials(branchId);
  const expected = createHmac("sha512", secretKey).update(rawBody).digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");

  // timingSafeEqual throws on length mismatch, so compare lengths first. A
  // wrong-length signature is already a failure, so this leaks nothing useful.
  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
};
```

- [ ] **Step 2: Capture the raw body in `index.ts`**

Replace line 46:

```typescript
app.use(express.json({ limit: "25mb" }));
```

with:

```typescript
app.use(
  express.json({
    limit: "25mb",
    // Paystack signs the raw bytes of its webhook body. Keep a copy before the
    // body is parsed - re-serialising the parsed object does not reproduce the
    // same digest. Preferred over mounting express.raw on the webhook path
    // because it does not depend on router mount order.
    verify: (req, _res, buf) => {
      (req as unknown as { rawBody?: Buffer }).rawBody = buf;
    },
  }),
);
```

- [ ] **Step 3: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Backend && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add src/libs/paystack/paystackWebhook.ts index.ts
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "Verify Paystack webhook signatures against the raw request body

express.json discards the raw bytes, and a re-serialised body does not
reproduce the same HMAC digest. Capture the buffer in the json verify hook."
```

---

### Task 4: Receipt email template

**Files:**
- Create: `/Users/akwaah/Documents/GitHub/Backend/src/utils/mail_templates/givingReceiptTemplate.ts`

- [ ] **Step 1: Write the template**

```typescript
import {
  buildUnifiedEmailTemplate,
  escapeEmailHtml,
} from "./unifiedEmailTemplate";

export type GivingReceiptDetails = {
  donor_name: string;
  giving_option_name: string;
  /** Minor units (pesewas) */
  amount_minor_units: number;
  currency: string;
  reference: string;
  channel?: string | null;
  paid_at?: Date | null;
};

const formatAmount = (minorUnits: number, currency: string): string =>
  `${currency} ${(minorUnits / 100).toFixed(2)}`;

const formatChannel = (channel?: string | null): string | null => {
  if (!channel) return null;
  return channel.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export const givingReceiptTemplate = (details: GivingReceiptDetails): string => {
  const channel = formatChannel(details.channel);

  const rows: Array<[string, string]> = [
    ["Giving option", details.giving_option_name],
    ["Amount", formatAmount(details.amount_minor_units, details.currency)],
    ["Reference", details.reference],
    ...(channel ? [["Payment method", channel] as [string, string]] : []),
    ["Date", (details.paid_at ?? new Date()).toLocaleString()],
  ];

  const messageHtml = `
    <table role="presentation" style="width:100%;border-collapse:collapse;margin-top:8px;">
      ${rows
        .map(
          ([label, value]) => `
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:14px;">${escapeEmailHtml(label)}</td>
          <td style="padding:8px 0;text-align:right;font-size:14px;font-weight:600;color:#111827;">${escapeEmailHtml(value)}</td>
        </tr>`,
        )
        .join("")}
    </table>
  `;

  return buildUnifiedEmailTemplate({
    headerTitle: "Giving receipt",
    headerText: "Thank you for your giving.",
    preheader: `Receipt for ${details.giving_option_name}`,
    greeting: `Hello ${details.donor_name},`,
    message: "We have received your contribution. The details are below.",
    messageHtml,
  });
};
```

Note: `receiptConfig` is deliberately not used. Despite the name it is a `{id, name, description, branch_id}` lookup list like `paymentConfig`, not a template store.

- [ ] **Step 2: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Backend && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add src/utils/mail_templates/givingReceiptTemplate.ts
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "Add giving receipt email template"
```

---

### Task 5: Contribution payload validation

**Files:**
- Create: `/Users/akwaah/Documents/GitHub/Backend/src/modules/finance/GivingOption/contributionValidation.ts`

- [ ] **Step 1: Write the validator**

```typescript
import { FinanceHttpError } from "../common";

/** GHS 1.00. Paystack rejects trivially small amounts and so do we. */
export const MINIMUM_CONTRIBUTION_MINOR_UNITS = 100;

export type InitializeContributionPayload = {
  giving_option_id: string;
  /** Minor units (pesewas) */
  amount: number;
};

export const validateInitializePayload = (
  body: unknown,
): InitializeContributionPayload => {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new FinanceHttpError(422, "Invalid request payload");
  }

  const payload = body as { giving_option_id?: unknown; amount?: unknown };

  if (
    typeof payload.giving_option_id !== "string" ||
    payload.giving_option_id.trim().length === 0
  ) {
    throw new FinanceHttpError(
      422,
      "giving_option_id is required and must be a non-empty string",
    );
  }

  const amount = Number(payload.amount);

  // Integer minor units only. Accepting a decimal here is how you end up
  // charging 10.999999 pesewas.
  if (!Number.isInteger(amount)) {
    throw new FinanceHttpError(
      422,
      "amount is required and must be an integer in minor units (pesewas)",
    );
  }

  if (amount < MINIMUM_CONTRIBUTION_MINOR_UNITS) {
    throw new FinanceHttpError(422, "The minimum contribution is GHS 1.00");
  }

  return {
    giving_option_id: payload.giving_option_id.trim(),
    amount,
  };
};

export type ContributionListFilters = {
  branch_id?: number;
  giving_option_id?: string;
  status?: string;
  from?: Date;
  to?: Date;
};

const VALID_STATUSES = ["pending", "success", "failed", "abandoned"];

export const parseContributionFilters = (
  query: Record<string, unknown>,
): ContributionListFilters => {
  const filters: ContributionListFilters = {};

  if (query.branch_id !== undefined && query.branch_id !== "") {
    const branchId = Number(query.branch_id);
    if (!Number.isInteger(branchId) || branchId < 1) {
      throw new FinanceHttpError(422, "branch_id must be a positive integer");
    }
    filters.branch_id = branchId;
  }

  if (typeof query.giving_option_id === "string" && query.giving_option_id.trim()) {
    filters.giving_option_id = query.giving_option_id.trim();
  }

  if (typeof query.status === "string" && query.status.trim()) {
    const status = query.status.trim().toLowerCase();
    if (!VALID_STATUSES.includes(status)) {
      throw new FinanceHttpError(
        422,
        `status must be one of: ${VALID_STATUSES.join(", ")}`,
      );
    }
    filters.status = status;
  }

  if (typeof query.from === "string" && query.from.trim()) {
    const from = new Date(query.from.trim());
    if (Number.isNaN(from.getTime())) {
      throw new FinanceHttpError(422, "from must be a valid date");
    }
    filters.from = from;
  }

  if (typeof query.to === "string" && query.to.trim()) {
    const to = new Date(query.to.trim());
    if (Number.isNaN(to.getTime())) {
      throw new FinanceHttpError(422, "to must be a valid date");
    }
    filters.to = to;
  }

  return filters;
};
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Backend && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add src/modules/finance/GivingOption/contributionValidation.ts
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "Add giving contribution payload validation"
```

---

### Task 6: Contribution service

This is the only file that knows the business rules. Everything else delegates here.

**Files:**
- Create: `/Users/akwaah/Documents/GitHub/Backend/src/modules/finance/GivingOption/contributionService.ts`

- [ ] **Step 1: Write the imports, constants and helpers**

```typescript
import { randomUUID } from "crypto";
import { prisma } from "../../../Models/context";
import { isPaystackFailure } from "../../../libs/paystack/paystackClient";
import {
  initializeTransaction,
  verifyTransaction,
  type PaystackTransaction,
} from "../../../libs/paystack/paystackTransaction";
import { sendEmail } from "../../../utils/emailService";
import { givingReceiptTemplate } from "../../../utils/mail_templates/givingReceiptTemplate";
import { FinanceHttpError, PaginationQuery } from "../common";
import type {
  ContributionListFilters,
  InitializeContributionPayload,
} from "./contributionValidation";

/**
 * paystack_response holds the raw processor payload. It is useful for disputes
 * and useless to clients, so it never appears in an API response.
 */
const CONTRIBUTION_SELECT = {
  id: true,
  reference: true,
  giving_option_id: true,
  giving_option_name: true,
  subaccount_code: true,
  user_id: true,
  donor_name: true,
  donor_email: true,
  amount: true,
  amount_paid: true,
  currency: true,
  status: true,
  channel: true,
  paid_at: true,
  receipt_sent_at: true,
  branch_id: true,
  createdAt: true,
  updatedAt: true,
} as const;

const buildReference = (): string =>
  `WWM-GIVE-${randomUUID().replace(/-/g, "").slice(0, 20).toUpperCase()}`;

/** Paystack failures keep their own status codes, as in phase 1. */
const toFinanceError = (error: unknown, fallback: string): FinanceHttpError => {
  if (error instanceof FinanceHttpError) {
    return error;
  }

  if (isPaystackFailure(error)) {
    return new FinanceHttpError(error.statusCode, error.message);
  }

  return new FinanceHttpError(400, fallback);
};

/**
 * The URL Paystack redirects the donor to after payment.
 *
 * Deliberately server-side: taking a redirect target from the client would be
 * an open redirect on a payment flow. The default matches the hosted bounce
 * page the marketplace already uses (Frontend route "verify-payment/:type").
 */
const resolveCallbackUrl = (): string | undefined => {
  const configured = process.env.PAYSTACK_GIVING_CALLBACK_URL?.trim();
  if (configured) return configured;

  const frontendUrl = process.env.Frontend_URL?.trim();
  if (!frontendUrl) return undefined;

  return `${frontendUrl.replace(/\/+$/, "")}/out/verify-payment/mobile`;
};

/**
 * Options this member may give to: their own branch plus organisation-wide
 * funds. Built as an explicit array because `{ branch_id: undefined }` is not a
 * filter in Prisma - it matches everything, which would expose every branch's
 * options to a member with no branch.
 */
const branchVisibilityFilter = (branchId: number | null) =>
  branchId ? [{ branch_id: branchId }, { branch_id: null }] : [{ branch_id: null }];
```

- [ ] **Step 2: Add the receipt sender and the settle function**

Append to the same file:

```typescript
type ContributionRow = {
  id: string;
  reference: string;
  giving_option_name: string;
  donor_name: string;
  donor_email: string;
  amount: number;
  amount_paid: number | null;
  currency: string;
  status: string;
  channel: string | null;
  paid_at: Date | null;
  receipt_sent_at: Date | null;
};

/**
 * A receipt that fails to send must never unwind a payment that succeeded, so
 * this swallows its errors. receipt_sent_at staying null is the signal that a
 * retry is owed.
 */
const sendReceipt = async (contribution: ContributionRow): Promise<void> => {
  if (contribution.receipt_sent_at) {
    return;
  }

  try {
    await sendEmail(
      givingReceiptTemplate({
        donor_name: contribution.donor_name,
        giving_option_name: contribution.giving_option_name,
        amount_minor_units: contribution.amount_paid ?? contribution.amount,
        currency: contribution.currency,
        reference: contribution.reference,
        channel: contribution.channel,
        paid_at: contribution.paid_at,
      }),
      contribution.donor_email,
      "Your giving receipt",
    );

    await prisma.givingContribution.update({
      where: { id: contribution.id },
      data: { receipt_sent_at: new Date() },
    });
  } catch (error) {
    console.error(
      `[giving] receipt email failed for ${contribution.reference}`,
      error,
    );
  }
};

/**
 * The single settlement path. Both the webhook and the on-demand verify call
 * this, and it is safe to call any number of times for the same reference.
 */
export const settleContribution = async (
  transaction: PaystackTransaction,
): Promise<void> => {
  const reference = transaction?.reference;

  if (!reference) {
    return;
  }

  const contribution = await prisma.givingContribution.findUnique({
    where: { reference },
  });

  // Unknown reference: acknowledge and move on. Returning an error would make
  // Paystack retry forever for a payment we will never recognise.
  if (!contribution) {
    console.warn(`[giving] settlement for unknown reference ${reference}`);
    return;
  }

  // Already settled. No second write, and no second receipt.
  if (contribution.status === "success") {
    return;
  }

  const paystackStatus = String(transaction.status || "").toLowerCase();

  if (paystackStatus !== "success") {
    await prisma.givingContribution.update({
      where: { id: contribution.id },
      data: {
        status: paystackStatus === "abandoned" ? "abandoned" : "failed",
        paystack_response: JSON.stringify(transaction),
      },
    });
    return;
  }

  const collected = Number(transaction.amount);
  const amountPaid = Number.isInteger(collected) ? collected : null;

  if (amountPaid !== null && amountPaid !== contribution.amount) {
    console.warn(
      `[giving] amount mismatch on ${reference}: quoted ${contribution.amount}, collected ${amountPaid}`,
    );
  }

  const updated = await prisma.givingContribution.update({
    where: { id: contribution.id },
    data: {
      status: "success",
      amount_paid: amountPaid,
      channel: transaction.channel ?? null,
      paid_at: transaction.paid_at ? new Date(transaction.paid_at) : new Date(),
      paystack_response: JSON.stringify(transaction),
    },
  });

  await sendReceipt(updated);
};
```

- [ ] **Step 3: Add the service class**

Append to the same file:

```typescript
export class GivingContributionService {
  /** Options this member may give to right now. */
  async listAvailable(userId: number | undefined) {
    if (!userId) {
      throw new FinanceHttpError(401, "Not authorized");
    }

    const donor = await prisma.user.findUnique({
      where: { id: userId },
      select: { branch_id: true },
    });

    if (!donor) {
      throw new FinanceHttpError(404, "User not found");
    }

    // A drifted option (paystack_synced_at null) cannot reliably receive money,
    // so offering it would take a payment we cannot route.
    return prisma.givingOption.findMany({
      where: {
        archived_at: null,
        is_active: true,
        paystack_synced_at: { not: null },
        subaccount_code: { not: null },
        OR: branchVisibilityFilter(donor.branch_id),
      },
      select: {
        id: true,
        name: true,
        description: true,
        currency: true,
        branch_id: true,
      },
      orderBy: { name: "asc" },
    });
  }

  async initialize(
    userId: number | undefined,
    payload: InitializeContributionPayload,
  ) {
    if (!userId) {
      throw new FinanceHttpError(401, "Not authorized");
    }

    const donor = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, branch_id: true },
    });

    if (!donor) {
      throw new FinanceHttpError(404, "User not found");
    }

    if (!donor.email) {
      throw new FinanceHttpError(
        422,
        "Add an email address to your profile before giving",
      );
    }

    // Re-check visibility here rather than trusting that the client only ever
    // shows what /available returned.
    const option = await prisma.givingOption.findFirst({
      where: {
        id: payload.giving_option_id,
        archived_at: null,
        is_active: true,
        paystack_synced_at: { not: null },
        OR: branchVisibilityFilter(donor.branch_id),
      },
    });

    if (!option || !option.subaccount_code) {
      throw new FinanceHttpError(404, "This giving option is not available");
    }

    const reference = buildReference();

    const contribution = await prisma.givingContribution.create({
      data: {
        reference,
        giving_option_id: option.id,
        giving_option_name: option.name,
        subaccount_code: option.subaccount_code,
        user_id: donor.id,
        donor_name: donor.name,
        donor_email: donor.email,
        amount: payload.amount,
        currency: option.currency,
        status: "pending",
        branch_id: option.branch_id,
      },
      select: CONTRIBUTION_SELECT,
    });

    const callbackUrl = resolveCallbackUrl();

    try {
      const result = await initializeTransaction(
        {
          email: donor.email,
          amount: payload.amount,
          currency: option.currency,
          reference,
          subaccount: option.subaccount_code,
          bearer: option.bearer,
          ...(callbackUrl && { callback_url: callbackUrl }),
          metadata: {
            giving_option_id: option.id,
            giving_option_name: option.name,
            user_id: donor.id,
          },
        },
        option.branch_id,
      );

      return {
        checkoutUrl: result.authorization_url,
        reference,
        contribution,
      };
    } catch (error) {
      await prisma.givingContribution.update({
        where: { id: contribution.id },
        data: { status: "failed" },
      });

      throw toFinanceError(error, "Unable to start this payment");
    }
  }

  /** On-demand settle, for the moment the donor returns from the browser. */
  async verify(userId: number | undefined, reference: string) {
    if (!userId) {
      throw new FinanceHttpError(401, "Not authorized");
    }

    const existing = await prisma.givingContribution.findUnique({
      where: { reference },
      select: { id: true, user_id: true, branch_id: true },
    });

    if (!existing) {
      throw new FinanceHttpError(404, "Contribution not found");
    }

    // A member may only verify their own payment.
    if (existing.user_id !== userId) {
      throw new FinanceHttpError(404, "Contribution not found");
    }

    try {
      const transaction = await verifyTransaction(reference, existing.branch_id);
      await settleContribution(transaction);
    } catch (error) {
      throw toFinanceError(error, "Unable to verify this payment");
    }

    return prisma.givingContribution.findUnique({
      where: { reference },
      select: CONTRIBUTION_SELECT,
    });
  }

  async handleWebhook(event: { event?: string; data?: PaystackTransaction }) {
    // Only charge.success moves money. Other events are acknowledged and ignored.
    if (event?.event !== "charge.success" || !event.data) {
      return;
    }

    await settleContribution(event.data);
  }

  async listForUser(userId: number | undefined, pagination: PaginationQuery) {
    if (!userId) {
      throw new FinanceHttpError(401, "Not authorized");
    }

    const where = { user_id: userId };

    const [data, total] = await Promise.all([
      prisma.givingContribution.findMany({
        where,
        select: CONTRIBUTION_SELECT,
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.givingContribution.count({ where }),
    ]);

    return { data, total };
  }

  async listAll(pagination: PaginationQuery, filters: ContributionListFilters) {
    const where = {
      ...(filters.branch_id !== undefined && { branch_id: filters.branch_id }),
      ...(filters.giving_option_id !== undefined && {
        giving_option_id: filters.giving_option_id,
      }),
      ...(filters.status !== undefined && { status: filters.status }),
      ...((filters.from || filters.to) && {
        createdAt: {
          ...(filters.from && { gte: filters.from }),
          ...(filters.to && { lte: filters.to }),
        },
      }),
    };

    const [data, total] = await Promise.all([
      prisma.givingContribution.findMany({
        where,
        select: CONTRIBUTION_SELECT,
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.givingContribution.count({ where }),
    ]);

    return { data, total };
  }
}
```

- [ ] **Step 4: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Backend && npx tsc --noEmit
```

Expected: no output. If Prisma complains that `amount_paid` or `givingContribution` does not exist, Task 1 Step 5 did not regenerate the client — run `npx prisma generate`.

- [ ] **Step 5: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add src/modules/finance/GivingOption/contributionService.ts
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "Add giving contribution service

Webhook and on-demand verify both call settleContribution, which is safe to
call repeatedly: an already-successful contribution returns immediately, so a
duplicate webhook delivery cannot double-send a receipt."
```

---

### Task 7: Contribution controller

**Files:**
- Create: `/Users/akwaah/Documents/GitHub/Backend/src/modules/finance/GivingOption/contributionController.ts`

- [ ] **Step 1: Write the controller**

```typescript
import { Request, Response } from "express";
import { verifyPaystackSignature } from "../../../libs/paystack/paystackWebhook";
import { FinanceHttpError, parsePagination, sendFinanceError } from "../common";
import { GivingContributionService } from "./contributionService";
import {
  parseContributionFilters,
  validateInitializePayload,
} from "./contributionValidation";

const service = new GivingContributionService();

const getActorUserId = (req: Request): number | undefined => {
  const rawId = (req as unknown as { user?: { id?: unknown } })?.user?.id;
  const parsed = Number(rawId);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const buildEnvelope = (
  data: unknown,
  total: number,
  page: number,
  take: number,
) => ({
  message: "Success",
  data,
  current_page: page,
  take,
  total,
  page_size: take,
  totalPages: Math.ceil(total / take),
});

export class GivingContributionController {
  async listAvailable(req: Request, res: Response): Promise<Response> {
    try {
      const data = await service.listAvailable(getActorUserId(req));

      return res.status(200).json({ message: "Success", data });
    } catch (error) {
      return sendFinanceError(res, error);
    }
  }

  async initialize(req: Request, res: Response): Promise<Response> {
    try {
      const payload = validateInitializePayload(req.body);
      const result = await service.initialize(getActorUserId(req), payload);

      return res.status(201).json({
        message: "Payment started",
        data: result,
      });
    } catch (error) {
      return sendFinanceError(res, error);
    }
  }

  async verify(req: Request, res: Response): Promise<Response> {
    try {
      const reference = req.params?.reference?.trim();

      if (!reference) {
        throw new FinanceHttpError(400, "Invalid reference parameter");
      }

      const data = await service.verify(getActorUserId(req), reference);

      return res.status(200).json({ message: "Success", data });
    } catch (error) {
      return sendFinanceError(res, error);
    }
  }

  async listMine(req: Request, res: Response): Promise<Response> {
    try {
      const pagination = parsePagination(req);
      const result = await service.listForUser(getActorUserId(req), pagination);

      return res
        .status(200)
        .json(
          buildEnvelope(result.data, result.total, pagination.page, pagination.take),
        );
    } catch (error) {
      return sendFinanceError(res, error);
    }
  }

  async listAll(req: Request, res: Response): Promise<Response> {
    try {
      const pagination = parsePagination(req);
      const filters = parseContributionFilters(
        req.query as Record<string, unknown>,
      );
      const result = await service.listAll(pagination, filters);

      return res
        .status(200)
        .json(
          buildEnvelope(result.data, result.total, pagination.page, pagination.take),
        );
    } catch (error) {
      return sendFinanceError(res, error);
    }
  }

  /**
   * Public route. Authenticated by HMAC signature, not by a bearer token.
   *
   * Always acknowledges with 200 once the signature checks out, including for
   * references we do not recognise - anything else makes Paystack retry
   * indefinitely for a payment we will never match.
   */
  async webhook(req: Request, res: Response): Promise<Response> {
    const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody;
    const signature = req.headers["x-paystack-signature"];

    const valid = await verifyPaystackSignature(rawBody, signature).catch(
      () => false,
    );

    if (!valid) {
      return res.status(401).json({ message: "Invalid signature", data: null });
    }

    try {
      await service.handleWebhook(req.body);
    } catch (error) {
      console.error("[giving] webhook processing failed", error);
    }

    return res.status(200).json({ message: "Received", data: null });
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Backend && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add src/modules/finance/GivingOption/contributionController.ts
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "Add giving contribution controller"
```

---

### Task 8: Routes

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/Backend/src/modules/finance/GivingOption/route.ts`

**The one thing that must not go wrong:** `GET /:id` is registered last, at line 275. Express matches in registration order. Every new GET route must be registered **above** it, or `/givingoption/available` is read as a request for the giving option whose id is the literal string `"available"` — a 404 that looks like a data problem instead of a routing one.

- [ ] **Step 1: Add the import**

At the top of the file, after the existing `GivingOptionController` import:

```typescript
import { GivingContributionController } from "./contributionController";
```

- [ ] **Step 2: Instantiate the controller**

After the existing `const controller = new GivingOptionController();`:

```typescript
const contributionController = new GivingContributionController();
```

- [ ] **Step 3: Insert the new routes above `GET /:id`**

Find the last route block in the file — the one registering `"/:id"` around line 275 — and insert all of the following **immediately before** it:

```typescript
/**
 * @swagger
 * /givingoption/paystack-webhook:
 *   post:
 *     summary: Paystack webhook receiver
 *     description: >
 *       Public route, authenticated by an HMAC SHA512 signature over the raw
 *       request body rather than by a bearer token. Always answers 200 once the
 *       signature is valid, including for unknown references, so Paystack does
 *       not retry indefinitely.
 *     tags: [Giving Options]
 *     responses:
 *       200:
 *         description: Acknowledged
 *       401:
 *         description: Invalid or missing signature
 */
givingOptionRouter.post(
  "/paystack-webhook",
  contributionController.webhook,
);

/**
 * @swagger
 * /givingoption/available:
 *   get:
 *     summary: Giving options the caller may give to
 *     description: >
 *       Active, non-archived, Paystack-synced options belonging to the caller's
 *       branch or to no branch at all. Any authenticated member may call this.
 *     tags: [Giving Options]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available giving options
 */
givingOptionRouter.get(
  "/available",
  [protect],
  contributionController.listAvailable,
);

/**
 * @swagger
 * /givingoption/initialize:
 *   post:
 *     summary: Start a giving payment
 *     tags: [Giving Options]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [giving_option_id, amount]
 *             properties:
 *               giving_option_id:
 *                 type: string
 *               amount:
 *                 type: integer
 *                 description: Minor units (pesewas). Minimum 100.
 *     responses:
 *       201:
 *         description: Returns checkoutUrl and reference
 *       422:
 *         description: Validation failure, or Paystack rejected the request
 *       502:
 *         description: Paystack unreachable
 */
givingOptionRouter.post(
  "/initialize",
  [protect],
  contributionController.initialize,
);

/**
 * @swagger
 * /givingoption/my-contributions:
 *   get:
 *     summary: The caller's own giving history
 *     tags: [Giving Options]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Paginated contributions
 */
givingOptionRouter.get(
  "/my-contributions",
  [protect],
  contributionController.listMine,
);

/**
 * @swagger
 * /givingoption/contributions:
 *   get:
 *     summary: All contributions, for finance staff
 *     tags: [Giving Options]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: giving_option_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, success, failed, abandoned]
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Paginated contributions
 */
givingOptionRouter.get(
  "/contributions",
  [protect, permissions.can_view_giving],
  contributionController.listAll,
);

/**
 * @swagger
 * /givingoption/verify/{reference}:
 *   get:
 *     summary: Verify and settle a payment on demand
 *     description: >
 *       Called when the donor returns from the Paystack page, so the app can
 *       show a result without waiting for the webhook. Settles through the same
 *       idempotent path, so whichever arrives first wins and the other no-ops.
 *     tags: [Giving Options]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The settled contribution
 *       404:
 *         description: Unknown reference, or it belongs to another member
 */
givingOptionRouter.get(
  "/verify/:reference",
  [protect],
  contributionController.verify,
);
```

- [ ] **Step 4: Confirm the ordering is right**

```bash
cd /Users/akwaah/Documents/GitHub/Backend && grep -n '^  "/' src/modules/finance/GivingOption/route.ts
```

Expected: `"/:id"` is the **last** path printed. If it is not, move the new blocks up.

- [ ] **Step 5: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Backend && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add src/modules/finance/GivingOption/route.ts
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "Add giving contribution routes

Registered above the existing GET /:id: Express matches in order, so /available
would otherwise be read as a giving option id."
```

---

### Task 9: Backend smoke test

**Files:** none — this task only runs things.

- [ ] **Step 1: Start the server**

```bash
cd /Users/akwaah/Documents/GitHub/Backend && npm run dev
```

Expected: the server boots with no Prisma or TypeScript errors.

- [ ] **Step 2: Check the routes are reachable and ordered correctly**

In a second terminal, with `$TOKEN` set to a valid member JWT:

```bash
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:$PORT/givingoption/available | head -c 400
```

Expected: `{"message":"Success","data":[...]}`. If it returns "Giving option not found", the routes were registered below `GET /:id` — go back to Task 8.

- [ ] **Step 3: Check the webhook rejects an unsigned request**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  -H "Content-Type: application/json" \
  -d '{"event":"charge.success","data":{"reference":"nope","status":"success","amount":100}}' \
  http://localhost:$PORT/givingoption/paystack-webhook
```

Expected: `401`.

- [ ] **Step 4: Check the webhook accepts a correctly signed request**

```bash
BODY='{"event":"charge.success","data":{"reference":"nope","status":"success","amount":100}}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha512 -hmac "$PAYSTACK_SECRET_KEY" | awk '{print $2}')
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: $SIG" \
  -d "$BODY" \
  http://localhost:$PORT/givingoption/paystack-webhook
```

Expected: `200`, and a `[giving] settlement for unknown reference nope` warning in the server log. A `401` here means the raw body is not reaching the verifier — recheck Task 3 Step 2.

- [ ] **Step 5: Commit nothing, but record the result**

No code changes. If any step failed, fix it in the relevant task before continuing.

---

### Task 10: Update the contract and spec docs

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/Frontend/docs/GIVING_OPTIONS_BACKEND_CONTRACT.md`
- Modify: `/Users/akwaah/Documents/GitHub/Frontend/docs/superpowers/specs/2026-08-01-giving-options-phase-2-design.md`

Both files live in the **Frontend** repo, so this commit goes there, not to Backend.

- [ ] **Step 1: Replace the "Phase 2 hooks (not built)" section**

In `docs/GIVING_OPTIONS_BACKEND_CONTRACT.md`, replace the whole `## Phase 2 hooks (not built)` section with:

```markdown
## Phase 2 — donor checkout and contributions

Status: implemented. See
`docs/superpowers/specs/2026-08-01-giving-options-phase-2-design.md`.

Table `givingContribution`, one row per giving attempt. Amounts are integer
minor units (pesewas). `amount` is what the donor was quoted at initialization;
`amount_paid` is what Paystack reported collecting, so `amount_paid <> amount`
finds every payment that needs review.

| Method | Path | Permission |
|---|---|---|
| GET | `/available` | auth only |
| POST | `/initialize` | auth only |
| GET | `/verify/:reference` | auth only |
| GET | `/my-contributions` | auth only |
| GET | `/contributions` | `Giving:view` |
| POST | `/paystack-webhook` | public, HMAC SHA512 over the raw body |

All six are registered **above** `GET /:id`. Express matches in registration
order, so moving them below turns `/available` into a lookup for the giving
option whose id is `"available"`.

Giving itself needs only a bearer token — any member may give. `Giving:manage`
still guards configuration.

The webhook and `GET /verify/:reference` both call one idempotent
`settleContribution`. An already-successful contribution returns immediately, so
duplicate delivery cannot double-write or double-send a receipt. Unknown
references are acknowledged with 200, not an error, so Paystack stops retrying.

Env:

```
PAYSTACK_GIVING_CALLBACK_URL=   # optional; defaults to <Frontend_URL>/out/verify-payment/mobile
```

The callback URL is resolved server-side and never taken from the client — a
client-supplied redirect target on a payment flow is an open redirect.
```

- [ ] **Step 2: Record the `amount_paid` refinement in the spec**

In `docs/superpowers/specs/2026-08-01-giving-options-phase-2-design.md`, in the data model table, add a row directly after `amount`:

```markdown
| `amount_paid` | `INT?` | what Paystack reported collecting; `amount_paid <> amount` finds rows needing review |
```

And in the "Settlement" section, replace step 3 with:

```markdown
3. Record Paystack's reported amount in `amount_paid`. When it differs from the
   quoted `amount`, log a warning and leave both values in place — the mismatch
   stays queryable rather than being flattened into a single overwritten column.
```

- [ ] **Step 3: Commit (Frontend repo)**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add docs/GIVING_OPTIONS_BACKEND_CONTRACT.md docs/superpowers/specs/2026-08-01-giving-options-phase-2-design.md
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "Document Giving Options phase 2 contract"
```

---

## Phase B — Frontend web dashboard

Work in `/Users/akwaah/Documents/GitHub/Frontend` on `feat/giving-options-phase-2`, which already exists.

### Task 11: Types and API client

**Files:**
- Modify: `src/utils/api/finance/interface.ts`
- Modify: `src/utils/api/apiFetch.ts`

- [ ] **Step 1: Add the types**

Append to `src/utils/api/finance/interface.ts`, after the `ResolvedBankAccount` interface:

```typescript
export type GivingContributionStatus =
  | "pending"
  | "success"
  | "failed"
  | "abandoned";

export interface GivingContribution {
  id: string;
  /** Paystack transaction reference */
  reference: string;
  giving_option_id: string;
  /** Snapshot taken when the payment started, not a live join */
  giving_option_name: string;
  subaccount_code: string | null;
  user_id: number | null;
  donor_name: string;
  donor_email: string;
  /** Minor units (pesewas) - divide by 100 to display */
  amount: number;
  /** What Paystack collected. Differs from amount only when something went wrong */
  amount_paid: number | null;
  currency: string;
  status: GivingContributionStatus;
  channel: string | null;
  paid_at: string | null;
  receipt_sent_at: string | null;
  branch_id: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface GivingContributionQuery {
  page?: number;
  take?: number;
  branch_id?: number;
  giving_option_id?: string;
  status?: GivingContributionStatus;
  /** ISO date string */
  from?: string;
  /** ISO date string */
  to?: string;
}
```

- [ ] **Step 2: Add the fetch function**

In `src/utils/api/apiFetch.ts`, add `GivingContribution` and `GivingContributionQuery` to the existing import block from `./finance/interface` (the one that already imports `GivingOption` around line 70), then add this method after `fetchGivingOption`:

```typescript
  // fetch giving contributions (admin view)
  fetchGivingContributions = (
    query?: GivingContributionQuery
  ): Promise<ApiResponse<GivingContribution[]>> => {
    return this.fetchFromApi("givingoption/contributions", query);
  };
```

- [ ] **Step 3: Verify**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend && npx tsc --noEmit && npm run lint
```

Expected: no output from `tsc`; lint exits 0.

- [ ] **Step 4: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add src/utils/api/finance/interface.ts src/utils/api/apiFetch.ts
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "Add giving contribution types and fetch client"
```

---

### Task 12: Contributions page

**Files:**
- Create: `src/pages/HomePage/pages/FinanceManagement/GivingOptions/GivingContributions.tsx`

- [ ] **Step 1: Write the page**

```tsx
import { useFetch } from "@/CustomHooks/useFetch";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import type {
  GivingContribution,
  GivingContributionStatus,
} from "@/utils/api/finance/interface";
import { api } from "@/utils";
import { cn } from "@/utils/cn";
import React from "react";

type StatusFilter = "all" | GivingContributionStatus;

const STATUS_FILTERS: StatusFilter[] = [
  "all",
  "success",
  "pending",
  "failed",
  "abandoned",
];

const STATUS_STYLES: Record<GivingContributionStatus, string> = {
  success: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  abandoned: "bg-lightGray/60 text-primaryGray",
};

/** Amounts are stored in minor units, so every display divides by 100. */
const formatAmount = (minorUnits: number, currency: string): string =>
  `${currency} ${(minorUnits / 100).toFixed(2)}`;

const formatDate = (value: string | null): string => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const GivingContributions = () => {
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");

  const query = React.useMemo(
    () => (statusFilter === "all" ? {} : { status: statusFilter }),
    [statusFilter]
  );

  const { data, loading } = useFetch(api.fetch.fetchGivingContributions, query);

  const contributions = React.useMemo<GivingContribution[]>(
    () => (Array.isArray(data?.data) ? data.data : []),
    [data]
  );

  const totalReceived = React.useMemo(
    () =>
      contributions
        .filter((row) => row.status === "success")
        .reduce((sum, row) => sum + (row.amount_paid ?? row.amount), 0),
    [contributions]
  );

  return (
    <PageOutline>
      <PageHeader title="Giving Contributions" />

      <div className="my-4 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setStatusFilter(filter)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors",
              statusFilter === filter
                ? "bg-primary text-white"
                : "bg-lightGray/40 text-primaryGray hover:bg-lightGray/70"
            )}
          >
            {filter}
          </button>
        ))}

        <p className="ml-auto text-sm font-semibold text-primaryGray">
          Received on this page: {formatAmount(totalReceived, "GHS")}
        </p>
      </div>

      {loading ? (
        <p className="rounded-lg bg-lightGray/30 px-4 py-6 text-sm text-primaryGray">
          Loading contributions...
        </p>
      ) : contributions.length === 0 ? (
        <p className="rounded-lg bg-lightGray/30 px-4 py-6 text-sm text-primaryGray">
          No contributions yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-lightGray/60">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-lightGray/30 text-primaryGray">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Donor</th>
                <th className="px-4 py-3 font-medium">Giving option</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Reference</th>
              </tr>
            </thead>
            <tbody>
              {contributions.map((row) => (
                <tr key={row.id} className="border-t border-lightGray/60">
                  <td className="px-4 py-3">
                    {formatDate(row.paid_at ?? row.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="block">{row.donor_name}</span>
                    <span className="block text-xs text-primaryGray">
                      {row.donor_email}
                    </span>
                  </td>
                  <td className="px-4 py-3">{row.giving_option_name}</td>
                  <td className="px-4 py-3">
                    {formatAmount(row.amount_paid ?? row.amount, row.currency)}
                    {row.amount_paid !== null &&
                    row.amount_paid !== row.amount ? (
                      <span
                        className="ml-2 text-xs font-medium text-red-600"
                        title={`Quoted ${formatAmount(row.amount, row.currency)}`}
                      >
                        mismatch
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {row.channel?.replace(/_/g, " ") ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                        STATUS_STYLES[row.status]
                      )}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {row.reference}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageOutline>
  );
};

export default GivingContributions;
```

`useFetch` re-runs when `activeBranchId` changes, so branch scoping comes for free without threading `buildBranchQuery` through by hand.

- [ ] **Step 2: Verify**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend && npx tsc --noEmit && npm run lint
```

Expected: no output from `tsc`; lint exits 0.

- [ ] **Step 3: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add src/pages/HomePage/pages/FinanceManagement/GivingOptions/GivingContributions.tsx
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "Add giving contributions table"
```

---

### Task 13: Route registration

**Files:**
- Modify: `src/routes/appRoutes.tsx`

- [ ] **Step 1: Add the import**

Next to the existing `GivingOptionsOverview` import at line 100:

```typescript
import GivingContributions from "@/pages/HomePage/pages/FinanceManagement/GivingOptions/GivingContributions";
```

- [ ] **Step 2: Add the route**

Directly after the `giving-options` route object (which ends at line 704):

```tsx
          {
            path: "giving-contributions",
            name: "Giving Contributions",
            element: <GivingContributions />,
            isPrivate: true,
            permissionNeeded: "view_giving",
            sideTab: true,
          },
```

- [ ] **Step 3: Verify**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend && npx tsc --noEmit && npm run lint
```

Expected: no output from `tsc`; lint exits 0.

- [ ] **Step 4: Check it renders**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend && npm run dev
```

Navigate to `/finance/giving-contributions`. Expected: the page loads with the status filter row and either the empty state or a table.

- [ ] **Step 5: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add src/routes/appRoutes.tsx
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "Register the giving contributions route"
```

---

## Phase C — Mobile

### Task 14: Branch, types and API functions

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/wwm-mobile/src/types.ts`
- Modify: `/Users/akwaah/Documents/GitHub/wwm-mobile/src/api.ts`

- [ ] **Step 1: Cut the mobile branch**

Mobile branches off `dev`, never `main`, and task branches are named `codex/<task>`.

```bash
git -C /Users/akwaah/Documents/GitHub/wwm-mobile checkout dev
git -C /Users/akwaah/Documents/GitHub/wwm-mobile pull
git -C /Users/akwaah/Documents/GitHub/wwm-mobile checkout -b codex/giving-phase-2
```

Expected: `Switched to a new branch 'codex/giving-phase-2'`. The repo is currently on `codex/theme-wip` — if that branch has uncommitted work, stash or commit it first.

- [ ] **Step 2: Add the types**

Append to `src/types.ts`:

```typescript
export type GivingOption = {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  branch_id: number | null;
};

export type GivingContribution = {
  id: string;
  reference: string;
  giving_option_id: string;
  giving_option_name: string;
  /** Minor units (pesewas) - divide by 100 to display */
  amount: number;
  amount_paid: number | null;
  currency: string;
  status: string;
  channel: string | null;
  paid_at: string | null;
  createdAt: string;
};
```

- [ ] **Step 3: Add the normalizers**

Backend JSON is loosely shaped, so every response goes through a `normalize*` function using the existing coercion helpers rather than being read raw. Add near the other normalizers in `src/api.ts`:

```typescript
export const normalizeGivingOption = (value: unknown): GivingOption => {
  const record = asRecord(value);
  return {
    id: toText(record.id),
    name: toText(record.name),
    description: record.description ? toText(record.description) : null,
    currency: toText(record.currency) || "GHS",
    branch_id: record.branch_id === null || record.branch_id === undefined
      ? null
      : toNumber(record.branch_id),
  };
};

export const normalizeGivingContribution = (
  value: unknown,
): GivingContribution => {
  const record = asRecord(value);
  return {
    id: toText(record.id),
    reference: toText(record.reference),
    giving_option_id: toText(record.giving_option_id),
    giving_option_name: toText(record.giving_option_name),
    amount: toNumber(record.amount),
    amount_paid:
      record.amount_paid === null || record.amount_paid === undefined
        ? null
        : toNumber(record.amount_paid),
    currency: toText(record.currency) || "GHS",
    status: toText(record.status),
    channel: record.channel ? toText(record.channel) : null,
    paid_at: record.paid_at ? toText(record.paid_at) : null,
    createdAt: toText(record.createdAt),
  };
};
```

Add `GivingContribution` and `GivingOption` to the existing type import block at the top of `src/api.ts`.

- [ ] **Step 4: Add the endpoint functions**

In the `api` object in `src/api.ts`, after `verifyPayment`:

```typescript
  givingOptions: () => get<unknown[]>("givingoption/available"),
  initializeGiving: (payload: { giving_option_id: string; amount: number }) =>
    post<{ checkoutUrl?: string; reference?: string }>(
      "givingoption/initialize",
      payload,
    ),
  verifyGiving: (reference: string) =>
    get<unknown>(`givingoption/verify/${encodeURIComponent(reference)}`),
  myContributions: () => get<unknown[]>("givingoption/my-contributions"),
```

- [ ] **Step 5: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/wwm-mobile && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/wwm-mobile add src/types.ts src/api.ts
git -C /Users/akwaah/Documents/GitHub/wwm-mobile commit -m "Add giving option and contribution API client"
```

---

### Task 15: Rewrite GiveScreen

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/wwm-mobile/src/screens.tsx:999-1027`

- [ ] **Step 1: Delete the hardcoded options and rewrite the screen**

Replace the `GIVE_OPTIONS` constant (line 999) and the whole `GiveScreen` function (lines 1011–1027) with:

```tsx
const GIVE_PRESETS_MINOR_UNITS = [1000, 2000, 5000, 10000];

/** Amounts travel as integer minor units; only the display divides by 100. */
const formatMinorUnits = (minorUnits: number, currency = "GHS"): string =>
  `${currency} ${(minorUnits / 100).toFixed(2)}`;

export function GiveScreen() {
  useTheme();
  const [selected, setSelected] = useState<GivingOption | null>(null);
  const [amountText, setAmountText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const optionsQuery = useAsync(() => api.givingOptions(), []);
  const historyQuery = useAsync(() => api.myContributions(), []);

  const options = useMemo(
    () => asArray<unknown>(optionsQuery.data).map(normalizeGivingOption),
    [optionsQuery.data],
  );

  const contributions = useMemo(
    () => asArray<unknown>(historyQuery.data).map(normalizeGivingContribution),
    [historyQuery.data],
  );

  const closeSheet = () => {
    setSelected(null);
    setAmountText("");
  };

  const give = async () => {
    if (!selected) return;

    const parsed = Number(amountText);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      Alert.alert("Enter an amount", "Type the amount you want to give.");
      return;
    }

    // Round at the boundary: 10.005 * 100 is 1000.4999... in binary floating
    // point, and Paystack rejects a non-integer amount outright.
    const minorUnits = Math.round(parsed * 100);
    if (minorUnits < 100) {
      Alert.alert("Amount too small", "The minimum contribution is GHS 1.00.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.initializeGiving({
        giving_option_id: selected.id,
        amount: minorUnits,
      });

      const checkoutUrl = response.data?.checkoutUrl;
      const reference = response.data?.reference;
      if (!checkoutUrl || !reference) {
        throw new Error("Checkout URL was not returned.");
      }

      closeSheet();

      // openAuthSessionAsync dismisses the browser as soon as Paystack redirects
      // to the return URL, so control comes back here without a deep link.
      await WebBrowser.openAuthSessionAsync(
        checkoutUrl,
        MOBILE_PAYMENT_WEB_VERIFY_URL,
      );

      try {
        const verified = await api.verifyGiving(reference);
        const contribution = normalizeGivingContribution(
          asRecord(verified.data).data ?? verified.data,
        );

        if (contribution.status === "success") {
          Alert.alert(
            "Thank you",
            `${formatMinorUnits(
              contribution.amount_paid ?? contribution.amount,
              contribution.currency,
            )} received for ${contribution.giving_option_name}. A receipt is on its way.`,
          );
        } else {
          Alert.alert(
            "Payment not confirmed",
            "We have not seen this payment complete yet. If you were charged, it will appear in your giving history shortly.",
          );
        }
      } catch {
        // Verification is a convenience. The webhook still settles the payment,
        // so a failure here must not be reported as a failed donation.
        Alert.alert(
          "Payment sent",
          "We could not confirm it just now. Check your giving history in a moment.",
        );
      }

      void historyQuery.refetch();
    } catch (err) {
      Alert.alert("Giving failed", errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Screen title="Give">
        <Section title="Ways to give">
          {optionsQuery.loading ? (
            <LoadingState text="Loading giving options..." />
          ) : optionsQuery.error ? (
            <ErrorState text={optionsQuery.error} onRetry={optionsQuery.refetch} />
          ) : options.length === 0 ? (
            <EmptyState text="No giving options are available yet." />
          ) : (
            options.map((option) => (
              <ActionRow
                key={option.id}
                title={option.name}
                subtitle={option.description ?? undefined}
                icon="gift-outline"
                onPress={() => setSelected(option)}
                accessibilityHint={`Give to ${option.name}`}
              />
            ))
          )}
        </Section>

        <Section title="Giving history">
          {historyQuery.loading ? (
            <LoadingState text="Loading your giving..." />
          ) : contributions.length === 0 ? (
            <EmptyState text="You have not given yet." />
          ) : (
            contributions.map((row) => (
              <InfoRow
                key={row.id}
                icon="receipt-outline"
                label={`${row.giving_option_name} - ${formatDate(row.paid_at ?? row.createdAt)}`}
                value={formatMinorUnits(
                  row.amount_paid ?? row.amount,
                  row.currency,
                )}
              />
            ))
          )}
        </Section>
      </Screen>

      <Modal
        visible={Boolean(selected)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeSheet}
      >
        <Screen title="Give" showHeader={false}>
          <Banner
            title={selected?.name || "Give"}
            subtitle={selected?.description ?? "Enter an amount to give."}
            onBack={closeSheet}
          />
          <Section title="Amount">
            <Field
              label="Amount (GHS)"
              value={amountText}
              onChangeText={setAmountText}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {GIVE_PRESETS_MINOR_UNITS.map((preset) => (
                <Button
                  key={preset}
                  label={formatMinorUnits(preset)}
                  variant="secondary"
                  onPress={() => setAmountText((preset / 100).toFixed(2))}
                />
              ))}
            </View>
            <Text style={styles.muted}>
              You will be taken to a secure payment page. Return to the app when
              you are done.
            </Text>
            <Button
              label={submitting ? "Starting..." : "Continue to payment"}
              icon="card-outline"
              disabled={submitting}
              onPress={give}
            />
          </Section>
        </Screen>
      </Modal>
    </>
  );
}
```

- [ ] **Step 2: Fix the imports**

At the top of `src/screens.tsx`, make sure these are imported. Most already are — add only what is missing:

- From `./api`: `api`, `normalizeGivingOption`, `normalizeGivingContribution`
- From `./types`: `GivingOption`
- From `./utils`: `asArray`, `asRecord`, `errorMessage`, `formatDate`, `MOBILE_PAYMENT_WEB_VERIFY_URL`
- From `./ui-components`: `ActionRow`, `Banner`, `Button`, `EmptyState`, `ErrorState`, `Field`, `InfoRow`, `LoadingState`, `Screen`, `Section`, `styles`, `useTheme`
- From `./hooks`: `useAsync`
- From `react`: `useMemo`, `useState`
- From `react-native`: `Alert`, `Modal`, `Text`, `View`
- `import * as WebBrowser from "expo-web-browser"` (already present at line 5)

The `Pill` import may now be unused in this section — leave it if other screens use it, remove it if `tsc` flags it.

- [ ] **Step 3: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/wwm-mobile && npx tsc --noEmit
```

Expected: no output. This is the only static gate the mobile repo has, so it must be clean.

- [ ] **Step 4: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/wwm-mobile add src/screens.tsx
git -C /Users/akwaah/Documents/GitHub/wwm-mobile commit -m "Replace the placeholder Give screen with real giving

Options now come from the backend instead of a hardcoded list, and amounts are
sent as integer minor units."
```

---

### Task 16: Mobile run-through

**Files:** none.

- [ ] **Step 1: Start the app**

```bash
cd /Users/akwaah/Documents/GitHub/wwm-mobile && npx expo start
```

Point `EXPO_PUBLIC_API_URL` at the backend you started in Task 9.

- [ ] **Step 2: Check the Give tab**

Expected: real giving option names from the database, no "Coming soon" pills. If the list is empty, create a giving option in the web dashboard first — the empty state is correct behaviour, not a bug.

- [ ] **Step 3: Check the empty and error states**

Stop the backend and reopen the Give tab. Expected: the error state with a retry button, not a crash or a blank screen.

---

## Phase D — End-to-end acceptance

### Task 17: Full payment run-through

This is the real acceptance gate. The typechecks only prove the code compiles.

**Files:** none.

- [ ] **Step 1: Confirm test keys**

```bash
grep -c "sk_test_" /Users/akwaah/Documents/GitHub/Backend/.env
```

Expected: `1`. Do not run this task against a live key.

- [ ] **Step 2: Expose the backend for webhooks**

Paystack cannot reach `localhost`. Start a tunnel and register the URL in the Paystack dashboard under Settings → API Keys & Webhooks → Test Webhook URL:

```
https://<your-tunnel-host>/givingoption/paystack-webhook
```

- [ ] **Step 3: Give from the mobile app**

Pick an option, enter `10.00`, continue to payment, and pay with the Paystack test card `4084 0840 8408 4081`, any future expiry, CVV `408`, OTP `123456`.

Expected: the browser closes on its own, and a "Thank you" alert shows `GHS 10.00`.

- [ ] **Step 4: Check the database**

```sql
SELECT reference, status, amount, amount_paid, channel, paid_at, receipt_sent_at
FROM givingContribution ORDER BY createdAt DESC LIMIT 1;
```

Expected: `status = success`, `amount = 1000`, `amount_paid = 1000`, `paid_at` set, `receipt_sent_at` set.

- [ ] **Step 5: Check the receipt**

Expected: an email at the donor address titled "Your giving receipt", showing `GHS 10.00`, the option name, and the reference.

- [ ] **Step 6: Check idempotency**

Replay the webhook from the Paystack dashboard for the same transaction.

Expected: the row is unchanged, `receipt_sent_at` keeps its original timestamp, and no second email arrives.

- [ ] **Step 7: Check the dashboard**

Open `/finance/giving-contributions` in the web app. Expected: the contribution appears with status `success` and the correct amount.

- [ ] **Step 8: Check the cancel path**

Start another payment and close the browser without paying.

Expected: the row stays `pending`. It must **not** be marked failed — the donor may still complete the payment, and the webhook would then settle it.

- [ ] **Step 9: Check the subaccount actually received it**

In the Paystack dashboard, open the transaction and confirm the split shows the giving option's subaccount receiving the full amount with the subaccount bearing the fee.

Expected: subaccount receives 100%, fee borne by subaccount. If the main account received it instead, `bearer` or `subaccount` was not sent — recheck Task 6.

---

### Task 18: Open the pull requests

One PR per repo. Never combine.

- [ ] **Step 1: Backend**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend push -u origin feat/giving-options-phase-2
gh pr create --repo WWW-Ministries-Project/Backend --base main \
  --head feat/giving-options-phase-2 \
  --title "Giving Options phase 2: donor checkout, webhook, contributions" \
  --body "$(cat <<'EOF'
Phase 2 of giving options. Phase 1 shipped configuration and Paystack
subaccounts; this adds the payment loop.

- New `givingContribution` table. Amounts are integer minor units.
- `POST /givingoption/initialize` routes to the option's subaccount with
  `bearer: "subaccount"`, so the fee comes out of the option's share.
- Webhook signature verified as HMAC SHA512 over the raw request body.
- The webhook and on-demand verify share one idempotent settle path, so a
  duplicate delivery cannot double-write or double-send a receipt.
- Receipt email on success; a send failure never unwinds a settled payment.

Merging runs `prisma migrate deploy` against the dev database immediately.
Deploy this before the Frontend or Mobile changes.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 2: Frontend**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend push -u origin feat/giving-options-phase-2
gh pr create --repo WWW-Ministries-Project/Frontend --base development \
  --head feat/giving-options-phase-2 \
  --title "Giving contributions dashboard" \
  --body "$(cat <<'EOF'
Adds the read-only giving contributions table under Finance, plus the phase 2
design spec and updated backend contract.

Requires the Backend phase 2 PR to be deployed first.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Mobile**

```bash
git -C /Users/akwaah/Documents/GitHub/wwm-mobile push -u origin codex/giving-phase-2
gh pr create --repo Akwaah/wwm-mobile --base dev \
  --head codex/giving-phase-2 \
  --title "Real giving on the Give tab" \
  --body "$(cat <<'EOF'
Replaces the eight hardcoded "Coming soon" rows with giving options fetched
from the backend, plus amount entry, Paystack checkout, and giving history.

Ship last: requires the Backend phase 2 deploy.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Coverage check against the spec

| Spec section | Task |
|---|---|
| Data model | 1 |
| `GET /available` | 6, 8 |
| `POST /initialize` | 6, 8 |
| `GET /verify/:reference` | 6, 8 |
| `GET /my-contributions` | 6, 8 |
| `GET /contributions` | 6, 8 |
| `POST /paystack-webhook` | 3, 7, 8 |
| Route ordering hazard | 8 |
| Settlement idempotency | 6, verified in 17 |
| Amount mismatch handling | 6, 12 |
| Webhook signature + raw body | 3, verified in 9 |
| Receipt email | 4, 6, verified in 17 |
| Mobile Give screen | 14, 15, 16 |
| Web contributions page | 11, 12, 13 |
| Error handling table | 6, 7, verified in 17 |
| Verification commands | every task |
| Deploy order | 18 |
