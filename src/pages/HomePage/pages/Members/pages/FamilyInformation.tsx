import { useFetch } from "@/CustomHooks/useFetch";
import { api, formatDate, IFamilyInformationRaw, IFamilyPerson, IFamilyRelationRaw, IMemberInfo } from "@/utils";
import { useOutletContext } from "react-router-dom";

// Define interfaces matching backend response with nested user_info


export const FamilyInformation = () => {
  const { familyData:data } = useOutletContext<{
    familyData: IFamilyInformationRaw;
  }>();

  console.log("family data", data);

  // Normalize backend relation data to flat structure for UI consumption
  const normalizeRelation = (
    items: IFamilyRelationRaw[] = []
  ): IFamilyPerson[] =>
    items.map((item) => {
      const info = item.user_info;

      return {
        id: item.id,
        name:
          info?.first_name || info?.last_name
            ? `${info?.first_name ?? ""} ${info?.last_name ?? ""}`.trim()
            : item.name || "-",
        gender: info?.gender,
        date_of_birth: info?.date_of_birth,
        nationality: info?.nationality,
        primary_number: info?.primary_number,
        email: info?.email ?? item.email,
        is_member: item.is_user,
      };
    });

  const hasAnyFamilyData = () => {
    return (
      normalizeRelation(data?.spouses).length > 0 ||
      normalizeRelation(data?.children).length > 0 ||
      normalizeRelation(data?.parents).length > 0 ||
      normalizeRelation(data?.siblings).length > 0 ||
      normalizeRelation(data?.others).length > 0
    );
  };

  // Generic relation section renderer
  const renderRelationSection = (
    title: string,
    items: IFamilyPerson[],
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
                    <span>{person.name || "-"}</span>
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
                value={person.primary_number || "-"}
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
      {!hasAnyFamilyData() ? (
        <EmptyState />
      ) : (
        <>
          {renderRelationSection(
            "Spouses",
            normalizeRelation(data?.spouses),
            "Spouse"
          )}

          {renderRelationSection(
            "Children",
            normalizeRelation(data?.children),
            "Child"
          )}

          {renderRelationSection(
            "Parents",
            normalizeRelation(data?.parents),
            "Parent"
          )}

          {renderRelationSection(
            "Siblings",
            normalizeRelation(data?.siblings),
            "Sibling"
          )}

          {renderRelationSection(
            "Others",
            normalizeRelation(data?.others),
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

const EmptyState = () => (
  <div className="py-12 flex flex-col items-center justify-center text-center text-gray-500">
    <p className="text-lg font-semibold text-gray-700 mb-2">
      No family information available
    </p>
    <p className="max-w-md">
      Family relationships have not been added for this member yet.
    </p>
  </div>
);
