import { UiButton } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import type {
  AgendaItem,
  GenericEvent,
  GivingData,
  GrowData,
  ItemsData,
  LatestSermonData,
  ListItem,
  MyRequisitionsData,
  NotificationsData,
  ProfileData,
  RideData,
} from "@/utils/api/workspaces/interfaces";
import { relativePath } from "@/utils/const";

import { PATHS } from "../queueActions";
import { HBarList, StatGrid } from "../WidgetCharts";
import { AgendaRows, CtaGrid, ListRows, MediaBlock, ProfileNudge } from "../WidgetRows";
import { barRows, BZ, ghs, GN, kpiDelta, nf, parseDate, shortDate } from "../wsFormat";
import { def, type WidgetDef } from "../wsTypes";
import { RegisterButton } from "./GenericParts";
import { listWidget } from "./shared";

const icons = {
  give: "M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z",
  cal: "M3 9h18M7 3v4M17 3v4M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
  car: "M5 17h14M6 17v2M18 17v2M3 13l2-6h14l2 6v4H3z",
  bag: "M6 7h12l1 14H5L6 7zM9 7a3 3 0 0 1 6 0",
};

const optionalItems = (...items: (ListItem | null | undefined)[]) =>
  items.filter((item): item is ListItem => !!item);

export const GENERIC_WIDGETS: WidgetDef[] = [
  def<ProfileData>({
    id: "g-prof",
    span: 4,
    title: "Your profile",
    render: (d) => <ProfileNudge pct={Number(d.pct) || 0} missing={d.missing ?? []} />,
    btns: (d) =>
      (Number(d.pct) || 0) < 100
        ? [{ label: "Complete profile", tone: "primary", to: relativePath.member.profile }]
        : [],
  }),
  def<null>({
    id: "g-quick",
    span: 8,
    clientOnly: true,
    title: "Quick actions",
    render: (_, ctx) => (
      <CtaGrid
        go={ctx.go}
        ctas={[
          { title: "Give", sub: "Tithe, offering or a project", icon: icons.give, to: relativePath.member.giving, solid: true },
          { title: "Book an appointment", sub: "With a pastor", icon: icons.cal, to: relativePath.member.appointments },
          { title: "Ride to church", sub: "Find or offer a ride", icon: icons.car, to: relativePath.member.rides },
          { title: "Shop", sub: "Church marketplace", icon: icons.bag, to: relativePath.member.market },
        ]}
      />
    ),
  }),
  def<ItemsData<GenericEvent>>({
    id: "g-ev",
    span: 7,
    title: "Upcoming events",
    sub: () => "One tap to register",
    link: () => ({ label: "All events", to: PATHS.events }),
    isEmpty: (d) => !d.items?.length,
    empty: { title: "No upcoming events", text: "Events you can attend show here." },
    render: (d, ctx) => (
      <AgendaRows
        items={d.items}
        action={(event) => <RegisterButton key={`${event.ref_id}-${event.registered}`} event={event} ctx={ctx} />}
      />
    ),
  }),
  def<GivingData>({
    id: "g-give",
    span: 5,
    title: "My giving",
    sub: () => `${new Date().getFullYear()} so far`,
    render: (d) => {
      const delta = kpiDelta({ delta_pct: d.month_delta_pct, good: "up" });
      const pledge = d.pledge;
      return (
        <div className="flex flex-col gap-4">
          <StatGrid
            min={120}
            stats={[
              { label: "Given this year", value: ghs(d.year_total) },
              {
                label: "This month",
                value: ghs(d.month_total),
                sub: delta ? `${delta.text} on last month` : undefined,
                color: delta?.color,
              },
            ]}
          />
          {pledge ? (
            <HBarList
              rows={[
                {
                  label: `${pledge.name} pledge`,
                  value: Number(pledge.paid) || 0,
                  max: pledge.amount || null,
                  display: pledge.amount ? `${Math.round(((Number(pledge.paid) || 0) / pledge.amount) * 100)}%` : ghs(pledge.paid),
                  sub: [
                    `${ghs(pledge.paid)} of ${ghs(pledge.amount)}`,
                    pledge.next_amount && pledge.next_due
                      ? `${ghs(pledge.next_amount)} due ${shortDate(pledge.next_due)}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · "),
                  color: BZ,
                },
              ]}
            />
          ) : null}
        </div>
      );
    },
    btns: (d) => [
      { label: "Give now", tone: "primary", to: relativePath.member.giving },
      ...(d.pledge ? [{ label: "Pay pledge", tone: "secondary" as const, to: relativePath.member.pledges }] : []),
    ],
  }),
  def<ItemsData<AgendaItem>>({
    id: "g-appt",
    span: 4,
    title: "My appointments",
    isEmpty: (d) => !d.items?.length,
    empty: { title: "No appointments booked", text: "Book time with a pastor when you need it." },
    render: (d) => <AgendaRows items={d.items} />,
    btns: () => [{ label: "Book an appointment", tone: "secondary", to: relativePath.member.appointments }],
  }),
  def<RideData>({
    id: "g-ride",
    span: 4,
    title: "Ride to church",
    sub: (d) => d?.service_label ?? undefined,
    render: (d) =>
      d.item ? (
        <ListRows items={[d.item]} />
      ) : (
        <p className="text-gray-500">No ride booked for the next service.</p>
      ),
    btns: () => [
      { label: "My ride", tone: "secondary", to: `${relativePath.member.rides}/${relativePath.member.myRide}` },
      { label: "Offer a ride", tone: "ghost", to: `${relativePath.member.rides}/${relativePath.member.rideOffer}` },
    ],
  }),
  def<GrowData>({
    id: "g-grow",
    span: 4,
    title: "Life Center and School",
    isEmpty: (d) => !d.life_center && !d.assignment && !d.course,
    empty: { title: "Nothing here yet", text: "Join a Life Center or a School of Ministry class to see it here." },
    render: (d) => (
      <div className="flex flex-col gap-3">
        <ListRows
          items={optionalItems(d.life_center, d.assignment)}
          avatar={(item) => (item === d.life_center ? "LC" : "AS")}
        />
        {d.course ? (
          <HBarList
            rows={barRows([d.course]).map((row) => ({
              ...row,
              color: GN,
              display: row.max ? `${nf(row.value)} of ${nf(row.max)} lessons` : nf(row.value),
            }))}
          />
        ) : null}
      </div>
    ),
  }),
  def<MyRequisitionsData>({
    id: "g-req",
    span: 6,
    title: "My requisitions",
    sub: (d) => (d?.department ? `You raise requisitions for ${d.department}` : undefined),
    isEmpty: (d) => !d.items?.length,
    empty: { title: "No requisitions yet", text: "Requisitions you raise show here." },
    render: (d) => <ListRows items={d.items} avatar="RQ" />,
  }),
  def<LatestSermonData>({
    id: "g-ser",
    span: 6,
    title: "Latest sermon",
    isEmpty: (d) => !d,
    empty: { title: "No sermons yet", text: "Published sermons show here." },
    render: (d) => {
      if (!d) return null;
      const date = parseDate(d.date);
      return (
        <div className="flex flex-col gap-3">
          {d.thumbnail_url ? (
            <img src={d.thumbnail_url} alt="" className="aspect-video w-full rounded-lg object-cover" />
          ) : null}
          <MediaBlock
            eyebrow={date ? date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) : ""}
            title={d.title}
            sub={[d.series, d.preacher, d.duration_min ? `${nf(d.duration_min)} min` : null].filter(Boolean).join(" · ")}
          />
        </div>
      );
    },
    btns: (d) => [
      {
        label: "Watch",
        tone: "secondary",
        onClick: d?.youtube_url
          ? () => window.open(d.youtube_url as string, "_blank", "noopener,noreferrer")
          : undefined,
        to: d?.youtube_url ? undefined : relativePath.member.community,
      },
      { label: "All sermons", tone: "ghost", to: relativePath.member.community },
    ],
  }),
  listWidget("g-com", "Community", 6, {
    link: { label: "Open Community", to: relativePath.member.community },
    empty: { title: "Nothing new in the community", text: "Posts, prayer requests and testimonies show here." },
  }),
  def<NotificationsData>({
    id: "g-not",
    span: 6,
    title: "Notifications",
    count: (d) => (d.unread ? d.unread : null),
    link: () => ({ label: "See all notifications", to: PATHS.notifications }),
    isEmpty: (d) => !d.items?.length,
    empty: { title: "No new notifications", text: "You’re all caught up." },
    render: (d, ctx) => (
      <ListRows
        items={d.items}
        action={(item) =>
          item.action_url && item.action_url.startsWith("/") ? (
            <UiButton tone="ghost" size="sm" className="flex-shrink-0" onClick={() => ctx.go(item.action_url as string)}>
              Open
            </UiButton>
          ) : null
        }
      />
    ),
  }),
  listWidget("g-ord", "My orders", 6, {
    link: { label: "Open My orders", to: relativePath.member.orders },
    empty: { title: "No orders yet", text: "Orders from the church marketplace show here." },
  }),
];

