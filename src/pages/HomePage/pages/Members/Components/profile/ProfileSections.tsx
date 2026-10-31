import { ReactNode } from "react";

import {
  Pill,
  UiButton,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import {
  formatDate,
  initialsOf,
  memberStatusPill,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUiUtils";

import {
  FamilyMemberView,
  groupByRelation,
  relationSections,
} from "./familyGrouping";
import {
  ProfileDepartment,
  ProfileMember,
  ProfileTab,
  childMeta,
  dateOfBirthLabel,
  employmentRows,
  familyOf,
  genderLabel,
  joinedDateOf,
  maritalLabel,
  membershipTypeLabel,
  personName,
  phoneLabel,
  programsOf,
  relationOf,
} from "./profileHelpers";

/* -------------------------------------------------------------------------- */
/*                                  Building                                  */
/* -------------------------------------------------------------------------- */

const SectionCard = ({
  title,
  subtitle,
  action,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <section className="flex flex-col gap-4 rounded-xl border border-lightGray bg-white p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-xl font-bold leading-7 text-gray-800">{title}</h2>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const InfoGrid = ({ rows }: { rows: [string, ReactNode][] }) => (
  <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,220px),1fr))] gap-x-8 gap-y-4">
    {rows.map(([label, value]) => (
      <div key={label} className="flex min-w-0 flex-col gap-1">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="break-words text-base font-semibold leading-6 text-gray-900 [overflow-wrap:anywhere]">
          {value === null || value === undefined || value === "" ? "—" : value}
        </p>
      </div>
    ))}
  </div>
);

const InfoCard = ({ title, rows }: { title: string; rows: [string, ReactNode][] }) => (
  <SectionCard title={title}>
    <InfoGrid rows={rows} />
  </SectionCard>
);

const DashedEmpty = ({ children }: { children: ReactNode }) => (
  <p className="rounded-lg border border-dashed border-lightGray px-4 py-3 text-sm text-gray-500">
    {children}
  </p>
);

/* -------------------------------------------------------------------------- */
/*                                    Tabs                                    */
/* -------------------------------------------------------------------------- */

export interface ProfileSectionsProps {
  tab: ProfileTab;
  member: ProfileMember;
  branchName: string;
  departments: ProfileDepartment[];
  canManage: boolean;
  onAssignDepartment: () => void;
  onRemoveDepartment: (department: ProfileDepartment) => void;
  onAddChild: () => void;
}

