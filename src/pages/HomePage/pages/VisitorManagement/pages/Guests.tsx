import { Badge } from "@/components/Badge";
import EmptyState from "@/components/EmptyState";
import { HeaderControls } from "@/components/HeaderControls";
import { SearchBar } from "@/components/SearchBar";
import { useFetch } from "@/CustomHooks/useFetch";
import { buildBranchQuery, useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils";
import type { GuestType } from "@/utils";
import { relativePath } from "@/utils/const";
import { formatPhoneNumber } from "@/utils/helperFunctions";
import { useMemo, useState } from "react";
import PageOutline from "../../../Components/PageOutline";
import SkeletonLoader from "../../../Components/TableSkeleton";

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

const guestName = (guest: GuestType) => {
  const info = guest.user_info;
  return (
    [info?.title, info?.first_name, info?.other_name, info?.last_name]
      .filter(Boolean)
      .join(" ") ||
    guest.name ||
    "—"
  );
};

const membershipLabel = (guest: GuestType) => {
  switch (guest.membership_request?.status) {
    case "PENDING":
      return {
        text: "Requested membership",
        className: "border-warning/20 bg-warning/10 text-warning",
      };
    case "DECLINED":
      return {
        text: "Request declined",
        className: "border-error/20 bg-error/10 text-error",
      };
    default:
      return {
        text: "Guest",
        className: "border-lightGray bg-lightGray/40 text-primaryGray",
      };
  }
};

/**
 * Everyone who joined from the mobile app as a guest and is still a guest.
 * Guests have app accounts but aren't members, so they're kept out of the
 * member lists; requests to become a member are decided under Membership
 * management > Guest-to-Membership.
 */
export const Guests = () => {
  const { activeBranchId } = useBranchStore();
  const [showSearch, setShowSearch] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const query = useMemo(
    () => ({
      ...(buildBranchQuery(activeBranchId) ?? {}),
      take: "500",
      ...(search ? { search } : {}),
    }),
    [activeBranchId, search]
  );
  const { data, loading } = useFetch(api.fetch.fetchGuests, query);
  const guests = data?.data?.items ?? [];
  const total = data?.data?.total ?? guests.length;

  const crumbs = [
    { label: "Home", link: relativePath.home.main },
    { label: "Visitors", link: `${relativePath.home.main}/${relativePath.home.visitors.main}` },
    { label: "Guests", link: "" },
  ];

  return (
    <PageOutline crumbs={crumbs}>
      <div className="space-y-8">
        <HeaderControls
          title="Guests"
          subtitle="People who joined from the mobile app as guests. Those who ask to become members appear under Membership management."
          hasSearch
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          screenWidth={window.innerWidth}
        />

        {showSearch && (
          <SearchBar
            className="h-10 max-w-xs"
            placeholder="Search guests..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            id="searchGuests"
            onSubmit={() => setSearch(searchInput.trim())}
          />
        )}

        {loading && guests.length === 0 ? (
          <SkeletonLoader />
        ) : guests.length === 0 ? (
          <EmptyState
            scope="page"
            msg={search ? "No guests match your search" : "No guests yet"}
            description={
              search
                ? "Try a different name, email or phone number."
                : "Guests who join from the mobile app will appear here."
            }
          />
        ) : (
          <section className="space-y-3">
            <p className="text-sm text-primaryGray">
              {total} guest{total === 1 ? "" : "s"}
            </p>
            <div className="overflow-x-auto rounded-2xl border border-lightGray">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-lightGray/40 text-xs uppercase tracking-wide text-primaryGray">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Membership</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((guest) => {
                    const label = membershipLabel(guest);
                    return (
                      <tr
                        key={guest.id}
                        className="border-t border-lightGray/70 hover:bg-lightGray/20"
                      >
                        <td className="px-4 py-3 font-medium text-primary">
                          {guestName(guest)}
                        </td>
                        <td className="px-4 py-3 text-primaryGray">
                          {guest.email || "—"}
                        </td>
                        <td className="px-4 py-3 text-primaryGray">
                          {guest.user_info?.primary_number
                            ? formatPhoneNumber(
                                guest.user_info.country_code ?? "",
                                guest.user_info.primary_number
                              )
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-primaryGray">
                          {formatDate(guest.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`px-3 py-1 text-xs ${label.className}`}>
                            {label.text}
                          </Badge>
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
    </PageOutline>
  );
};

export default Guests;
