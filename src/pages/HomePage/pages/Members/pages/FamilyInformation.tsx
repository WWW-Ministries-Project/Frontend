import { useOutletContext } from "react-router-dom";
//TODO : Correct interface to have the same source of truth as source once the API is ready

interface IChild {
  name: string;
  gender: string;
  date_of_birth: string;
  nationality: string;
}

interface IMemberInfo {
  member_id: string;
  spousal_info: {
    name: string;
    primary_number: string;
  };
  children: IChild[];
}

export const FamilyInformation = () => {
  const { details: user } = useOutletContext<{
    details: IMemberInfo;
  }>();

  return (
    <div className="bg-white rounded-b-lg p-6 pt-0 mx-auto text-gray-800">
      <Section title="Spousal Information">
        {user.spousal_info && (user.spousal_info.name || user.spousal_info.primary_number) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <InfoField
              label="Spouse Name"
              value={
                <div className="flex items-center">
                  <span>{user.spousal_info?.name || "-"}</span>
                  <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Active Member
                  </span>
                </div>
              }
            />
            <InfoField 
              label="Contact number" 
              value={user.spousal_info?.primary_number} 
            />
          </div>
        ) : (
          <div className="text-gray-500 italic">No spousal information available</div>
        )}
      </Section>
      
      <hr />
      
      <Section title="Children Information">
        {user.children && user.children.length > 0 ? (
          user.children.map((child, index) => (
            <div key={index} className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <InfoField
                  label="Name"
                  value={
                    <div className="flex items-center">
                      <span>{child.name || "-"}</span>
                      <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Child
                      </span>
                    </div>
                  }
                />
                <InfoField label="Gender" value={child.gender} />
                <InfoField label="Date of birth" value={child.date_of_birth} />
                <InfoField label="Nationality" value={child.nationality} />
              </div>
              {index < user.children.length - 1 && <hr className="mt-4" />}
            </div>
          ))
        ) : (
          <div className="text-gray-500 italic">No children information available</div>
        )}
      </Section>
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