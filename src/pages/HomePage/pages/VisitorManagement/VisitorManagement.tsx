import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAccessControl } from "@/CustomHooks/useAccessControl";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { showNotification } from "@/pages/HomePage/utils";
import {
  Field,
  FilterPanel,
  FilterToggleButton,
  PageHeading,
  PillTabs,
  SearchInput,
  SectionEmpty,
  SelectInput,
  TextInput,
  UiButton,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { matchesQuery } from "@/pages/HomePage/pages/MembershipManagement/components/manager/managerHelpers";
import { relativePath } from "@/utils/const";
import { exportVisitorsToExcel } from "@/utils/api/visitors/visitorActions";
import type { QueryType } from "@/utils/interfaces";

import { useVisitorDialogs } from "./Components/useVisitorDialogs";
import { VisitorCard } from "./Components/VisitorCard";
import {
  HEARD_OPTIONS,
  heardLabel,
  STAGE_PILL,
  useVisitorRecords,
  visitorDetailsPath,
  VisitorRecord,
  visitorsPath,
  VisitorStage,
} from "./utils/visitorHelpers";

type StageTab = "all" | VisitorStage;
type GroupBy = "date" | "event";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STAGE_TABS: { key: StageTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "need", label: "Needs follow-up" },
  { key: "done", label: "Followed up" },
  { key: "member", label: "Became members" },
];

const EMPTY_FILTERS = { month: "", event: "", ref: "" };

const monthLabel = (key: string) =>
  `${MONTHS[Number(key.slice(5, 7)) - 1] ?? ""} ${key.slice(0, 4)}`.trim();

