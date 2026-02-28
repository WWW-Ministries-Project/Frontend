import { DateTime } from "luxon";
import type { ApprovalInstance } from "../types/approvalWorkflow";
import type { Requisition } from "../types/requestInterface";

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const toStringValue = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
};

const firstNonEmptyString = (...values: unknown[]): string => {
  for (const value of values) {
    const normalized = toStringValue(value);

    if (normalized) {
      return normalized;
    }
  }

  return "";
};

const parseDateTime = (value: unknown): DateTime | null => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    const parsedFromDate = DateTime.fromJSDate(value);
    return parsedFromDate.isValid ? parsedFromDate : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const parsedFromMillis = DateTime.fromMillis(value);
    return parsedFromMillis.isValid ? parsedFromMillis : null;
  }

  if (typeof value === "string") {
    const normalized = value.trim();

    if (!normalized) {
      return null;
    }

    const parsedFromIso = DateTime.fromISO(normalized);
    if (parsedFromIso.isValid) {
      return parsedFromIso;
    }

    const asNumber = Number(normalized);
    if (Number.isFinite(asNumber)) {
      const parsedFromNumber = DateTime.fromMillis(asNumber);
      if (parsedFromNumber.isValid) {
        return parsedFromNumber;
      }
    }

    const parsedFromJsDate = DateTime.fromJSDate(new Date(normalized));
    return parsedFromJsDate.isValid ? parsedFromJsDate : null;
  }

  return null;
};

const getNestedName = (value: unknown): string => {
  const record = asRecord(value);

  return firstNonEmptyString(
    record.name,
    record.full_name,
    record.fullName,
    record.display_name,
    record.displayName
  );
};

export type RequesterMeta = {
  name: string;
  department: string;
};

export const getRequesterMeta = (
  request: Requisition | Record<string, unknown>
): RequesterMeta => {
  const record = asRecord(request);
  const user = asRecord(record.user);
  const requester = asRecord(record.requester);
  const requesterDepartment = asRecord(requester.department);
  const summary = asRecord(record.summary);

  const name = firstNonEmptyString(
    requester.name,
    requester.requester_name,
    record.requester_name,
    record.requesterName,
    user.name,
    record.user_name,
    record.userName
  );

  const department = firstNonEmptyString(
    requesterDepartment.name,
    requester.department_name,
    requester.departmentName,
    record.requester_department,
    record.department_name,
    record.departmentName,
    summary.department,
    user.department_name,
    asRecord(user.department).name,
    record.department
  );

  return {
    name: name || "Unknown requester",
    department: department || "No department",
  };
};

export type EditMeta = {
  editorName: string | null;
  editedAtIso: string | null;
  formattedEditedAt: string | null;
  hasEditMeta: boolean;
};

export const getEditMeta = (request: unknown): EditMeta => {
  const record = asRecord(request);

  const editorName =
    firstNonEmptyString(
      record.editor_name,
      record.editorName,
      record.edited_by_name,
      record.editedByName,
      record.updated_by_name,
      record.updatedByName,
      record.last_edited_by_name,
      record.lastEditedByName,
      record.modified_by_name,
      record.modifiedByName,
      getNestedName(record.editor),
      getNestedName(record.edited_by_user),
      getNestedName(record.updated_by_user),
      getNestedName(record.last_edited_by),
      getNestedName(record.modified_by_user),
      getNestedName(record.updatedByUser),
      getNestedName(record.editedByUser),
      getNestedName(record.lastEditedBy)
    ) || null;

  const editedAt = parseDateTime(
    record.edited_at ??
      record.editedAt ??
      record.updated_at ??
      record.updatedAt ??
      record.last_edited_at ??
      record.lastEditedAt ??
      record.modified_at ??
      record.modifiedAt
  );

  const createdAt = parseDateTime(
    record.date_created ?? record.created_at ?? record.createdAt
  );

  const hasEditedTimestamp = Boolean(
    editedAt &&
      (!createdAt ||
        Math.abs(editedAt.toMillis() - createdAt.toMillis()) > 1000)
  );

  return {
    editorName,
    editedAtIso: editedAt?.toISO() ?? null,
    formattedEditedAt: editedAt?.toFormat("dd LLL yyyy, HH:mm") ?? null,
    hasEditMeta: Boolean(editorName || hasEditedTimestamp),
  };
};

export const getApproverDisplayName = (step: ApprovalInstance): string => {
  const record = asRecord(step);

  const name = firstNonEmptyString(
    record.approver_name,
    record.approverName,
    record.approver_user_name,
    record.approverUserName,
    getNestedName(record.approver_user),
    getNestedName(record.approver),
    getNestedName(record.configured_user),
    getNestedName(record.user)
  );

  if (name) {
    return name;
  }

  const approverId = firstNonEmptyString(
    record.approver_user_id,
    record.approverUserId
  );

  return approverId ? `User ${approverId}` : "Unassigned approver";
};

export const getActedByDisplayName = (step: ApprovalInstance): string => {
  const record = asRecord(step);

  const name = firstNonEmptyString(
    record.acted_by_name,
    record.actedByName,
    record.acted_by_user_name,
    record.actedByUserName,
    getNestedName(record.acted_by_user),
    getNestedName(record.actedByUser),
    getNestedName(record.actor),
    getNestedName(record.action_user)
  );

  if (name) {
    return name;
  }

  const actedById = firstNonEmptyString(
    record.acted_by_user_id,
    record.actedByUserId
  );

  return actedById ? `User ${actedById}` : "N/A";
};

export const getPrimaryProductImage = (
  request: Requisition | Record<string, unknown>
): string => {
  const record = asRecord(request);

  const directImage = firstNonEmptyString(
    record.product_image,
    record.productImage,
    record.first_product_image,
    record.firstProductImage,
    record.image_url,
    record.image
  );

  if (directImage) {
    return directImage;
  }

  const images = asArray(
    record.product_images ?? record.productImages ?? record.product_image_urls
  );

  for (const image of images) {
    const normalizedImage = firstNonEmptyString(image);
    if (normalizedImage) {
      return normalizedImage;
    }
  }

  const products = asArray(record.products);

  for (const product of products) {
    const productRecord = asRecord(product);
    const image = firstNonEmptyString(
      productRecord.image_url,
      productRecord.imageUrl,
      productRecord.image,
      productRecord.photo,
      productRecord.photo_url
    );

    if (image) {
      return image;
    }
  }

  return "";
};
