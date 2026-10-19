import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { matchesQuery } from "@/pages/HomePage/pages/MembershipManagement/components/manager/managerHelpers";
import {
  CellText,
  GridColumn,
  GridTable,
  PageHeading,
  Pill,
  PillTabs,
  SearchInput,
  SectionEmpty,
  UiButton,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { formatDate } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUiUtils";
import { buildBranchQuery, useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils/api/apiCalls";
import type { GuestType } from "@/utils/api/guests/interfaces";
import { relativePath } from "@/utils/const";
import { formatPhoneNumber } from "@/utils/helperFunctions";

import { guestRequestsPath, visitorsPath } from "../utils/visitorHelpers";

type GuestTab = "all" | "pending" | "none";

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

const guestPhone = (guest: GuestType) =>
  guest.user_info?.primary_number
    ? formatPhoneNumber(guest.user_info.country_code ?? "", guest.user_info.primary_number)
    : "";

const isPending = (guest: GuestType) => guest.membership_request?.status === "PENDING";

const TAB_FILTERS: Record<GuestTab, (guest: GuestType) => boolean> = {
  all: () => true,
  pending: isPending,
  none: (guest) => !isPending(guest),
};

/**
 * Everyone who joined from the mobile app as a guest and is still a guest.
 * Requests to become a member are decided under Membership management >
 * Guest-to-Membership.
 */
export const Guests = () => {
  const navigate = useNavigate();
  const { activeBranchId } = useBranchStore();
  const [tab, setTab] = useState<GuestTab>("all");
  const [search, setSearch] = useState("");

  const query = useMemo(
    () => ({ ...(buildBranchQuery(activeBranchId) ?? {}), take: "500" }),
    [activeBranchId]
  );
  const { data, loading } = useFetch(api.fetch.fetchGuests, query);
  const guests = useMemo(() => data?.data?.items ?? [], [data]);
  const total = data?.data?.total ?? guests.length;

  const matching = useMemo(
    () =>
      guests.filter((guest) =>
        matchesQuery(search, [guestName(guest), guest.email, guestPhone(guest)])
      ),
    [guests, search]
  );
  const rows = matching.filter(TAB_FILTERS[tab]);

  const columns: GridColumn<GuestType>[] = [
    {
      key: "name",
      header: "Name",
      width: "minmax(220px,2fr)",
      render: (guest) => <CellText main={guestName(guest)} sub={guest.email || "No email"} strong />,
    },
    {
      key: "phone",
      header: "Phone number",
      width: "1.2fr",
      render: (guest) => <CellText main={guestPhone(guest)} />,
    },
    {
      key: "joined",
      header: "Joined the app",
      width: "1fr",
      render: (guest) => <CellText main={formatDate(guest.created_at)} />,
    },
    {
      key: "membership",
      header: "Membership",
      width: "1.3fr",
      render: (guest) => {
        const status = guest.membership_request?.status;
        if (status === "PENDING") return <Pill tone="warning">Requested membership</Pill>;
        if (status === "DECLINED") return <Pill tone="danger">Request declined</Pill>;
        return <Pill tone="neutral">Guest</Pill>;
      },
    },
  ];

  const searching = Boolean(search.trim());

  return (
    <PageOutline
      crumbs={[
        { label: "Home", link: relativePath.home.main },
        { label: "Visitors", link: visitorsPath },
        { label: "Guests" },
      ]}
    >
      <div className="flex flex-col gap-6">
        <PageHeading
          title={`Guests (${total})`}
          subtitle="People who joined from the mobile app as guests. Requests to become members are decided under Membership management."
        />

        <div className="flex flex-wrap items-center gap-3">
          <PillTabs
            ariaLabel="Guest status"
            tabs={[
              { key: "all" as GuestTab, label: "All" },
              { key: "pending" as GuestTab, label: "Requested membership" },
              { key: "none" as GuestTab, label: "Guests only" },
            ].map((entry) => ({
              ...entry,
              count: matching.filter(TAB_FILTERS[entry.key]).length,
            }))}
            value={tab}
            onChange={setTab}
          />
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, email or phone"
            ariaLabel="Search guests"
            className="max-w-[420px]"
          />
        </div>

        {rows.length || (loading && guests.length === 0) ? (
          <GridTable
            columns={columns}
            rows={rows}
            getRowId={(guest) => String(guest.id)}
            loading={loading}
            actionsWidth="180px"
            renderActions={(guest) =>
              isPending(guest) ? (
                <UiButton size="sm" onClick={() => navigate(guestRequestsPath)}>
                  Review request
                </UiButton>
              ) : null
            }
          />
        ) : (
          <SectionEmpty
            title={
              searching
                ? "No guests match your search"
                : tab === "all"
                  ? "No guests yet"
                  : "No guests in this view"
            }
            text={
              searching
                ? "Try a different name, email or phone number."
                : "Guests who join from the mobile app will appear here."
            }
          />
        )}
      </div>
    </PageOutline>
  );
};

export default Guests;
