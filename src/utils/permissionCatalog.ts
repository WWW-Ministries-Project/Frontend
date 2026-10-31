/**
 * What each permission module lets a role do beyond its level, and whose
 * records it can be limited to. A level switches on every action whose
 * `defaultLevel` it reaches; a role can then switch individual actions on or
 * off (`Actions`) and narrow whose records it sees (`Scopes`).
 *
 * See docs/permissions/PERMISSIONS_AUDIT_AND_REDESIGN.md §6–7. The Backend
 * stores `Actions` and `Scopes` on the access level; most actions are not yet
 * enforced by the API.
 */

export type ScopeValue =
  | "own"
  | "assigned"
  | "department"
  | "department_member"
  | "life_center"
  | "branch";

/** 1 = View, 2 = Manage, 3 = Full. */
export type LevelRank = 0 | 1 | 2 | 3;

export interface CatalogAction {
  key: string;
  label: string;
  /** The lowest level that switches it on by default. */
  defaultLevel: 1 | 2 | 3;
  /** Granted on purpose only: never switched on by a level, template or "Set all". */
  explicit?: boolean;
  /** The feature behind it doesn't exist yet. */
  isNew?: boolean;
  note?: string;
  /** `Domain.action` this one also needs to be useful. */
  requires?: string;
}

export interface ModuleCatalog {
  scopes: ScopeValue[];
  /** Scope a View-only role starts with; otherwise "branch". */
  viewScope?: ScopeValue;
  /** Module-specific wording for the "assigned" scope. */
  assignedLabel?: string;
  assignedDescription?: string;
  actions: CatalogAction[];
}

const act = (
  key: string,
  label: string,
  defaultLevel: 1 | 2 | 3,
  extra: Omit<CatalogAction, "key" | "label" | "defaultLevel"> = {}
): CatalogAction => ({ key, label, defaultLevel, ...extra });

const CHAIN = "The approval chain decides which records";

