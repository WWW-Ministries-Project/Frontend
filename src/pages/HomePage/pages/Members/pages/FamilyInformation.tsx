import { useFetch } from "@/CustomHooks/useFetch";
import { api, formatDate, formatPhoneNumber, IFamilyInformationRaw, IFamilyPerson, IFamilyRelationRaw, IMemberInfo } from "@/utils";
import { useOutletContext } from "react-router-dom";
import EmptyState from "@/components/EmptyState";

// Define interfaces matching backend response with nested user_info

const groupByRelation = (items: any[] = []) => {
  return items.reduce((acc: Record<string, any[]>, item) => {
    const key = item.relation || "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
};

export const FamilyInformation = ({ familyData }: { familyData: any[] }) => {
  // const { familyData:data } = useOutletContext<{
  //   familyData: IFamilyInformationRaw;
  // }>();

  console.log("family data", familyData);

  const grouped = groupByRelation(familyData);

  const hasAnyFamilyData = familyData && familyData.length > 0;

  // Generic relation section renderer
  const renderRelationSection = (
    title: string,
    items: any[] = [],
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
          {renderRelationSection(
            "Spouses",
            grouped.spouse,
            "Spouse"
          )}

          {renderRelationSection(
            "Children",
            grouped.child,
            "Child"
          )}

          {renderRelationSection(
            "Parents",
            grouped.parent,
            "Parent"
          )}

          {renderRelationSection(
            "Siblings",
            grouped.sibling,
            "Sibling"
          )}

          {renderRelationSection(
            "Others",
            grouped.other,
            "Relation"
          )}
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
