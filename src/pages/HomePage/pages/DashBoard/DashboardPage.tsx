import { routes } from "@/routes/appRoutes";
import { matchRoutes, useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useMemo } from "react";

import { useAuth } from "@/context/AuthWrapper";
import { useFetch } from "@/CustomHooks/useFetch";
import { isGuestViewer } from "@/pages/HomePage/pages/Community/utils/communityHelpers";
import {
  ASSESSMENT_TYPE,
  flattenAssignments,
  isOutstanding,
  useLearnerOverview,
} from "@/pages/MembersPage/Pages/school/learnerUtils";
import { useStore } from "@/store/useStore";
import { useActiveWorkspaces } from "@/store/userStore";
import { isWorkspaceKey, type WorkspaceKey } from "@/utils/api/workspaces/interfaces";
import { PillTabs } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { api } from "@/utils/api/apiCalls";
import { Appointment } from "@/utils/api/appointment/interfaces";
import { normalizeAppointmentRecord, toStringValue } from "@/utils/api/appointment/bookingUtils";
import { relativePath } from "@/utils/const";
import { cn } from "@/utils/cn";

import { AppointmentsCard } from "./Components/AppointmentsCard";
import { CommunityCard } from "./Components/CommunityCard";
import { AnnualTheme, HomeHeader } from "./Components/HomeHeader";
import { NextUpHero } from "./Components/NextUpHero";
import { QuickActions } from "./Components/QuickActions";
import { RecentSermons } from "./Components/RecentSermons";
import { SchoolCard } from "./Components/SchoolCard";
import { WeekItem, YourWeek } from "./Components/YourWeek";
import {
  addDays,
  eventEnd,
  eventName,
  eventStart,
  hhmm,
  startOfDay,
  upcomingEventsFor,
  userAudienceIds,
} from "./utils/homeUtils";
import { WorkspaceView } from "./workspaces/WorkspaceView";
import { WORKSPACE_LABELS } from "./workspaces/wsTypes";

