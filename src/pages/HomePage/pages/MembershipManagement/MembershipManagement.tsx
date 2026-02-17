import PageOutline from "../../Components/PageOutline";
import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { label: "Member Confirmation", path: "member-confirmation" },
  { label: "Visitor-to-Membership", path: "visitor-to-membership" },
] as const;

export const MembershipManagement = () => {
  return (
    <PageOutline className="p-6">
      <div className="space-y-6">
        <section className="space-y-2">
          <h1 className="text-2xl font-semibold text-primary">Membership Management</h1>
          <p className="text-sm text-gray-600">
            Confirm members and convert interested visitors into confirmed members.
          </p>
        </section>

        <div className="w-full border border-lightGray rounded-lg p-1 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 text-sm transition ${
                  isActive ? "bg-lightGray text-primary font-semibold" : "text-primary/80 hover:bg-lightGray/60"
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>

        <Outlet />
      </div>
    </PageOutline>
  );
};

export default MembershipManagement;
