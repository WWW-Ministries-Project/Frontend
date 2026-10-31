import { useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthWrapper";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { normalizePermissionPayload, type PermissionMap } from "@/utils/accessControl";

export type SomAction =
  | "view_reports"
  | "grade"
  | "take_attendance"
  | "manage_assignments"
  | "announce"
  | "design_curriculum"
  | "manage_cohorts"
  | "enroll_others"
  | "decide_applications"
  | "edit_progress"
  | "issue_certificates"
  | "manage_instructors";

/** What instructors may do in the programs they teach, without a role (Backend programs/somAccess.ts). */
const INSTRUCTOR_ACTIONS = new Set<SomAction>([
  "grade",
  "manage_assignments",
  "edit_progress",
  "take_attendance",
  "announce",
  "design_curriculum",
  "manage_cohorts",
  "enroll_others",
]);

/** Actions that moved to Full; roles saved before actions keep them at Manage. */
const LEGACY_MANAGE_ACTIONS = new Set<SomAction>(["issue_certificates", "manage_instructors"]);

/**
 * School of Ministry rights for the signed-in user, mirroring the API:
 * the role's actions, plus what instructors do in their own programs (the
 * API checks which programs, and the roster abilities set per program).
 */
export const useSomAccess = () => {
  const { hasAction, canView, canManage, canAdmin, scopeFor, getScope, accessPermissions } =
    useAccessControl();
  const {
    user: { instructor },
  } = useAuth();

  const legacyRole = useMemo(
    () =>
      normalizePermissionPayload(accessPermissions as PermissionMap).Actions ===
      undefined,
    [accessPermissions]
  );

  const switchedOff = useCallback(
    (action: SomAction) => {
      const actions = normalizePermissionPayload(accessPermissions as PermissionMap)
        .Actions as Record<string, Record<string, boolean>> | undefined;
      return actions?.School_of_ministry?.[action] === false;
    },
    [accessPermissions]
  );

  /** Whether the role gives the action across the whole school. */
  const wholeSchool = scopeFor("School_of_ministry") === "branch";

  /**
   * Whether the user reads every program (not only the cohorts they
   * instruct). Roles saved before scopes keep reading the whole school.
   */
  const viewsAll =
    canView("School_of_ministry") &&
    (wholeSchool || (legacyRole && !getScope("School_of_ministry")));

  /** Whether the user may do this somewhere (their own programs at least). */
  const can = useCallback(
    (action: SomAction) => {
      if (hasAction(`School_of_ministry.${action}`)) return true;
      if (legacyRole && LEGACY_MANAGE_ACTIONS.has(action) && canManage("School_of_ministry")) {
        return true;
      }
      return Boolean(instructor) && INSTRUCTOR_ACTIONS.has(action) && !switchedOff(action);
    },
    [hasAction, legacyRole, canManage, instructor, switchedOff]
  );

  /** Whether the user may do this to any program (no "Cohorts they instruct" limit). */
  const canAll = useCallback(
    (action: SomAction) =>
      (hasAction(`School_of_ministry.${action}`) && wholeSchool) ||
      (legacyRole && LEGACY_MANAGE_ACTIONS.has(action) && canManage("School_of_ministry")),
    [hasAction, wholeSchool, legacyRole, canManage]
  );

  /**
   * Cohort announcements by email or SMS also need Messaging › Send email /
   * Send SMS. Roles saved before actions (and instructors without a role)
   * keep sending on every channel, as before.
   */
  const canUseChannel = useCallback(
    (channel: "inApp" | "email" | "sms") => {
      if (channel === "inApp" || legacyRole) return true;
      return hasAction(channel === "sms" ? "Messaging.send_sms" : "Messaging.send_email");
    },
    [legacyRole, hasAction]
  );

  return {
    can,
    canUseChannel,
    canAll,
    /** Deleting needs Full on School of Ministry. */
    canDelete: canAdmin("School_of_ministry"),
    viewsAll,
    instructor: Boolean(instructor),
  };
};
