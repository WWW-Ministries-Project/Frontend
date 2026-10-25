import { ApiExecution } from "../apiConstructor";
import { fetchData } from "../apiFunctions";
import type { ApiResponse } from "../../interfaces";

/** The role's Messaging actions, resolved by the API for the active branch. */
export interface MessagingActions {
  send_in_app: boolean;
  send_email: boolean;
  send_sms: boolean;
  schedule: boolean;
  include_visitors: boolean;
  view_recipient_contacts: boolean;
  retry_paid: boolean;
  edit_templates: boolean;
  toggle_automatic: boolean;
}

export interface MessagingAccess {
  actions: MessagingActions;
  /** Departments the role may message; null means the whole church. */
  departmentIds: number[] | null;
}

export const NO_MESSAGING_ACCESS: MessagingAccess = {
  actions: {
    send_in_app: false,
    send_email: false,
    send_sms: false,
    schedule: false,
    include_visitors: false,
    view_recipient_contacts: false,
    retry_paid: false,
    edit_templates: false,
    toggle_automatic: false,
  },
  departmentIds: null,
};

const client = new ApiExecution({ fetchExecutor: fetchData });

/** `GET /messaging/access` */
export const fetchMessagingAccess = (): Promise<ApiResponse<MessagingAccess>> =>
  client.fetchData<MessagingAccess>("messaging/access");
