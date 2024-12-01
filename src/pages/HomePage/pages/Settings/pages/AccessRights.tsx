import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { TableList } from "../Components/AccessTable";

interface AccessRight {
  id: number;
  name: string;
}
interface Module {
  id: number;
  name: string;
  accessLevel: "Can View" | "Can Manage";
}

const modules: Module[] = [
  { id: 1, name: "Members", accessLevel: "Can View" },
  { id: 2, name: "Events", accessLevel: "Can View" },
  { id: 3, name: "My requests", accessLevel: "Can View" },
  { id: 4, name: "Staff request", accessLevel: "Can Manage" },
  { id: 5, name: "Suppliers", accessLevel: "Can Manage" },
  { id: 6, name: "Asset", accessLevel: "Can Manage" },
  { id: 7, name: "Users", accessLevel: "Can Manage" },
  { id: 8, name: "Department", accessLevel: "Can Manage" },
  { id: 9, name: "Positions", accessLevel: "Can Manage" },
  { id: 10, name: "Access rights", accessLevel: "Can Manage" },
];

const accessRights: AccessRight[] = [
  { id: 1, name: "Super Admin" },
  { id: 2, name: "Cashier" },
  { id: 3, name: "Accountant" },
  { id: 4, name: "Product Designer" },
  { id: 5, name: "HR Manager" },
  { id: 6, name: "Overseer" },
  { id: 7, name: "Product Owner" },
  { id: 8, name: "Secretary" },
];

const AccessRights = () => {
  return (
    <PageOutline>
      <PageHeader title="Access Rights"></PageHeader>
      <section className="grid gap-4 grid-cols-3">
        <TableList
          title="All Access Rights"
          columns={[""]}
          data={accessRights}
          renderRow={(item) => <td className="px-4 py-2">{item.name}</td>}
          actions={[
            {
              label: "Create access right",
              onClick: () => alert("Create Access Right Clicked"),
              className: "bg-purple-600 text-white hover:bg-purple-700",
            },
          ]}
        />
        <TableList
          title="Super admin"
          columns={["Modules / Sub-modules", "Access Level Management"]}
          data={modules}
          renderRow={(module) => (
            <>
              <td className="px-4 py-2 border-b">{module.name}</td>
              <td className="px-4 py-2 border-b">
                <span
                  className={`inline-flex items-center px-2 py-1 text-sm font-medium rounded-md ${
                    module.accessLevel === "Can View"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full mr-2 ${
                      module.accessLevel === "Can View"
                        ? "bg-blue-500"
                        : "bg-green-500"
                    }`}
                  ></span>
                  {module.accessLevel}
                </span>
              </td>
            </>
          )}
          actions={[
            {
              label: "Close",
              onClick: () => alert("Close clicked"),
              className: "bg-gray-100 text-gray-600 hover:bg-gray-200",
            },
            {
              label: "Edit",
              onClick: () => alert("Edit clicked"),
              className: "bg-blue-600 text-white hover:bg-blue-700",
            },
          ]}
        />
      </section>
    </PageOutline>
  );
};

const TableData = (name: string) => {
  return <td>{name}</td>;
};

export default AccessRights;