export const ProfileSections = ({
  tab,
  member,
  branchName,
  departments,
  canManage,
  onAssignDepartment,
  onRemoveDepartment,
  onAddChild,
}: ProfileSectionsProps) => {
  if (tab === "basic") {
    return (
      <InfoCard
        title="Personal Information"
        rows={[
          ["Title", member.title],
          ["First name", member.first_name],
          ["Middle name", member.other_name],
          ["Last name", member.last_name],
          ["Date of birth", dateOfBirthLabel(member.date_of_birth)],
          ["Gender", genderLabel(member.gender)],
          ["Marital status", maritalLabel(member.marital_status)],
          ["Nationality", member.nationality],
        ]}
      />
    );
  }

  if (tab === "contact") {
    const emergency = member.emergency_contact;
    return (
      <>
        <InfoCard
          title="Personal Contact"
          rows={[
            ["Email", member.email],
            ["Phone number", phoneLabel(member.country_code, member.primary_number)],
            ["Other number", member.other_number],
            ["Country of residence", member.country],
            ["Region / state", member.state_region],
            ["City / town", member.city],
          ]}
        />
        <InfoCard
          title="Emergency Contact"
          rows={[
            ["Name", emergency?.name],
            ["Relationship", emergency?.relation],
            ["Phone number", phoneLabel(emergency?.country_code, emergency?.phone_number)],
          ]}
        />
      </>
    );
  }

  if (tab === "church") {
    const joined = formatDate(joinedDateOf(member));
    return (
      <>
        <InfoCard
          title="Membership Information"
          rows={[
            ["Member ID", member.member_id],
            ["Membership type", membershipTypeLabel(member.membership_type)],
            ["Date joined", joined === "—" ? "" : joined],
            ["Branch", branchName],
            ["Membership status", memberStatusPill(member).label],
            ["Ministry worker", member.is_user ? "Yes" : "No"],
          ]}
        />
        <SectionCard
          title="Departments & positions"
          subtitle={
            member.is_user ? "Serving as a ministry worker." : "Not a ministry worker yet."
          }
          action={
            canManage ? (
              <UiButton tone="secondary" onClick={onAssignDepartment}>
                Assign department
              </UiButton>
            ) : undefined
          }
        >
          {departments.length === 0 ? (
            <DashedEmpty>Not serving in a department yet.</DashedEmpty>
          ) : (
            departments.map((department) => (
              <div
                key={department.key}
                className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-primary">
                    {department.department}
                  </p>
                  <p className="text-sm text-gray-600">
                    {department.position || "No position"}
                  </p>
                </div>
                {canManage && department.departmentId !== null && (
                  <UiButton
                    tone="danger"
                    size="sm"
                    onClick={() => onRemoveDepartment(department)}
                  >
                    Remove
                  </UiButton>
                )}
              </div>
            ))
          )}
        </SectionCard>
      </>
    );
  }

  if (tab === "employment") {
    return <InfoCard title="Employment / Schooling" rows={employmentRows(member)} />;
  }

  if (tab === "family") {
    const family = familyOf(member);
    const children = family.filter((person) => relationOf(person) === "child");
    const spouses = family
      .filter((person) => relationOf(person) === "spouse")
      .map(personName);
    const others = family.filter((person) => {
      const relation = relationOf(person);
      return relation !== "child" && relation !== "spouse";
    });
    const grouped = groupByRelation(others as FamilyMemberView[]);
    const relationLabel = (key: string) =>
      relationSections.find((section) => section.key === key)?.badgeLabel ?? "Relation";
    const emergency = member.emergency_contact;

    return (
      <>
        <InfoCard
          title="Household"
          rows={[
            ["Marital status", maritalLabel(member.marital_status)],
            ["Spouse", spouses.join(", ")],
            [
              "Emergency contact",
              emergency?.name
                ? `${emergency.name}${emergency.relation ? ` (${emergency.relation})` : ""}`
                : "",
            ],
          ]}
        />
        <SectionCard
          title={`Children (${children.length})`}
          action={
            canManage ? (
              <UiButton tone="secondary" onClick={onAddChild}>
                Add child
              </UiButton>
            ) : undefined
          }
        >
          {children.length === 0 ? (
            <DashedEmpty>No children recorded.</DashedEmpty>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-4">
              {children.map((child, index) => {
                const name = personName(child);
                return (
                  <div
                    key={`${child.user_id ?? name}-${index}`}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 p-4"
                  >
                    <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-lightGray font-semibold text-primary/70">
                      {initialsOf(name)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-primary">{name}</p>
                      <p className="text-sm text-gray-600">{childMeta(child) || "—"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
        {others.length > 0 && (
          <SectionCard title="Other family">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-4">
              {Object.entries(grouped).flatMap(([relation, people]) =>
                people.map((person, index) => {
                  const name = personName(person);
                  const phone = phoneLabel(person.country_code, person.primary_number);
                  return (
                    <div
                      key={`${relation}-${name}-${index}`}
                      className="flex flex-col gap-1 rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-base font-semibold text-primary">{name}</p>
                        <Pill tone="neutral">{relationLabel(relation)}</Pill>
                      </div>
                      <p className="text-sm text-gray-600">
                        {[childMeta(person), phone].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </SectionCard>
        )}
      </>
    );
  }

  const programs = programsOf(member);
  return (
    <SectionCard title="School of Ministry">
      {programs.length === 0 ? (
        <DashedEmpty>Not enrolled in any program.</DashedEmpty>
      ) : (
        programs.map((program) => (
          <div
            key={program.key}
            className="flex flex-col gap-2 rounded-lg border border-gray-200 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-base font-semibold text-primary">{program.name}</p>
              <Pill tone={program.tone}>{program.statusLabel}</Pill>
            </div>
            {program.percent !== null && (
              <div
                className="h-2 overflow-hidden rounded-full bg-gray-200"
                role="progressbar"
                aria-valuenow={program.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${program.name} progress`}
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${program.percent}%` }}
                />
              </div>
            )}
            <p className="text-xs text-gray-600">{program.meta}</p>
          </div>
        ))
      )}
    </SectionCard>
  );
};