export function VisitorManagement() {
  const navigate = useNavigate();
  const { canManage } = useAccessControl();
  const canManageVisitors = canManage("Visitors");

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<StageTab>("all");
  const [groupBy, setGroupBy] = useState<GroupBy>("date");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  // Visit month is matched against every visit on the server.
  const serverQuery = useMemo<QueryType | undefined>(
    () => (filters.month ? { visitMonth: filters.month } : undefined),
    [filters.month]
  );
  const { records, loaded, refetch } = useVisitorRecords(serverQuery);

  const dialogs = useVisitorDialogs({ onChanged: refetch, afterConvertPath: visitorsPath });

  const eventOptions = useMemo(
    () =>
      Array.from(new Set(records.map((record) => record.eventName).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [records]
  );
  const referralOptions = useMemo(() => {
    const stored = records
      .map((record) => record.howHeard)
      .filter((value) => value && !HEARD_OPTIONS.some((option) => option.value === value));
    return [
      ...HEARD_OPTIONS,
      ...Array.from(new Set(stored)).map((value) => ({ value, label: value })),
    ];
  }, [records]);

  const filtered = useMemo(
    () =>
      records.filter(
        (record) =>
          matchesQuery(query, [record.name, record.visitor.phone, record.visitor.email]) &&
          (!filters.event || record.eventName === filters.event) &&
          (!filters.ref || record.howHeard === filters.ref)
      ),
    [filters.event, filters.ref, query, records]
  );

  const list = useMemo(
    () =>
      filtered
        .filter((record) => tab === "all" || record.stage === tab)
        .sort((a, b) => (b.lastVisit > a.lastVisit ? 1 : b.lastVisit < a.lastVisit ? -1 : 0)),
    [filtered, tab]
  );

  const sections = useMemo(() => {
    const groups = new Map<string, VisitorRecord[]>();
    list.forEach((record) => {
      const key =
        groupBy === "event" ? record.eventName || "No event" : record.lastVisit.slice(0, 7);
      const group = groups.get(key);
      if (group) group.push(record);
      else groups.set(key, [record]);
    });
    const entries = Array.from(groups.entries());
    if (groupBy === "event") entries.sort((a, b) => b[1].length - a[1].length);
    return entries.map(([key, items]) => ({
      key,
      label: groupBy === "event" ? key : monthLabel(key),
      items,
    }));
  }, [groupBy, list]);

  const filterCount = Object.values(filters).filter(Boolean).length;
  const hasQuery = Boolean(query.trim()) || filterCount > 0 || tab !== "all";

  const resetAll = () => {
    setQuery("");
    setTab("all");
    setFilters(EMPTY_FILTERS);
  };

  const exportList = async () => {
    try {
      await exportVisitorsToExcel(
        list.map((record) => ({
          title: record.visitor.title || "",
          firstName: record.visitor.firstName || "",
          lastName: record.visitor.lastName || "",
          gender: record.visitor.gender || "",
          phone: record.phone,
          email: record.visitor.email || "",
          city: record.visitor.city || "",
          firstVisit: record.firstVisit,
          lastVisit: record.lastVisit,
          visits: record.visitCount,
          event: record.eventName,
          referral: heardLabel(record.howHeard),
          followUps: record.followUps.length,
          status: STAGE_PILL[record.stage].label,
        }))
      );
      showNotification(
        `Exported ${list.length} ${list.length === 1 ? "visitor" : "visitors"}`,
        "success"
      );
    } catch {
      showNotification("Could not export visitors.", "error");
    }
  };

  const cardActions = (record: VisitorRecord) => {
    const visitor = record.visitor;
    return [
      { label: "View profile", onClick: () => navigate(visitorDetailsPath(record.id)) },
      { label: "Edit visitor", onClick: () => dialogs.edit(visitor), hidden: !canManageVisitors },
      {
        label: "Record follow-up",
        onClick: () => dialogs.recordFollowUp(visitor),
        hidden: !canManageVisitors,
      },
      {
        label: "Convert to member",
        onClick: () => dialogs.convert(visitor),
        hidden: !canManageVisitors || record.stage === "member",
      },
      {
        label: "Delete visitor",
        onClick: () => dialogs.remove(visitor),
        danger: true,
        hidden: !canManageVisitors,
      },
    ];
  };

  return (
    <PageOutline
      crumbs={[{ label: "Home", link: relativePath.home.main }, { label: "Visitors" }]}
    >
      <div className="flex flex-col gap-6">
        <PageHeading
          title={`Visitor Management (${records.length})`}
          subtitle="Register, track and follow up with people who visit."
          actions={
            <>
              <FilterToggleButton
                open={showFilters}
                count={filterCount}
                onClick={() => setShowFilters((open) => !open)}
              />
              <UiButton onClick={() => void exportList()} disabled={list.length === 0}>
                Export to Excel
              </UiButton>
              {canManageVisitors && (
                <UiButton tone="primary" onClick={dialogs.register}>
                  Register visitor
                </UiButton>
              )}
            </>
          }
        />

        {showFilters && (
          <FilterPanel
            title="Refine visitors"
            helper="Combine filters to narrow the list without losing the search term."
            onReset={() => setFilters(EMPTY_FILTERS)}
            resetDisabled={filterCount === 0}
          >
            <Field label="Visit month">
              <TextInput
                type="month"
                value={filters.month}
                onChange={(event) => setFilters({ ...filters, month: event.target.value })}
              />
            </Field>
            <Field label="Event">
              <SelectInput
                options={[
                  { value: "", label: "All events" },
                  ...eventOptions.map((name) => ({ value: name, label: name })),
                ]}
                value={filters.event}
                onChange={(event) => setFilters({ ...filters, event: event.target.value })}
              />
            </Field>
            <Field label="Referral">
              <SelectInput
                options={[{ value: "", label: "All referrals" }, ...referralOptions]}
                value={filters.ref}
                onChange={(event) => setFilters({ ...filters, ref: event.target.value })}
              />
            </Field>
          </FilterPanel>
        )}

        <PillTabs
          ariaLabel="Follow-up status"
          tabs={STAGE_TABS.map((entry) => ({
            ...entry,
            count: filtered.filter((record) => entry.key === "all" || record.stage === entry.key)
              .length,
          }))}
          value={tab}
          onChange={setTab}
        />

        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by name, phone or email"
            ariaLabel="Search visitors"
            className="max-w-[420px]"
          />
          <div className="ml-auto">
            <PillTabs
              ariaLabel="Group visitors"
              tabs={[
                { key: "date" as GroupBy, label: "Group by date" },
                { key: "event" as GroupBy, label: "Group by event" },
              ]}
              value={groupBy}
              onChange={(next) => {
                setGroupBy(next);
                setOpenGroups({});
              }}
            />
          </div>
        </div>

        {!loaded ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-[280px] animate-pulse rounded-2xl bg-[#F3F4F6]" />
            ))}
          </div>
        ) : list.length === 0 ? (
          hasQuery ? (
            <SectionEmpty
              title="No visitors found"
              text="No visitors match the current search or filters. Try a different name, event or referral source."
              action={<UiButton onClick={resetAll}>Reset view</UiButton>}
            />
          ) : (
            <SectionEmpty
              title="No visitors yet"
              text="Visitor records will appear here after a visitor is registered."
              action={
                canManageVisitors ? (
                  <UiButton tone="primary" onClick={dialogs.register}>
                    Register visitor
                  </UiButton>
                ) : undefined
              }
            />
          )
        ) : (
          <>
            <p className="text-sm text-[#4B5563]">
              {list.length} {list.length === 1 ? "visitor matches" : "visitors match"} the
              current view.
            </p>
            {sections.map((section, index) => {
              const open = openGroups[section.key] ?? index === 0;
              return (
                <div key={section.key} className="flex flex-col gap-4">
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenGroups((prev) => ({ ...prev, [section.key]: !open }))}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-lightGray bg-[#F8F9FC] px-4 py-3 text-left text-base font-semibold text-primary transition-colors hover:bg-lightGray/30"
                  >
                    <span>
                      {section.label} ({section.items.length})
                    </span>
                    <span className="text-lg leading-none" aria-hidden="true">
                      {open ? "−" : "+"}
                    </span>
                  </button>
                  {open && (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4">
                      {section.items.map((record) => (
                        <VisitorCard
                          key={record.id}
                          record={record}
                          onOpen={() => navigate(visitorDetailsPath(record.id))}
                          actions={cardActions(record)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
      {dialogs.dialogs}
    </PageOutline>
  );
}
