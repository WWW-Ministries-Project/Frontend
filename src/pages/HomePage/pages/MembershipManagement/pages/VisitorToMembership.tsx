import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { useFetch } from "@/CustomHooks/useFetch";
import { showNotification } from "@/pages/HomePage/utils";
import { VisitorType } from "@/utils";
import { api } from "@/utils/api/apiCalls";
import { formatDate, formatPhoneNumber } from "@/utils/helperFunctions";
import { ChangeEvent, useMemo, useState } from "react";

type VisitorWithMemberLink = VisitorType & {
  member_id?: string;
  memberId?: string;
  linked_member_id?: string;
};

type VisitorConversionForm = {
  title: string;
  firstName: string;
  lastName: string;
  otherName: string;
  email: string;
  countryCode: string;
  phone: string;
  membershipType: "IN_HOUSE" | "ONLINE";
};

const getMemberLinkId = (visitor: VisitorType): string | null => {
  const visitorWithLink = visitor as VisitorWithMemberLink;

  return (
    visitorWithLink.member_id ||
    visitorWithLink.memberId ||
    visitorWithLink.linked_member_id ||
    null
  );
};

const mapVisitorToForm = (visitor: VisitorType): VisitorConversionForm => {
  return {
    title: visitor.title || "",
    firstName: visitor.firstName || "",
    lastName: visitor.lastName || "",
    otherName: visitor.otherName || "",
    email: visitor.email || "",
    countryCode: visitor.country_code || "",
    phone: visitor.phone || "",
    membershipType: "IN_HOUSE",
  };
};

const toConversionPayload = (
  visitorId: string | number,
  values: VisitorConversionForm
): Record<string, string> => {
  return {
    title: values.title.trim(),
    first_name: values.firstName.trim(),
    last_name: values.lastName.trim(),
    other_name: values.otherName.trim(),
    email: values.email.trim(),
    country_code: values.countryCode.trim(),
    primary_number: values.phone.trim(),
    membership_type: values.membershipType,
    source_visitor_id: String(visitorId),
  };
};

const extractVisitors = (source: unknown): VisitorType[] => {
  if (Array.isArray(source)) return source as VisitorType[];

  if (source && typeof source === "object" && "data" in source) {
    const nestedSource = (source as { data?: unknown }).data;
    if (Array.isArray(nestedSource)) return nestedSource as VisitorType[];
  }

  return [];
};

