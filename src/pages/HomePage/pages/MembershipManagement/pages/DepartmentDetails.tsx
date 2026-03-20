import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Button, ProfilePicture } from "@/components";
import { Badge } from "@/components/Badge";
import EmptyState from "@/components/EmptyState";
import { SearchBar } from "@/components/SearchBar";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { PaginationComponent } from "@/pages/HomePage/Components/reusable/PaginationComponent";
import { decodeQuery, encodeQuery } from "@/pages/HomePage/utils";
import useSettingsStore from "@/pages/HomePage/pages/Settings/utils/settingsStore";
import { api, DepartmentDetailsType, MembersType, relativePath } from "@/utils";
import { ApiResponse, QueryType } from "@/utils/interfaces";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";

type MembershipOutletContext = {
  refetchDepartments: (query?: QueryType) => Promise<unknown>;
};

const MEMBERS_PER_PAGE = 12;

const formatMembershipType = (membershipType?: string) => {
  if (membershipType === "ONLINE") return "Online e-church family";
  if (membershipType === "IN_HOUSE") return "In-person church family";

  return "Membership";
};

const formatMemberStatus = (
  status?: MembersType["status"]
): "Functional Member" | "Confirmed Member" | "Unconfirmed Member" => {
  if (status === "MEMBER") return "Functional Member";
  if (status === "CONFIRMED") return "Confirmed Member";

  return "Unconfirmed Member";
};

