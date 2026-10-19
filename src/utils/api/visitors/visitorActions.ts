import { Workbook } from "exceljs";

import { api } from "@/utils/api/apiCalls";
import { downloadBlobFile } from "@/utils/helperFunctions";

import type {
  FollowUpPayloadType,
  VisitorPayloadType,
  VisitorType,
} from "./interfaces";

/**
 * Visitor mutations used by the Visitors list and visitor details screens.
 * They call the API directly so dialogs can await the result and show errors
 * inline; callers refetch afterwards.
 */

type Id = string | number;

export const COMPLETED_STATUS = "completed";
export const PENDING_STATUS = "pending";

export const isCompletedStatus = (status?: string | null) =>
  String(status || "").trim().toLowerCase() === COMPLETED_STATUS;

const toIsoDate = (value: unknown): string => {
  if (!value) return "";
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

/** Ids from `responsibleMembers` in any of the shapes the API has returned. */
export const responsibleMemberIds = (visitor: VisitorType): number[] => {
  const raw = visitor.responsibleMembers || visitor.responsible_members || [];
  return Array.from(
    new Set(
      raw
        .map((entry) =>
          typeof entry === "object" && entry !== null
            ? Number(entry.id ?? entry.value)
            : Number(entry)
        )
        .filter((id) => Number.isInteger(id) && id > 0)
    )
  );
};

/**
 * Full update body built from the stored visitor. `PUT visitor/visitor`
 * overwrites every field it reads (and needs a string email and a valid visit
 * date), so edits always start from the current record.
 */
export const visitorToPayload = (visitor: VisitorType): VisitorPayloadType => ({
  personal_info: {
    title: visitor.title || "",
    first_name: visitor.firstName || "",
    last_name: visitor.lastName || "",
    other_name: visitor.otherName || "",
    gender: visitor.gender || "",
  },
  contact_info: {
    email: visitor.email || "",
    phone: { country_code: visitor.country_code || "", number: visitor.phone || "" },
    resident_country: visitor.country || "",
    state_region: visitor.state || "",
    city: visitor.city || "",
    address: visitor.address || "",
  },
  visit: {
    date: toIsoDate(visitor.visitDate) || toIsoDate(visitor.createdAt),
    howHeard: visitor.howHeard || "",
  },
  consentToContact: Boolean(visitor.consentToContact),
  membershipWish: Boolean(visitor.membershipWish),
  responsibleMembers: responsibleMemberIds(visitor),
  isClergy: Boolean(visitor.isClergy),
  clergy_info: {
    churchName: visitor.churchName || "",
    churchLocation: visitor.churchLocation || "",
    churchRole: visitor.churchRole || "",
  },
});

export const createVisitor = (payload: VisitorPayloadType) =>
  api.post.createVisitor(payload);

export const updateVisitor = (id: Id, payload: VisitorPayloadType) =>
  api.put.updateVisitor(payload, { id: String(id) });

export const deleteVisitor = (id: Id) => api.delete.deleteVisitor({ id: String(id) });

export const setResponsibleMembers = (visitor: VisitorType, ids: number[]) =>
  updateVisitor(visitor.id, { ...visitorToPayload(visitor), responsibleMembers: ids });

export const recordVisit = (
  visitorId: Id,
  visit: { date: string; eventId: string; notes: string }
) => api.post.createVisit({ visitorId: String(visitorId), ...visit });

export const removeVisit = (visitId: Id) => api.delete.deleteVisit({ id: String(visitId) });

export interface FollowUpInput {
  date: string;
  type: string;
  assignedTo: string;
  notes: string;
  status: string;
}

/**
 * Creates or updates a follow-up. The create endpoint always stores
 * "pending", so a follow-up recorded as completed is updated straight after.
 */
export const saveFollowUp = async (
  visitorId: Id,
  input: FollowUpInput,
  followUpId?: Id
) => {
  const body: FollowUpPayloadType = {
    visitorId: Number(visitorId),
    date: input.date,
    type: input.type,
    assignedTo: Number(input.assignedTo),
    notes: input.notes,
    status: input.status,
  };
  if (followUpId !== undefined) {
    return api.put.updateFollowUp(body, { id: String(followUpId) });
  }
  const created = await api.post.createFollowUp(body);
  const createdId = (created?.data as { id?: Id } | undefined)?.id;
  if (createdId !== undefined && isCompletedStatus(input.status)) {
    await api.put.updateFollowUp(body, { id: String(createdId) });
  }
  return created;
};

/* -------------------------------------------------------------------------- */
/*                                   Export                                   */
/* -------------------------------------------------------------------------- */

export interface VisitorExportRow {
  title: string;
  firstName: string;
  lastName: string;
  gender: string;
  phone: string;
  email: string;
  city: string;
  firstVisit: string;
  lastVisit: string;
  visits: number;
  event: string;
  referral: string;
  followUps: number;
  status: string;
}

export const exportVisitorsToExcel = async (
  rows: VisitorExportRow[],
  fileName = "Visitors.xlsx"
) => {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("Visitors");
  sheet.columns = [
    { header: "Title", key: "title", width: 8 },
    { header: "First name", key: "firstName", width: 18 },
    { header: "Last name", key: "lastName", width: 18 },
    { header: "Gender", key: "gender", width: 10 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Email", key: "email", width: 30 },
    { header: "City", key: "city", width: 16 },
    { header: "First visit", key: "firstVisit", width: 14 },
    { header: "Last visit", key: "lastVisit", width: 14 },
    { header: "Visits", key: "visits", width: 8 },
    { header: "Event", key: "event", width: 28 },
    { header: "Referral", key: "referral", width: 18 },
    { header: "Follow-ups", key: "followUps", width: 12 },
    { header: "Status", key: "status", width: 18 },
  ];
  sheet.getRow(1).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlobFile(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    fileName
  );
};
