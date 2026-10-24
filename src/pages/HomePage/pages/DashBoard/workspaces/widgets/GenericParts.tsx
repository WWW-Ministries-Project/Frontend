import { useState } from "react";

import { notify } from "@/components/feedback";
import { UiButton } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { api } from "@/utils/api/apiCalls";
import type { GenericEvent } from "@/utils/api/workspaces/interfaces";

import type { WidgetCtx } from "../wsTypes";

/** One-tap event registration for the Personal workspace. */
export const RegisterButton = ({ event, ctx }: { event: GenericEvent; ctx: WidgetCtx }) => {
  const [busy, setBusy] = useState(false);
  const [registered, setRegistered] = useState(event.registered);
  if (registered) {
    return (
      <UiButton tone="secondary" disabled aria-pressed className="flex-shrink-0">
        Registered ✓
      </UiButton>
    );
  }
  if (!event.can_register || event.ref_id === undefined) return null;
  return (
    <UiButton
      tone="primary"
      className="flex-shrink-0"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await api.post.registerEvent({ event_id: event.ref_id as number });
          setRegistered(true);
          notify.success({ title: "You’re registered", message: event.title });
          ctx.refetch();
        } catch (error) {
          notify.fromError(error, { title: "Couldn't register you" });
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Registering…" : "Register"}
    </UiButton>
  );
};