export const VisitorToMembership = () => {
  const { data, loading, refetch } = useFetch(api.fetch.fetchAllVisitors);
  const { refetch: refetchMembers } = useFetch(api.fetch.fetchAllMembers, undefined, true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorType | null>(null);
  const [formValues, setFormValues] = useState<VisitorConversionForm | null>(null);
  const [processingVisitorId, setProcessingVisitorId] = useState<string | number | null>(null);

  const allVisitors = useMemo(() => extractVisitors(data?.data), [data]);

  const interestedVisitors = useMemo(
    () => allVisitors.filter((visitor) => Boolean(visitor.membershipWish)),
    [allVisitors]
  );

  const openConversionModal = (visitor: VisitorType) => {
    setSelectedVisitor(visitor);
    setFormValues(mapVisitorToForm(visitor));
    setIsModalOpen(true);
  };

  const closeConversionModal = () => {
    setIsModalOpen(false);
    setSelectedVisitor(null);
    setFormValues(null);
  };

  const handleInputChange = (
    field: keyof VisitorConversionForm,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = event.target.value;

    setFormValues((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  };

  const convertVisitor = async () => {
    if (!selectedVisitor || !formValues) return;

    if (
      !formValues.firstName.trim() ||
      !formValues.lastName.trim() ||
      !formValues.email.trim() ||
      !formValues.phone.trim()
    ) {
      showNotification("First name, last name, email and phone are required", "error");
      return;
    }

    setProcessingVisitorId(selectedVisitor.id);

    try {
      await api.post.convertVisitorToMember(
        selectedVisitor.id,
        toConversionPayload(selectedVisitor.id, formValues)
      );

      showNotification("Visitor converted to confirmed member successfully", "success");

      closeConversionModal();
      await Promise.all([refetch(), refetchMembers()]);
    } catch {
      // Error notifications are handled by API error middleware.
    } finally {
      setProcessingVisitorId(null);
    }
  };

  return (
    <div className="space-y-4">
      {loading && interestedVisitors.length === 0 ? (
        <div className="text-sm text-gray-600">Loading visitors...</div>
      ) : null}

      {interestedVisitors.length === 0 ? (
        <EmptyState msg="No visitors currently interested in membership" />
      ) : (
        <section className="rounded-xl border border-lightGray overflow-hidden">
          <div className="p-4 border-b border-lightGray">
            <h2 className="text-lg font-semibold text-primary">
              Visitor-to-Membership ({interestedVisitors.length})
            </h2>
            <p className="text-sm text-gray-600">
              Convert interested visitors to confirmed members while retaining visitor records.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-lightGray text-primary">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Title</th>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Email</th>
                  <th className="px-4 py-3 text-left font-semibold">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold">Date Registered</th>
                  <th className="px-4 py-3 text-left font-semibold">Member Link</th>
                  <th className="px-4 py-3 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {interestedVisitors.map((visitor) => {
                  const linkedMemberId = getMemberLinkId(visitor);
                  const alreadyConverted = Boolean(visitor.is_member || linkedMemberId);
                  const isProcessing = processingVisitorId === visitor.id;

                  return (
                    <tr key={visitor.id} className="border-t border-lightGray">
                      <td className="px-4 py-3">{visitor.title || "-"}</td>
                      <td className="px-4 py-3">
                        {visitor.firstName} {visitor.lastName}
                      </td>
                      <td className="px-4 py-3">{visitor.email || "-"}</td>
                      <td className="px-4 py-3">
                        {formatPhoneNumber(visitor.country_code, visitor.phone)}
                      </td>
                      <td className="px-4 py-3">{formatDate(visitor.createdAt, "long")}</td>
                      <td className="px-4 py-3">
                        {linkedMemberId
                          ? `Linked: ${linkedMemberId}`
                          : visitor.is_member
                          ? "Linked"
                          : "Not linked"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={alreadyConverted || isProcessing}
                          onClick={() => openConversionModal(visitor)}
                          className="px-3 py-2 text-xs rounded-md bg-primary text-white disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {alreadyConverted
                            ? "Converted"
                            : isProcessing
                            ? "Converting..."
                            : "Convert"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Modal open={isModalOpen} persist={false} onClose={closeConversionModal}>
        <div className="p-6 space-y-5">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-primary">Convert Visitor to Member</h3>
            <p className="text-sm text-gray-600">
              Edit and confirm the visitor details before converting to a confirmed member.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm text-gray-700">
              Title
              <input
                type="text"
                value={formValues?.title || ""}
                onChange={(event) => handleInputChange("title", event)}
                className="mt-1 w-full border border-lightGray rounded-md px-3 py-2"
              />
            </label>

            <label className="text-sm text-gray-700">
              First Name
              <input
                type="text"
                value={formValues?.firstName || ""}
                onChange={(event) => handleInputChange("firstName", event)}
                className="mt-1 w-full border border-lightGray rounded-md px-3 py-2"
              />
            </label>

            <label className="text-sm text-gray-700">
              Last Name
              <input
                type="text"
                value={formValues?.lastName || ""}
                onChange={(event) => handleInputChange("lastName", event)}
                className="mt-1 w-full border border-lightGray rounded-md px-3 py-2"
              />
            </label>

            <label className="text-sm text-gray-700">
              Other Name
              <input
                type="text"
                value={formValues?.otherName || ""}
                onChange={(event) => handleInputChange("otherName", event)}
                className="mt-1 w-full border border-lightGray rounded-md px-3 py-2"
              />
            </label>

            <label className="text-sm text-gray-700">
              Email
              <input
                type="email"
                value={formValues?.email || ""}
                onChange={(event) => handleInputChange("email", event)}
                className="mt-1 w-full border border-lightGray rounded-md px-3 py-2"
              />
            </label>

            <label className="text-sm text-gray-700">
              Country Code
              <input
                type="text"
                value={formValues?.countryCode || ""}
                onChange={(event) => handleInputChange("countryCode", event)}
                className="mt-1 w-full border border-lightGray rounded-md px-3 py-2"
              />
            </label>

            <label className="text-sm text-gray-700">
              Phone Number
              <input
                type="text"
                value={formValues?.phone || ""}
                onChange={(event) => handleInputChange("phone", event)}
                className="mt-1 w-full border border-lightGray rounded-md px-3 py-2"
              />
            </label>

            <label className="text-sm text-gray-700">
              Membership Type
              <select
                value={formValues?.membershipType || "IN_HOUSE"}
                onChange={(event) => handleInputChange("membershipType", event)}
                className="mt-1 w-full border border-lightGray rounded-md px-3 py-2"
              >
                <option value="IN_HOUSE">In-house</option>
                <option value="ONLINE">Online</option>
              </select>
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <Button value="Cancel" variant="secondary" onClick={closeConversionModal} />
            <Button
              value="Confirm Conversion"
              variant="primary"
              onClick={convertVisitor}
              loading={Boolean(selectedVisitor && processingVisitorId === selectedVisitor.id)}
              disabled={Boolean(selectedVisitor && processingVisitorId === selectedVisitor.id)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VisitorToMembership;
