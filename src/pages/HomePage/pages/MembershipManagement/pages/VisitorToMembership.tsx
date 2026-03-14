import { Button } from "@/components/Button";
import EmptyState from "@/components/EmptyState";
import { useFetch } from "@/CustomHooks/useFetch";
import {
  IMembersForm,
  MembersForm,
} from "@/pages/HomePage/pages/Members/Components/MembersForm";
import { VisitorType } from "@/utils";
import { api } from "@/utils/api/apiCalls";
import { relativePath } from "@/utils/const";
import { formatDate, formatPhoneNumber } from "@/utils/helperFunctions";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

type VisitorWithMemberLink = VisitorType & {
  member_id?: string;
  memberId?: string;
  linked_member_id?: string;
};

const memberManagePath = `${relativePath.home.main}/${relativePath.home.members.manage}`;
const visitorMembershipPath = `${relativePath.home.main}/${relativePath.home.membership.main}/${relativePath.home.membership.management.main}/${relativePath.home.membership.management.visitorToMembership}`;

const getMemberLinkId = (visitor: VisitorType): string | null => {
  const visitorWithLink = visitor as VisitorWithMemberLink;

  return (
    visitorWithLink.member_id ||
    visitorWithLink.memberId ||
    visitorWithLink.linked_member_id ||
    null
  );
};

const buildPrefillForm = (visitor: VisitorType): IMembersForm => ({
  ...MembersForm.initialValues,
  personal_info: {
    ...MembersForm.initialValues.personal_info,
    title: visitor.title || "",
    first_name: visitor.firstName || "",
    other_name: visitor.otherName || "",
    last_name: visitor.lastName || "",
    gender: visitor.gender || "",
    marital_status: visitor.marital_status || "",
    nationality: visitor.nationality || "",
    has_children: false,
  },
  picture: {
    ...MembersForm.initialValues.picture,
  },
  contact_info: {
    ...MembersForm.initialValues.contact_info,
    email: visitor.email || "",
    resident_country: visitor.country || "",
    state_region: visitor.state || "",
    city: visitor.city || "",
    phone: {
      country_code:
        visitor.country_code ||
        MembersForm.initialValues.contact_info.phone.country_code,
      number: visitor.phone || "",
    },
  },
  work_info: {
    ...MembersForm.initialValues.work_info,
  },
  emergency_contact: {
    ...MembersForm.initialValues.emergency_contact,
    phone: {
      ...MembersForm.initialValues.emergency_contact.phone,
    },
  },
  church_info: {
    ...MembersForm.initialValues.church_info,
    membership_type: "IN_HOUSE",
  },
  department_positions: [],
  family: [],
});

const getVisitorSourceLabel = (visitor: VisitorType): string => {
  const displayName = [visitor.firstName, visitor.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return displayName ? `${displayName} (visitor)` : `Visitor ${visitor.id}`;
};

const extractVisitors = (source: unknown): VisitorType[] => {
  let currentSource = source;

  for (let depth = 0; depth < 4; depth += 1) {
    if (Array.isArray(currentSource)) return currentSource as VisitorType[];

    if (
      currentSource &&
      typeof currentSource === "object" &&
      "data" in currentSource
    ) {
      currentSource = (currentSource as { data?: unknown }).data;
      continue;
    }

    break;
  }

  return [];
};

export const VisitorToMembership = () => {
  const navigate = useNavigate();
  const { data, loading } = useFetch(api.fetch.fetchAllVisitors);

  const allVisitors = useMemo(() => extractVisitors(data?.data), [data]);

  const convertibleVisitors = useMemo(
    () =>
      allVisitors
        .filter((visitor) => !visitor.is_member && !getMemberLinkId(visitor))
        .sort(
          (left, right) =>
            Number(Boolean(right.membershipWish)) -
            Number(Boolean(left.membershipWish))
        ),
    [allVisitors]
  );

  const handleOpenMemberForm = (visitor: VisitorType) => {
    navigate(memberManagePath, {
      state: {
        afterSubmitPath: visitorMembershipPath,
        prefillMemberForm: buildPrefillForm(visitor),
        prefillSourceLabel: getVisitorSourceLabel(visitor),
        sourceVisitorId: visitor.id,
      },
    });
  };

  return (
    <div className="space-y-4">
      {loading && convertibleVisitors.length === 0 ? (
        <div className="text-sm text-gray-600">Loading visitors...</div>
      ) : null}

      {convertibleVisitors.length === 0 ? (
        <EmptyState
          scope="page"
          msg="No visitors are currently available for membership conversion"
        />
      ) : (
        <section className="rounded-xl border border-lightGray overflow-hidden">
          <div className="p-4 border-b border-lightGray">
            <h2 className="text-lg font-semibold text-primary">
              Visitor-to-Membership ({convertibleVisitors.length})
            </h2>
            <p className="text-sm text-gray-600">
              Start member creation from visitor records. The standard member
              form opens with available visitor details already filled in, and
              interested visitors are listed first.
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
                  <th className="px-4 py-3 text-left font-semibold">
                    Date Registered
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Interest
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Member Link
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {convertibleVisitors.map((visitor) => {
                  const linkedMemberId = getMemberLinkId(visitor);
                  const alreadyConverted = Boolean(
                    visitor.is_member || linkedMemberId
                  );

                  return (
                    <tr
                      key={visitor.id}
                      className="border-t border-lightGray"
                    >
                      <td className="px-4 py-3">{visitor.title || "-"}</td>
                      <td className="px-4 py-3">
                        {visitor.firstName} {visitor.lastName}
                      </td>
                      <td className="px-4 py-3">{visitor.email || "-"}</td>
                      <td className="px-4 py-3">
                        {formatPhoneNumber(visitor.country_code, visitor.phone)}
                      </td>
                      <td className="px-4 py-3">
                        {formatDate(visitor.createdAt, "long")}
                      </td>
                      <td className="px-4 py-3">
                        {visitor.membershipWish ? "Interested" : "Not marked"}
                      </td>
                      <td className="px-4 py-3">
                        {linkedMemberId
                          ? `Linked: ${linkedMemberId}`
                          : visitor.is_member
                            ? "Linked"
                            : "Not linked"}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          value={
                            alreadyConverted
                              ? "Converted"
                              : "Open Member Form"
                          }
                          variant={
                            alreadyConverted ? "secondary" : "primary"
                          }
                          className="min-w-[10rem]"
                          disabled={alreadyConverted}
                          onClick={() => handleOpenMemberForm(visitor)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default VisitorToMembership;