export const DepartmentDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { refetchDepartments } =
    useOutletContext<MembershipOutletContext>();
  const departments = useSettingsStore((state) => state.departments);
  const [searchValue, setSearchValue] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const departmentId = useMemo(() => {
    if (!id) {
      return null;
    }

    const decodedId = Number(decodeQuery(String(id)));
    return Number.isFinite(decodedId) ? decodedId : null;
  }, [id]);

  const department = useMemo(
    () =>
      departmentId === null
        ? undefined
        : departments.find((item) => item.id === departmentId),
    [departmentId, departments]
  );

  const departmentQuery = useMemo(() => {
    if (departmentId === null) {
      return undefined;
    }

    return {
      id: String(departmentId),
      page: String(currentPage),
      limit: String(MEMBERS_PER_PAGE),
      ...(appliedSearch.trim() ? { name: appliedSearch.trim() } : {}),
    };
  }, [appliedSearch, currentPage, departmentId]);

  const {
    data: departmentResponse,
    loading: membersLoading,
    error: departmentError,
  } = useFetch<ApiResponse<DepartmentDetailsType | null>>(
    api.fetch.fetchDepartmentDetails as (
      query?: QueryType
    ) => Promise<ApiResponse<DepartmentDetailsType | null>>,
    departmentQuery,
    departmentId === null
  );

  useEffect(() => {
    if (departments.length === 0) {
      void refetchDepartments();
    }
  }, [departments.length, refetchDepartments]);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedSearch, departmentId]);

  const departmentDetails = departmentResponse
    ? departmentResponse.data ?? undefined
    : department;
  const departmentMembers = useMemo(
    () => departmentResponse?.data?.members ?? [],
    [departmentResponse?.data?.members]
  );
  const totalMembers =
    departmentResponse?.meta?.total ??
    departmentResponse?.data?.member_count ??
    departmentMembers.length;

  const handleViewMember = (memberId: number) => {
    navigate(`${relativePath.home.main}/${relativePath.home.members.main}/${encodeQuery(memberId)}`);
  };

  const handleSearchSubmit = () => {
    setAppliedSearch(searchValue);
  };

  const handleBack = () => {
    navigate(
      `${relativePath.home.main}/${relativePath.home.membership.main}/${relativePath.home.membership.departments.main}`
    );
  };

  const crumbs = useMemo(
    () => [
      { label: "Home", link: relativePath.home.main },
      { label: "Membership", link: `${relativePath.home.main}/${relativePath.home.membership.main}` },
      {
        label: "Departments and Ministries",
        link: `${relativePath.home.main}/${relativePath.home.membership.main}/${relativePath.home.membership.departments.main}`,
      },
      { label: departmentDetails?.name || "Department Details" },
    ],
    [departmentDetails?.name]
  );

  if (departmentId === null) {
    return (
      <PageOutline crumbs={crumbs}>
        <EmptyState
          scope="page"
          msg="Department not found"
          description="The department identifier is invalid."
        />
      </PageOutline>
    );
  }

  const showMissingDepartmentState =
    Boolean(departmentResponse) && !departmentResponse.data;

  return (
    <PageOutline crumbs={crumbs}>
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[1.75rem] bg-primary px-6 py-7 text-white shadow-lg">
          <div className="absolute -right-12 top-0 h-48 w-48 rounded-full bg-secondary/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

          <div className="relative space-y-6">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white transition hover:bg-white/15"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Departments
            </button>

            <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.24em] text-white/70">
                  Department / Ministry
                </p>
                <h1 className="text-3xl font-semibold">
                  {departmentDetails?.name || "Loading Department..."}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-white/80 md:text-base">
                  {departmentDetails?.description?.trim() ||
                    "No department description has been added yet."}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Badge className="border-white/20 bg-white/10 px-3 py-1 text-xs text-white">
                    {departmentDetails?.department_head_info?.name
                      ? "Head assigned"
                      : "Head not assigned"}
                  </Badge>
                  <Badge className="border-white/20 bg-white/10 px-3 py-1 text-xs text-white">
                    {totalMembers} member{totalMembers === 1 ? "" : "s"}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/65">
                    Department Head
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {departmentDetails?.department_head_info?.name || "Not assigned"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/65">
                    Members Listed
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {totalMembers}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {showMissingDepartmentState ? (
          <EmptyState
            scope="page"
            msg="Department not found"
            description="The selected department could not be found in the current configuration."
          />
        ) : (
          <section className="app-card space-y-5 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-primary">
                  Members in {departmentDetails?.name || "Department"}
                </h2>
                <p className="text-sm text-primaryGray">
                  Select a member to open the existing profile details page.
                </p>
              </div>

              <div className="w-full md:max-w-md">
                <SearchBar
                  id="department-member-search"
                  placeholder="Search by name, member ID, phone or email"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  onSubmit={handleSearchSubmit}
                  className="w-full"
                />
              </div>
            </div>

            {departmentError && (
              <div className="rounded-xl border border-error/30 bg-errorBG px-4 py-3 text-sm text-error">
                {departmentError.message || "Unable to load department members."}
              </div>
            )}

            {membersLoading ? (
              <p className="text-sm text-primaryGray">Loading members...</p>
            ) : departmentMembers.length > 0 ? (
              <>
                <div className="grid gap-4 xl:grid-cols-2">
                  {departmentMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleViewMember(member.id)}
                      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-lightGray bg-white p-4 text-left transition hover:border-primary/25 hover:bg-primary/5"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <ProfilePicture
                          className="h-12 w-12 rounded-full border border-lightGray bg-white"
                          textClass="text-sm font-semibold text-primary"
                          src={member.photo}
                          alt={member.name}
                          name={member.name}
                        />

                        <div className="min-w-0 space-y-2">
                          <div>
                            <p className="truncate text-base font-semibold text-primary">
                              {member.name}
                            </p>
                            <p className="truncate text-sm text-primaryGray">
                              {member.email || "No email address"}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge className="border-primary/15 bg-primary/5 px-3 py-1 text-xs text-primary">
                              {formatMembershipType(member.membership_type)}
                            </Badge>
                            <Badge className="border-secondary/20 bg-secondary/10 px-3 py-1 text-xs text-secondary">
                              {formatMemberStatus(member.status)}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="hidden shrink-0 text-right md:block">
                        <p className="text-xs uppercase tracking-[0.16em] text-primaryGray">
                          Member ID
                        </p>
                        <p className="mt-1 text-sm font-semibold text-primary">
                          {member.member_id || "-"}
                        </p>
                        <p className="mt-3 text-sm font-medium text-secondary">
                          Open Profile
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {totalMembers > MEMBERS_PER_PAGE && (
                  <PaginationComponent
                    total={totalMembers}
                    take={MEMBERS_PER_PAGE}
                    onPageChange={(page) => setCurrentPage(page)}
                  />
                )}
              </>
            ) : (
              <EmptyState
                scope="section"
                msg="No members found"
                description={
                  appliedSearch.trim()
                    ? "Try a different search term."
                    : "No members are currently assigned to this department."
                }
              />
            )}
          </section>
        )}

        <div className="flex justify-end">
          <Button value="Back to Departments" variant="secondary" onClick={handleBack} />
        </div>
      </div>
    </PageOutline>
  );
};

export default DepartmentDetails;