const appointmentStart = (a: Appointment) => {
  const day = (a.date || "").split("T")[0];
  if (!day) return null;
  const d = new Date(`${day}T${a.session?.start ?? "00:00"}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

type HomeTab = "home" | WorkspaceKey;

/**
 * Home: the personal overview, plus a tab per workspace the user's role grants
 * in the active branch (kept in `?ws=`). No tab bar without workspaces.
 */
export const DashBoardPage = () => {
  const location = useLocation();
  const matches = matchRoutes(routes, location);
  const isMemberRoute = matches?.find((m) => m.route.name)?.route.name === "member";
  const workspaces = useActiveWorkspaces();
  const [params, setParams] = useSearchParams();
  const wsParam = params.get("ws");
  const showTabs = !isMemberRoute && workspaces.length > 0;
  const current: HomeTab =
    showTabs && isWorkspaceKey(wsParam) && workspaces.includes(wsParam) ? wsParam : "home";

  const selectTab = (tab: HomeTab) => {
    const next = new URLSearchParams(params);
    if (tab === "home") next.delete("ws");
    else next.set("ws", tab);
    setParams(next);
  };

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-[1280px] flex-col gap-6 pb-12 text-primary",
        isMemberRoute ? "pt-6" : "px-[clamp(16px,3vw,32px)] pt-[clamp(16px,3vw,32px)]"
      )}
    >
      {showTabs ? (
        <PillTabs<HomeTab>
          ariaLabel="Home workspaces"
          className="self-start"
          value={current}
          onChange={selectTab}
          tabs={[
            { key: "home", label: "Home" },
            ...workspaces.map((key) => ({ key, label: WORKSPACE_LABELS[key] })),
          ]}
        />
      ) : null}
      {current === "home" ? (
        <HomeOverview isMemberRoute={isMemberRoute} />
      ) : (
        <WorkspaceView key={current} ws={current} />
      )}
    </div>
  );
};

/** The personal Home overview (unchanged). */
const HomeOverview = ({ isMemberRoute }: { isMemberRoute: boolean }) => {
  const guest = isGuestViewer();

  const { user } = useAuth();
  const events = useStore((state) => state.events);
  const membersOptions = useStore((state) => state.membersOptions);

  /* Annual theme */
  const { data: themeData } = useFetch(api.fetch.fetchActiveAnnualTheme);
  const theme = ((themeData as { data?: AnnualTheme } | null)?.data ?? null) as
    | (AnnualTheme & { imageUrl?: string; image?: string })
    | null;

  /* Events */
  const upcoming = useMemo(
    () => upcomingEventsFor(events, userAudienceIds(user.department, user.department_positions)),
    [events, user.department, user.department_positions]
  );

  /* Appointments */
  const requesterId = toStringValue(user?.id).trim();
  const { data: bookings, loading: apptLoading, refetch: refetchBookings } = useFetch(
    api.fetch.fetchAppointmentBookings,
    undefined,
    true
  );
  useEffect(() => {
    if (requesterId) refetchBookings({ requesterId });
  }, [refetchBookings, requesterId]);

  const appointments = useMemo(() => {
    if (!Array.isArray(bookings?.data)) return [];
    const lookup = membersOptions.reduce<Record<string, string>>((acc, option) => {
      acc[String(option.value)] = option.label;
      return acc;
    }, {});
    const today = startOfDay(new Date()).getTime();
    return bookings.data
      .map((item) => normalizeAppointmentRecord(item, lookup))
      .filter((a): a is Appointment => a !== null)
      .filter((a) => (appointmentStart(a)?.getTime() ?? 0) >= today)
      .sort(
        (a, b) =>
          (appointmentStart(a)?.getTime() ?? Number.MAX_SAFE_INTEGER) -
          (appointmentStart(b)?.getTime() ?? Number.MAX_SAFE_INTEGER)
      );
  }, [bookings, membersOptions]);

  /* School of Ministry */
  const { enrollments, active } = useLearnerOverview();
  const sessionsQuery = useMemo(() => ({ from: new Date().toISOString().slice(0, 10) }), []);
  const { data: sessionsData } = useFetch(api.fetch.fetchLearnerSessions, sessionsQuery);
  const showSchool = active.length > 0;

  /* Your week: the next seven days, starting today. */
  const weekItems = useMemo<WeekItem[]>(() => {
    const from = startOfDay(new Date());
    const to = addDays(from, 7);
    const inWeek = (d: Date | null): d is Date => !!d && d >= from && d < to;
    const items: WeekItem[] = [];

    upcoming.forEach((e) => {
      const start = eventStart(e);
      if (!start) return;
      const end = eventEnd(e) ?? start;
      // Multi-day events appear on each day they run.
      for (let day = startOfDay(start); day <= end && day < to; day = addDays(day, 1)) {
        if (day < from) continue;
        items.push({
          key: `event-${e.id}-${day.getDate()}`,
          kind: "church",
          title: eventName(e),
          time: e.start_time || "",
          date: day.getTime() === startOfDay(start).getTime() ? start : day,
        });
      }
    });

    appointments.forEach((a, i) => {
      const d = appointmentStart(a);
      if (!inWeek(d)) return;
      items.push({
        key: `appt-${a.id ?? i}`,
        kind: "appt",
        title: a.purpose || "Appointment",
        time: a.session?.start ?? "",
        date: d,
      });
    });

    (sessionsData?.data ?? [])
      .filter((s) => !s.cancelled)
      .forEach((s) => {
        const d = new Date(s.startsAt);
        if (!inWeek(d)) return;
        items.push({ key: `session-${s.id}`, kind: "som", title: s.title || "Live session", time: hhmm(d), date: d });
      });

    flattenAssignments(enrollments)
      .filter(isOutstanding)
      .forEach((a) => {
        const d = a.dueDate ? new Date(a.dueDate) : null;
        if (!inWeek(d)) return;
        const type = ASSESSMENT_TYPE[a.type];
        items.push({
          key: `due-${a.programId}-${a.topicId}`,
          kind: "som",
          title: `${type ? `${type}: ` : ""}${a.name} due`,
          time: hhmm(d),
          date: d,
        });
      });

    return items;
  }, [upcoming, appointments, sessionsData, enrollments]);

  const notificationsPath = isMemberRoute
    ? relativePath.member.notifications
    : `${relativePath.home.main}/${relativePath.home.notifications}`;

  return (
    <>
      <HomeHeader theme={theme} isMemberRoute={isMemberRoute} />

      <NextUpHero
        events={upcoming}
        showRides={!guest}
        bannerImage={theme?.imageUrl || theme?.image}
      />

      <YourWeek items={weekItems} showSchool={showSchool} />

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[2_1_min(100%,480px)] flex-col gap-6">
          <CommunityCard />
          <RecentSermons notificationsPath={notificationsPath} />
        </div>

        <aside className="flex min-w-0 flex-[1_1_min(100%,300px)] flex-col gap-6">
          {showSchool && <SchoolCard enrollments={enrollments} active={active} />}
          <AppointmentsCard appointments={appointments} loading={apptLoading && !bookings} />
          <QuickActions />
        </aside>
      </div>
    </>
  );
};