export const PERMISSION_CATALOG: Record<string, ModuleCatalog> = {
  Reports: {
    scopes: ["department", "branch"],
    actions: [
      act("event_generate", "Generate event reports", 2),
      act("event_approve", "Approve or return event reports", 1, { note: CHAIN }),
      act("event_comment", "Comment on event reports", 1),
      act("event_export", "Export event reports", 1),
      act("dept_prepare", "Prepare and submit department reports", 2, { note: "Heads of department too" }),
      act("dept_approve", "Approve or return department reports", 1, { note: CHAIN }),
      act("dept_remind", "Remind departments about late reports", 2),
      act("dept_view_member_names", "See member names in report attendance", 2),
      act("dept_decide_request", "Decide requests to leadership", 3),
      act("exec_view", "View the executive summary", 1),
      act("exec_decide", "Decide on the executive summary", 3),
      act("event_configure_approvals", "Change the event report approval chain", 3, { explicit: true }),
      act("configure", "Set up reports and responsible departments", 3, { note: "Moved from Settings" }),
    ],
  },
  Members: {
    scopes: ["department", "life_center", "branch"],
    actions: [
      act("view_contact_details", "See phone, email and address", 1),
      act("create", "Add members", 2),
      act("edit", "Edit profiles", 2),
      act("change_status", "Change status and membership status", 2),
      act("link_family", "Link family members", 2),
      act("send_password_link", "Send password links", 2),
      act("export", "Export member lists", 2),
      act("grant_login", "Give admin sign-in", 3),
      act("delete", "Delete members", 3),
    ],
  },
  Membership_Management: {
    scopes: ["department", "branch"],
    actions: [
      act("view_pipelines", "View pipelines", 1),
      act("confirm_member", "Confirm members", 2),
      act("decide_guest_request", "Decide guest requests", 2),
      act("decide_join_request", "Decide department join requests", 2, {
        note: "Heads of department too, for departments they lead",
      }),
      act("convert_visitor", "Convert visitors to members", 2, { requires: "Members.create" }),
      act("convert_soul", "Convert souls won to members", 2, { requires: "Members.create" }),
    ],
  },
  Visitors: {
    scopes: ["assigned", "branch"],
    viewScope: "assigned",
    assignedLabel: "Visitors they’re responsible for",
    assignedDescription: "Only visitors where they are a responsible member",
    actions: [
      act("record_follow_up", "Record follow-ups", 1),
      act("log_visit", "Log visits", 2),
      act("assign_responsible", "Assign responsible members", 2),
      act("manage_prayer_requests", "Manage prayer requests", 2),
      act("convert_to_member", "Convert to member", 2, { requires: "Members.create" }),
      act("export", "Export visitors", 2),
      act("delete", "Delete visitors", 3),
    ],
  },
  "Life Center": {
    scopes: ["life_center", "branch"],
    viewScope: "life_center",
    actions: [
      act("record_souls", "Record souls won", 2, { note: "Leaders too, for centers they lead" }),
      act("record_meeting", "Record meetings and offerings", 2, { note: "Leaders too, for centers they lead" }),
      act("export", "Export", 2),
      act("assign_members", "Assign members", 2),
      act("assign_leader", "Assign leaders", 2),
      act("remind_leader", "Remind leaders", 2),
      act("manage_roles", "Manage center roles", 3),
      act("delete", "Delete life centers", 3),
    ],
  },
  Church_Attendance: {
    scopes: ["department", "branch"],
    actions: [
      act("record", "Record attendance", 2),
      act("record_official", "Record official headcounts", 2),
      act("edit_past", "Edit past attendance", 2),
      act("import_biometric", "Import biometric records", 2),
      act("export", "Export", 2),
      act("manage_devices", "Manage biometric devices", 3, { note: "Moved from Settings" }),
      act("configure_timing", "Set early, on-time and late rules", 3, { note: "Moved from Settings" }),
      act("delete", "Delete records", 3),
    ],
  },
  Rides: {
    scopes: ["branch"],
    actions: [
      act("view_overview", "View the rides overview", 1),
      act("cancel_any_offer", "Cancel any ride offer", 2),
      act("manage_pickup_points", "Manage pickup points", 2),
      act("resolve_safety_reports", "Resolve safety reports", 2, { explicit: true }),
      act("lift_block", "Lift blocks on members", 2, { explicit: true }),
      act("export_roster", "Export the rider roster", 2, { explicit: true, note: "Includes phone numbers" }),
    ],
  },
  Departments: {
    scopes: ["department", "branch"],
    actions: [
      act("create", "Create departments", 2, { note: "Not with “Departments they lead”" }),
      act("edit", "Edit departments", 2),
      act("manage_members", "Manage members", 2),
      act("assign_positions", "Assign positions", 2),
      act("assign_head", "Assign the head", 3),
      act("delete", "Delete departments", 3),
    ],
  },
  Events: {
    scopes: ["branch"],
    actions: [
      act("view_registrations", "View registrations", 1),
      act("create", "Create events", 2),
      act("edit", "Edit events", 2),
      act("manage_series", "Manage series", 2),
      act("manage_online_links", "Manage online links", 2),
      act("send_reminders", "Send reminders", 2),
      act("check_in", "Run check-in", 2),
      act("export_registrants", "Export registrants", 2),
      act("manage_types", "Manage event types", 3),
      act("delete", "Delete events", 3),
    ],
  },
  Appointments: {
    scopes: ["own", "branch"],
    viewScope: "own",
    actions: [
      act("respond", "Confirm, decline or suggest a time", 1),
      act("complete", "Mark complete or no-show", 1),
      act("manage_own_availability", "Set their own availability", 1),
      act("book_for_others", "Book for others", 2),
      act("cancel_any", "Cancel any appointment", 2),
      act("reassign", "Reassign", 2),
      act("send_reminders", "Send reminders", 2),
      act("manage_others_availability", "Set other people’s availability", 2),
      act("export", "Export", 2),
      act("configure", "Appointment settings and reasons", 3),
      act("delete", "Delete appointments", 3),
    ],
  },
  School_of_ministry: {
    scopes: ["assigned", "branch"],
    viewScope: "assigned",
    assignedLabel: "Cohorts they instruct",
    assignedDescription: "Only cohorts where they are an instructor",
    actions: [
      act("view_reports", "View reports", 1),
      act("grade", "Grade work", 1, { note: "Instructors, for their cohorts" }),
      act("take_attendance", "Take class attendance", 1),
      act("manage_assignments", "Manage assignments and due dates", 1),
      act("announce", "Send cohort announcements", 1, { note: "SMS also needs Messaging › Send SMS" }),
      act("design_curriculum", "Design curriculum", 2),
      act("manage_cohorts", "Manage cohorts", 2),
      act("enroll_others", "Enrol other people", 2),
      act("decide_applications", "Decide applications", 2),
      act("edit_progress", "Edit learner progress", 2),
      act("issue_certificates", "Issue certificates", 3),
      act("manage_instructors", "Manage instructors", 3),
      act("delete", "Delete programs, cohorts and classes", 3),
    ],
  },
  Theme: {
    scopes: ["branch"],
    actions: [act("edit", "Edit themes", 2), act("publish", "Publish themes", 2)],
  },
  Community: {
    scopes: ["department", "branch"],
    actions: [
      act("post_church_wide", "Post church-wide", 2),
      act("post_any_department", "Post in any department", 2),
      act("pin_important", "Pin as important", 2),
      act("moderate", "Remove, restore or warn", 2),
      act("view_audit_log", "View the moderation log", 3),
      act("delete_any", "Delete any post", 3),
      act("view_anonymous_author", "See who wrote anonymous posts", 3, { explicit: true }),
    ],
  },
  Sermons: {
    scopes: ["branch"],
    actions: [
      act("view_drafts", "View drafts", 1),
      act("create", "Add sermons", 2),
      act("publish", "Publish", 2),
      act("manage_series", "Manage series", 2),
      act("delete", "Delete sermons", 3),
    ],
  },
  Promotions: {
    scopes: ["branch"],
    actions: [
      act("create", "Create banners", 2),
      act("publish", "Publish", 2),
      act("archive", "Archive", 2),
      act("reorder", "Reorder", 2),
      act("delete", "Delete banners", 3),
    ],
  },
  Messaging: {
    scopes: ["department", "branch"],
    actions: [
      act("send_in_app", "Send in-app messages", 2),
      act("send_email", "Send email", 2),
      act("schedule", "Schedule messages", 2),
      act("include_visitors", "Include visitors in the audience", 2),
      act("view_recipient_contacts", "See recipients’ contacts", 2),
      act("send_sms", "Send SMS", 2, { explicit: true, note: "Costs money" }),
      act("retry_paid", "Retry failed paid messages", 2, { explicit: true }),
      act("edit_templates", "Edit templates", 3),
      act("toggle_automatic", "Turn automatic messages on or off", 3),
      act("approve_sms", "Approve large SMS sends", 3, { explicit: true, isNew: true }),
    ],
  },
  Financials: {
    scopes: ["branch"],
    actions: [
      act("approve", "Approve or return records", 1, { note: "The approval chain decides which; never their own" }),
      act("create_draft", "Create drafts", 2),
      act("submit", "Submit records", 2),
      act("export", "Export", 2),
      act("configure", "Receipts, payment methods, banks and tithe split", 3, { note: "Moved from Settings" }),
      act("delete", "Delete records", 3),
      act("edit_approved", "Edit approved records", 3, { explicit: true }),
      act("configure_approvals", "Change the finance approval chain", 3, {
        explicit: true,
        note: "Can’t name themselves",
      }),
    ],
  },
  Giving: {
    scopes: ["branch"],
    actions: [
      act("manage_options", "Manage giving options", 2),
      act("view_donor_details", "See donor details", 2),
      act("reconcile_payment", "Reconcile payments", 2),
      act("message_donor", "Message donors", 2),
      act("export", "Export", 2),
      act("view_full_account_number", "See full account numbers", 3),
      act("archive", "Archive options", 3),
      act("manage_settlement_account", "Change the settlement account", 3, { explicit: true }),
    ],
  },
  Pledges: {
    scopes: ["assigned", "branch"],
    viewScope: "assigned",
    assignedLabel: "Pledgers they call",
    assignedDescription: "Only pledgers assigned to them as caller",
    actions: [
      act("create", "Create pledges", 2),
      act("edit", "Edit pledges", 2),
      act("record_redemption", "Record redemptions", 2),
      act("reconcile_online", "Reconcile online payments", 2),
      act("send_reminders", "Send reminders", 2),
      act("manage_callers", "Manage callers", 2),
      act("view_payer_details", "See payer details", 2),
      act("export", "Export", 2),
      act("delete", "Delete pledges", 3),
      act("reverse_redemption", "Reverse a redemption", 3, { explicit: true, note: "Changes the ledger" }),
    ],
  },
  Requisition: {
    scopes: ["own", "department", "branch"],
    viewScope: "own",
    actions: [
      act("raise", "Raise requisitions", 1, { note: "They also need to be on the requester list" }),
      act("approve", "Approve or reject their step", 1, { note: CHAIN }),
      act("edit_as_approver", "Edit while approving", 1, { note: CHAIN }),
      act("comment", "Comment", 1),
      act("delete_own_draft", "Delete their own drafts", 1),
      act("raise_for_any_department", "Raise for any department", 2),
      act("send_reminders", "Send reminders", 2),
      act("export", "Export", 2),
      act("mark_disbursed", "Mark as disbursed", 2, { explicit: true, isNew: true }),
      act("delete", "Delete any requisition", 3, { note: "Blocked once approved" }),
      act("override_step", "Override an approval step", 3, { explicit: true }),
      act("configure_approvals", "Change the approval chain", 3, {
        explicit: true,
        note: "Being an approver no longer gives this",
      }),
    ],
  },
  Asset: {
    scopes: ["department_member", "department", "branch"],
    actions: [
      act("count", "Count stock", 1),
      act("create", "Add assets", 2),
      act("edit", "Edit assets", 2),
      act("assign", "Assign assets", 2),
      act("change_status", "Change status", 2),
      act("raise_requisition", "Raise a repair requisition", 2, { requires: "Requisition.raise" }),
      act("clear_repair", "Clear repairs", 2),
      act("stock_check", "Start, cancel or close stock checks", 2),
      act("reconcile", "Reconcile counts", 2),
      act("request_recount", "Request a recount", 2),
      act("export", "Export", 2),
      act("delete", "Delete assets", 3),
      act("write_off", "Write off assets", 3, { explicit: true }),
    ],
  },
  Marketplace: {
    scopes: ["branch"],
    actions: [
      act("manage_markets", "Manage markets", 2),
      act("manage_catalog", "Manage the catalogue", 2),
      act("publish_product", "Publish products", 2),
      act("create_order_for_member", "Create orders for members", 2),
      act("fulfil_order", "Fulfil orders", 2),
      act("edit_order_items", "Edit order items", 2),
      act("cancel_any_order", "Cancel any order", 2),
      act("reconcile_payments", "Reconcile payments", 2),
      act("export_orders", "Export orders", 2),
      act("mark_paid", "Mark orders paid", 2, { explicit: true, note: "Records who marked it" }),
      act("delete", "Delete", 3),
    ],
  },
  Access_rights: {
    scopes: ["branch"],
    actions: [
      act("create_role", "Create roles", 2),
      act("edit_role", "Edit roles", 2, { note: "Never their own, and only up to their own access" }),
      act("assign_roles", "Assign roles", 2),
      act("edit_workspaces", "Edit Home workspaces", 2),
      act("invite_users", "Invite users", 2),
      act("reset_password", "Reset passwords", 2),
      act("deactivate_users", "Deactivate users", 2),
      act("delete_role", "Delete roles", 3),
    ],
  },
  Positions: {
    scopes: ["branch"],
    actions: [
      act("create", "Create positions", 2),
      act("edit", "Edit positions", 2),
      act("delete", "Delete positions", 3),
    ],
  },
  Settings: {
    scopes: ["branch"],
    actions: [
      act("view_logs", "View logs", 1),
      act("configure_general", "Change general configuration", 2),
      act("manage_branches", "Create and edit branches", 3, {
        explicit: true,
        note: "Needs this role in every branch",
      }),
    ],
  },
  AI: {
    scopes: ["branch"],
    actions: [
      act("chat", "Use the assistant", 1),
      act("generate_insights", "Generate insights", 1),
      act("query_data", "Ask about church data", 1, { note: "Only data they can already see" }),
      act("view_tasks", "View assistant tasks", 1),
      act("view_usage", "View usage", 1),
      act("manage_credentials", "Manage AI credentials", 3, { explicit: true }),
    ],
  },
};

