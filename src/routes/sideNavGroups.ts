/**
 * Sections of the icon rail, top to bottom. The rail draws a divider between
 * sections, and the access-level editor in Settings groups its modules the
 * same way so a permission sits beside the module it opens.
 */
export type NavGroup =
  | "Overview"
  | "People"
  | "Ministry & engagement"
  | "Operations"
  | "Administration";

/** Top level side tabs (by route `name`) in each section, in rail order. */
export const SIDE_NAV_GROUPS: { group: NavGroup; tabs: string[] }[] = [
  { group: "Overview", tabs: ["Home", "Reports"] },
  {
    group: "People",
    tabs: ["Membership", "Visitors", "Life Centers", "Attendance", "Ride to church"],
  },
  {
    group: "Ministry & engagement",
    tabs: ["Events", "Communication", "Appointments", "School of Ministry"],
  },
  {
    group: "Operations",
    tabs: ["Finance", "Requisition", "Assets", "Market Place"],
  },
  { group: "Administration", tabs: ["Settings"] },
];

export const NAV_GROUPS: NavGroup[] = SIDE_NAV_GROUPS.map(({ group }) => group);

/**
 * Splits side tabs into rail sections, dropping empty ones. Tabs not listed in
 * `SIDE_NAV_GROUPS` keep their route-table order in a trailing section so a
 * new module still shows up before it is placed.
 */
export const groupSideTabs = <T extends { name: string }>(tabs: T[]): T[][] => {
  const byName = new Map(tabs.map((tab) => [tab.name, tab]));
  const placed = new Set<string>();
  const sections = SIDE_NAV_GROUPS.map(({ tabs: names }) =>
    names.flatMap((name) => {
      const tab = byName.get(name);
      if (!tab) return [];
      placed.add(name);
      return [tab];
    })
  );
  sections.push(tabs.filter((tab) => !placed.has(tab.name)));
  return sections.filter((section) => section.length > 0);
};
