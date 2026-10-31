import { useBackNavigation } from "@/CustomHooks/useBackNavigation";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import ScheduleEventEditor, { type ScheduleEditorMode } from "../Components/ScheduleEventEditor";
import { EVENTS_PATHS, monthKeyOf } from "../utils/eventsModel";

/**
 * Full-page version of the schedule form, kept for deep links
 * (`/home/manage-event?event_id=…&edit_scope=…`). The events pages open the
 * same editor in a side panel.
 */
const CreateEvent = () => {
  const navigate = useNavigate();
  const back = useBackNavigation(EVENTS_PATHS.scheduled);
  const location = useLocation();

  const mode = useMemo<ScheduleEditorMode>(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("event_id") ?? params.get("id");
    if (id) {
      const scope = params.get("edit_scope");
      return {
        kind: "edit",
        id,
        scope: scope === "all" || scope === "following" ? scope : null,
      };
    }
    return {
      kind: "new",
      prefill: {
        eventNameId: params.get("event_name_id") ?? undefined,
        date: params.get("date") ?? undefined,
      },
    };
  }, [location.search]);

  return (
    <div className="p-4 md:p-6">
      <ScheduleEventEditor
        frame="page"
        mode={mode}
        onClose={back.goBack}
        onSaved={({ date }) =>
          navigate(date ? `${EVENTS_PATHS.scheduled}?month=${monthKeyOf(date)}` : EVENTS_PATHS.scheduled)
        }
      />
    </div>
  );
};

export default CreateEvent;