const SCOPE_LABEL: Record<ScopeValue, string> = {
  own: "Only their own",
  assigned: "Assigned to them",
  department: "Departments they lead",
  department_member: "Departments they belong to",
  life_center: "Life centers they lead",
  branch: "Whole branch",
};

const SCOPE_DESCRIPTION: Record<ScopeValue, string> = {
  own: "Records they created or that are about them",
  assigned: "Only records assigned to them",
  department: "Departments where they are head or hold a leadership position",
  department_member: "Any department they are a member of",
  life_center: "Life centers where they are the leader",
  branch: "Everything in the branch the role is given in",
};

export const SCOPE_VALUES = Object.keys(SCOPE_LABEL) as ScopeValue[];

export const isScopeValue = (value: unknown): value is ScopeValue =>
  typeof value === "string" && (SCOPE_VALUES as string[]).includes(value);

export const scopeLabel = (domain: string, scope: ScopeValue) =>
  (scope === "assigned" && PERMISSION_CATALOG[domain]?.assignedLabel) || SCOPE_LABEL[scope];

export const scopeDescription = (domain: string, scope: ScopeValue) =>
  (scope === "assigned" && PERMISSION_CATALOG[domain]?.assignedDescription) || SCOPE_DESCRIPTION[scope];

/** Whether a level switches the action on by itself. */
export const actionDefault = (rank: LevelRank, action: CatalogAction) =>
  rank > 0 && !action.explicit && rank >= action.defaultLevel;

