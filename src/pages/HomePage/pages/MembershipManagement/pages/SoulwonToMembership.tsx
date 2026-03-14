import { Button } from "@/components/Button";
import EmptyState from "@/components/EmptyState";
import { useFetch } from "@/CustomHooks/useFetch";
import { IMembersForm, MembersForm } from "@/pages/HomePage/pages/Members/Components/MembersForm";
import { encodeQuery } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import type { SoulWonListType } from "@/utils/api/lifeCenter/interfaces";
import type { MembersType } from "@/utils/api/members/interfaces";
import { relativePath } from "@/utils/const";
import { formatDate, formatPhoneNumber } from "@/utils/helperFunctions";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type SoulwonRecord = SoulWonListType & { lifeCenterName: string };

type LinkedMemberSummary = {
  id: string | number;
  name?: string | null;
  email?: string | null;
  member_id?: string | null;
  status?: string | null;
};

type SoulwonRecordWithMatch = SoulwonRecord & {
  linkedMember: LinkedMemberSummary | null;
  matchReason: "linked" | "email" | "phone" | null;
};

const normalizeEmail = (value?: string | null) => value?.trim().toLowerCase() ?? "";

const normalizePhone = (value?: string | null) => value?.replace(/\D/g, "") ?? "";

const getPhoneCandidates = (value?: string | null) => {
  const normalized = normalizePhone(value);

  return Array.from(
    new Set([normalized, normalized.slice(-10), normalized.slice(-9)].filter(Boolean))
  );
};

const extractSoulPhoneNumber = (record: SoulWonListType) => record.contact_number || "";

const extractSoulCountryCode = (record: SoulWonListType) =>
  record.country_code || MembersForm.initialValues.contact_info.phone.country_code;

const extractSoulWinnerName = (record: SoulWonListType) => record.wonBy?.name || "";

