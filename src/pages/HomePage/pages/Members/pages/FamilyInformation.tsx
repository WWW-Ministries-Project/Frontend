import EmptyState from "@/components/EmptyState";
import { formatDate, formatPhoneNumber } from "@/utils";
import { FamilyRelation, normalizeFamilyRelation } from "@/utils/familyRelations";

type FamilyMemberView = {
  relation?: string;
  first_name?: string;
  last_name?: string;
  gender?: string;
  date_of_birth?: string;
  nationality?: string;
  country_code?: string;
  primary_number?: string;
};

const relationSections: { key: FamilyRelation; title: string; badgeLabel: string }[] = [
  { key: "spouse", title: "Spouses", badgeLabel: "Spouse" },
  { key: "parent", title: "Parents", badgeLabel: "Parent" },
  { key: "child", title: "Children", badgeLabel: "Child" },
  { key: "sibling", title: "Siblings", badgeLabel: "Sibling" },
  { key: "guardian", title: "Guardians", badgeLabel: "Guardian" },
  { key: "dependent", title: "Dependents", badgeLabel: "Dependent" },
  { key: "grandparent", title: "Grandparents", badgeLabel: "Grandparent" },
  { key: "grandchild", title: "Grandchildren", badgeLabel: "Grandchild" },
  { key: "in-law", title: "In-laws", badgeLabel: "In-law" },
];

const knownRelations = new Set(relationSections.map((section) => section.key));

const groupByRelation = (items: FamilyMemberView[] = []) => {
  return items.reduce((acc: Record<string, FamilyMemberView[]>, item) => {
    const key = normalizeFamilyRelation(item.relation) || "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
};

export const FamilyInformation = ({ familyData }: { familyData: FamilyMemberView[] }) => {
  const grouped = groupByRelation(familyData);

  const hasAnyFamilyData = familyData && familyData.length > 0;
  const otherRelations = Object.entries(grouped)
    .filter(([relation]) => relation !== "other" && !knownRelations.has(relation as FamilyRelation))
    .flatMap(([, members]) => members);
  const uncategorizedRelations = [...(grouped.other || []), ...otherRelations];

  const renderRelationSection = (
    title: string,
    items: FamilyMemberView[] = [],
    badgeLabel: string
  ) => {
    if (!items || items.length === 0) {
      return null;
    }

    return (
      <Section title={title}>
        {items.map((person, index) => (
          <div key={index} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <InfoField
                label="Name"
                value={
                  <div className="flex items-center">
                    <span>{`${person.first_name ?? ""} ${person.last_name ?? ""}`.trim() || "-"}</span>
                    <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {badgeLabel}
                    </span>
                  </div>
                }
              />
              <InfoField label="Gender" value={person.gender || "-"} />
              <InfoField
                label="Date of birth"
                value={
                  person.date_of_birth
                    ? formatDate(person.date_of_birth)
                    : "-"
                }
              />
              <InfoField
                label="Nationality"
                value={person.nationality || "-"}
              />
              <InfoField
                label="Contact"
                value={formatPhoneNumber(person.country_code, person.primary_number) || "-"}
              />
            </div>

            {index < items.length - 1 && <hr className="mt-4" />}
          </div>
        ))}
      </Section>
    );
  };

  return (
    <div className="bg-white rounded-b-lg pt-0 mx-auto text-gray-800">
      {!hasAnyFamilyData ? (
        <EmptyState
          scope="section"
          msg="No family information available"
          description="Family relationships have not been added for this member yet."
        />
      ) : (
        <>
          {relationSections.map((section) =>
            renderRelationSection(
              section.title,
              grouped[section.key],
              section.badgeLabel
            )
          )}

          {renderRelationSection("Other Relations", uncategorizedRelations, "Relation")}
        </>
      )}
    </div>
  );
};

const InfoField = ({
  label,
  value,
}: {
  label: string;
  value: string | React.ReactNode;
}) => (
  <div className="mb-3">
    <p className="text-gray-600 font-medium mb-1">{label}</p>
    <div className="font-semibold text-gray-900">{value || "-"}</div>
  </div>
);

// Section component for consistent section styling
const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section
    className="py-4"
    aria-labelledby={title.replace(/\s+/g, "-").toLowerCase()}
  >
    <h2
      id={title.replace(/\s+/g, "-").toLowerCase()}
      className="text-xl font-bold text-gray-800 mb-4"
    >
      {title}
    </h2>
    {children}
  </section>
);