/** The scope a module starts with at a level. */
export const defaultScope = (rank: LevelRank, domain: string): ScopeValue =>
  (rank === 1 && PERMISSION_CATALOG[domain]?.viewScope) || "branch";

export type ActionOverrides = Record<string, Record<string, boolean>>;

/**
 * An action is on when the role has the module and either overrides it or its
 * level reaches it. `overrides` is undefined for a role saved before actions
 * existed: its on-purpose actions then follow the level, as they did before
 * (mirrors the API's `isLegacyRole`).
 */
export const actionAllowed = (rank: LevelRank, overrides: ActionOverrides | undefined, domain: string, action: CatalogAction) => {
  if (!rank) return false;
  const override = overrides?.[domain]?.[action.key];
  if (override !== undefined) return override;
  if (!overrides && action.explicit) return rank >= action.defaultLevel;
  return actionDefault(rank, action);
};

/**
 * For a role saved before actions existed: switches on the on-purpose actions
 * its levels already gave it, so saving it in the new editor keeps them.
 */
export const legacyExplicitActions = (rankOf: (domain: string) => LevelRank): ActionOverrides => {
  const out: ActionOverrides = {};
  Object.entries(PERMISSION_CATALOG).forEach(([domain, entry]) => {
    const rank = rankOf(domain);
    entry.actions.forEach((a) => {
      if (a.explicit && rank >= a.defaultLevel) (out[domain] = out[domain] || {})[a.key] = true;
    });
  });
  return out;
};

export const findAction = (key: string) => {
  const [domain, actionKey] = key.split(".");
  return { domain, action: PERMISSION_CATALOG[domain]?.actions.find((a) => a.key === actionKey) };
};

/** `{ Domain: { action: true } }` for every on-purpose action. */
export const allExplicitActions = (): ActionOverrides => {
  const out: ActionOverrides = {};
  Object.entries(PERMISSION_CATALOG).forEach(([domain, entry]) =>
    entry.actions.forEach((a) => {
      if (a.explicit) (out[domain] = out[domain] || {})[a.key] = true;
    })
  );
  return out;
};

/** Reads `Actions` from a stored permission payload. */
export const normalizeActionOverrides = (value: unknown): ActionOverrides => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: ActionOverrides = {};
  Object.entries(value as Record<string, unknown>).forEach(([domain, map]) => {
    if (!map || typeof map !== "object" || Array.isArray(map)) return;
    Object.entries(map as Record<string, unknown>).forEach(([key, on]) => {
      if (typeof on === "boolean") (out[domain] = out[domain] || {})[key] = on;
    });
  });
  return out;
};