const buildPrefillForm = (record: SoulwonRecord): IMembersForm => ({
  ...MembersForm.initialValues,
  personal_info: {
    ...MembersForm.initialValues.personal_info,
    title: record.title || "",
    first_name: record.first_name || "",
    other_name: record.other_name || "",
    last_name: record.last_name || "",
    nationality: record.country || "",
    has_children: false,
  },
  picture: {
    ...MembersForm.initialValues.picture,
  },
  contact_info: {
    ...MembersForm.initialValues.contact_info,
    email: record.contact_email || "",
    resident_country: record.country || "",
    city: record.city || "",
    phone: {
      country_code: extractSoulCountryCode(record),
      number: extractSoulPhoneNumber(record),
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
    membership_type: "IN_HOUSE",
    member_since: record.date_won ? record.date_won.split("T")[0] : undefined,
  },
  is_user: false,
  department_positions: [],
  family: [],
});

const memberManagePath = `${relativePath.home.main}/${relativePath.home.members.manage}`;
const soulwonMembershipPath = `${relativePath.home.main}/${relativePath.home.membership.main}/${relativePath.home.membership.management.main}/${relativePath.home.membership.management.soulwonToMembership}`;

export const SoulwonToMembership = () => {
  const navigate = useNavigate();
  const {
    data: soulsResponse,
    loading: soulsLoading,
    error: soulsError,
  } = useFetch(api.fetch.fetchSoulsWon);
  const { data: membersResponse, loading: membersLoading } = useFetch(
    api.fetch.fetchAllMembers
  );

  const [searchQuery, setSearchQuery] = useState("");

  const soulRecords = useMemo<SoulwonRecord[]>(
    () =>
      (soulsResponse?.data || [])
        .map((record) => ({
          ...record,
          lifeCenterName: record.lifeCenter?.name || "Unnamed Life Center",
        }))
        .sort(
          (left, right) =>
            new Date(right.date_won || 0).getTime() -
            new Date(left.date_won || 0).getTime()
        ),
    [soulsResponse]
  );
  const members = useMemo(() => membersResponse?.data || [], [membersResponse]);

  const membersByEmail = useMemo(() => {
    const nextMap = new Map<string, MembersType>();

    members.forEach((member) => {
      const emailKey = normalizeEmail(member.email);
      if (emailKey && !nextMap.has(emailKey)) {
        nextMap.set(emailKey, member);
      }
    });

    return nextMap;
  }, [members]);

  const membersByPhone = useMemo(() => {
    const nextMap = new Map<string, MembersType>();

    members.forEach((member) => {
      getPhoneCandidates(member.primary_number).forEach((candidate) => {
        if (!nextMap.has(candidate)) {
          nextMap.set(candidate, member);
        }
      });
    });

    return nextMap;
  }, [members]);

  const recordsWithMatches = useMemo<SoulwonRecordWithMatch[]>(() => {
    return soulRecords.map((record) => {
      if (record.member?.id) {
        return {
          ...record,
          linkedMember: record.member,
          matchReason: "linked",
        };
      }

      const emailKey = normalizeEmail(record.contact_email);

      if (emailKey) {
        const emailMatch = membersByEmail.get(emailKey);
        if (emailMatch) {
          return {
            ...record,
            linkedMember: emailMatch,
            matchReason: "email",
          };
        }
      }

      const phoneMatch = getPhoneCandidates(extractSoulPhoneNumber(record))
        .map((candidate) => membersByPhone.get(candidate) || null)
        .find(Boolean);

      if (phoneMatch) {
        return {
          ...record,
          linkedMember: phoneMatch,
          matchReason: "phone",
        };
      }

      return {
        ...record,
        linkedMember: null,
        matchReason: null,
      };
    });
  }, [membersByEmail, membersByPhone, soulRecords]);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) return recordsWithMatches;

    return recordsWithMatches.filter((record) => {
      const searchTerms = [
        record.title,
        record.first_name,
        record.other_name,
        record.last_name,
        record.contact_email,
        extractSoulPhoneNumber(record),
        record.country,
        record.city,
        record.lifeCenterName,
        extractSoulWinnerName(record),
        record.linkedMember?.name,
        record.linkedMember?.member_id,
      ];

      return searchTerms.some((term) =>
        String(term || "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [recordsWithMatches, searchQuery]);

  const isLoading = membersLoading || soulsLoading;

  const handleOpenMemberForm = (record: SoulwonRecord) => {
    navigate(memberManagePath, {
      state: {
        afterSubmitPath: soulwonMembershipPath,
        prefillMemberForm: buildPrefillForm(record),
        prefillSourceLabel: `${record.first_name || "Soulwon record"} from ${record.lifeCenterName}`,
        sourceSoulWonId: record.id,
      },
    });
  };

  const handleViewMember = (member: LinkedMemberSummary) => {
    navigate(`/home/members/${encodeQuery(member.id)}`, {
      state: { prefillMember: member },
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-lightGray p-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-primary">
            Soulwon-to-Membership ({filteredRecords.length})
          </h2>
          <p className="text-sm text-gray-600">
            Start member creation from life center soul-winning records. The standard member form
            opens with available details already filled in.
          </p>
        </div>
      </section>

      {soulsError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Unable to load soul-winning records right now.
        </div>
      ) : null}

      <section className="rounded-xl border border-lightGray p-4">
        <label
          htmlFor="soulwon-membership-search"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Search Soulwon Records
        </label>
        <input
          id="soulwon-membership-search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by name, life center, email, phone, or matched member"
          className="w-full md:max-w-lg border border-lightGray rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </section>

      {isLoading && soulRecords.length === 0 ? (
        <div className="text-sm text-gray-600">Loading soul-winning records...</div>
      ) : null}

      {!isLoading && !soulsError && soulRecords.length === 0 ? (
        <EmptyState
          scope="page"
          msg="No soul-winning records are currently available for membership onboarding"
        />
      ) : null}

      {soulRecords.length > 0 && filteredRecords.length === 0 ? (
        <EmptyState
          scope="section"
          msg="No soul-winning records match your search"
          description="Try a different name, life center, phone number, or member ID."
        />
      ) : null}

      {filteredRecords.length > 0 ? (
        <section className="rounded-xl border border-lightGray overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-lightGray text-primary">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Life Center</th>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Email</th>
                  <th className="px-4 py-3 text-left font-semibold">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold">Date Won</th>
                  <th className="px-4 py-3 text-left font-semibold">Won By</th>
                  <th className="px-4 py-3 text-left font-semibold">Member Match</th>
                  <th className="px-4 py-3 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => {
                  const phoneNumber = extractSoulPhoneNumber(record);
                  const countryCode = extractSoulCountryCode(record);

                  return (
                    <tr key={`${record.lifeCenterId}-${record.id}`} className="border-t border-lightGray">
                      <td className="px-4 py-3">{record.lifeCenterName}</td>
                      <td className="px-4 py-3">
                        {[record.title, record.first_name, record.other_name, record.last_name]
                          .filter(Boolean)
                          .join(" ") || "-"}
                      </td>
                      <td className="px-4 py-3">{record.contact_email || "-"}</td>
                      <td className="px-4 py-3">
                        {formatPhoneNumber(countryCode, phoneNumber) !== "-"
                          ? formatPhoneNumber(countryCode, phoneNumber)
                          : phoneNumber || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {record.date_won ? formatDate(record.date_won) : "-"}
                      </td>
                      <td className="px-4 py-3">{extractSoulWinnerName(record) || "-"}</td>
                      <td className="px-4 py-3">
                        {record.linkedMember ? (
                          <div className="space-y-1">
                            <p className="font-medium text-primary">
                              {record.linkedMember.name || "-"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {record.linkedMember.member_id || record.linkedMember.email || "-"}
                              {record.matchReason === "linked"
                                ? " • linked member"
                                : record.matchReason
                                  ? ` • matched by ${record.matchReason}`
                                  : ""}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-500">No match found</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {record.linkedMember ? (
                          <Button
                            value="View Member"
                            variant="secondary"
                            className="min-w-[8.5rem]"
                            onClick={() => handleViewMember(record.linkedMember as LinkedMemberSummary)}
                          />
                        ) : (
                          <Button
                            value="Open Member Form"
                            variant="primary"
                            className="min-w-[10rem]"
                            onClick={() => handleOpenMemberForm(record)}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default SoulwonToMembership;
