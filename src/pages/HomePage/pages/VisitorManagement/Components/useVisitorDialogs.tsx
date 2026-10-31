import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { showNotification } from "@/pages/HomePage/utils";
import {
  buildVisitorPrefillForm,
  errorText,
  memberManagePath,
  visitorSourceLabel,
} from "@/pages/HomePage/pages/MembershipManagement/components/manager/managerHelpers";
import {
  DialogShell,
  SelectOption,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import type { VisitorType } from "@/utils/api/visitors/interfaces";
import { deleteVisitor } from "@/utils/api/visitors/visitorActions";

import { visitorName } from "../utils/visitorHelpers";
import {
  AssignResponsibleDialog,
  FollowUpDialog,
  FollowUpDraft,
  VisitDialog,
  VisitorFormDialog,
} from "./VisitorDialogs";

type DialogState =
  | { kind: "form"; visitor: VisitorType | null }
  | { kind: "another" }
  | { kind: "visit"; visitor: VisitorType }
  | { kind: "followUp"; visitor: VisitorType; draft: FollowUpDraft | null }
  | { kind: "assign"; visitor: VisitorType }
  | { kind: "delete"; visitor: VisitorType }
  | null;

/** Members who can be picked as "Assigned to" for a visitor's follow-ups. */
export const responsibleOptions = (visitor: VisitorType): SelectOption[] => {
  const seen = new Set<string>();
  return (visitor.responsibleMembersNames ?? []).reduce<SelectOption[]>((acc, member) => {
    const value = String(member.userId ?? "");
    if (!value || seen.has(value) || !member.name) return acc;
    seen.add(value);
    acc.push({ value, label: member.name });
    return acc;
  }, []);
};

/**
 * Register/edit, visit, follow-up, responsible-person and delete dialogs shared
 * by the Visitors list and the visitor details page. Render `dialogs` once.
 */
export const useVisitorDialogs = ({
  onChanged,
  onDeleted,
  afterConvertPath,
}: {
  onChanged: () => unknown;
  onDeleted?: () => void;
  afterConvertPath: string;
}) => {
  const navigate = useNavigate();
  const [state, setState] = useState<DialogState>(null);
  const [deleting, setDeleting] = useState(false);
  const close = () => setState(null);
  const saved = () => {
    close();
    void onChanged();
  };

  const visitorOf = (kind: NonNullable<DialogState>["kind"]) =>
    state && state.kind === kind && "visitor" in state ? state.visitor : null;

  const openFollowUp = (visitor: VisitorType, draft: FollowUpDraft | null = null) => {
    // Follow-ups are assigned to a responsible person, so assign one first.
    if (responsibleOptions(visitor).length === 0) {
      setState({ kind: "assign", visitor });
      return;
    }
    setState({ kind: "followUp", visitor, draft });
  };

  const convert = (visitor: VisitorType) =>
    navigate(memberManagePath, {
      state: {
        afterSubmitPath: afterConvertPath,
        prefillMemberForm: buildVisitorPrefillForm(visitor),
        prefillSourceLabel: visitorSourceLabel(visitor),
        sourceVisitorId: visitor.id,
      },
    });

  const confirmDelete = async () => {
    const visitor = visitorOf("delete");
    if (!visitor) return;
    setDeleting(true);
    try {
      await deleteVisitor(visitor.id);
      showNotification("Visitor deleted", "success");
      close();
      if (onDeleted) onDeleted();
      else void onChanged();
    } catch (error) {
      showNotification(errorText(error, "Could not delete the visitor."), "error");
    } finally {
      setDeleting(false);
    }
  };

  const followUpState = state?.kind === "followUp" ? state : null;
  const deleteTarget = visitorOf("delete");

  const dialogs = (
    <>
      <VisitorFormDialog
        open={state?.kind === "form"}
        visitor={visitorOf("form")}
        onClose={close}
        onSaved={(created) => {
          void onChanged();
          setState(created ? { kind: "another" } : null);
        }}
      />
      <DialogShell
        open={state?.kind === "another"}
        onClose={close}
        title="Register another visitor?"
        subtitle="The visitor was registered. Would you like to add another?"
        ctaLabel="Register another"
        cancelLabel="Not now"
        onConfirm={() => setState({ kind: "form", visitor: null })}
      />
      <VisitDialog
        open={state?.kind === "visit"}
        visitor={visitorOf("visit")}
        onClose={close}
        onSaved={saved}
      />
      <FollowUpDialog
        open={Boolean(followUpState)}
        visitor={followUpState?.visitor ?? null}
        draft={followUpState?.draft}
        responsible={followUpState ? responsibleOptions(followUpState.visitor) : []}
        onClose={close}
        onSaved={saved}
      />
      <AssignResponsibleDialog
        open={state?.kind === "assign"}
        visitor={visitorOf("assign")}
        onClose={close}
        onSaved={saved}
      />
      <DialogShell
        open={Boolean(deleteTarget)}
        onClose={close}
        title={deleteTarget ? `Delete ${visitorName(deleteTarget)}?` : "Delete visitor?"}
        subtitle="Their visits and follow-ups will be removed. This can’t be undone."
        ctaLabel="Delete"
        ctaTone="danger"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );

  return {
    dialogs,
    register: () => setState({ kind: "form", visitor: null }),
    edit: (visitor: VisitorType) => setState({ kind: "form", visitor }),
    recordVisit: (visitor: VisitorType) => setState({ kind: "visit", visitor }),
    recordFollowUp: openFollowUp,
    assign: (visitor: VisitorType) => setState({ kind: "assign", visitor }),
    remove: (visitor: VisitorType) => setState({ kind: "delete", visitor }),
    convert,
  };
};
