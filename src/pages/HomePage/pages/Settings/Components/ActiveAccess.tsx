import Button from "@/components/Button";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { ColumnDef } from "@tanstack/react-table";
import { AccessRightOption } from "../utils/settingsInterfaces";
import TableData from "./TableData";

interface IProps {
  name:string,
  accessLevel:string
}
const ActiveAccess = (props:IProps) => {

  console.log(props)
  const accessColumns: ColumnDef<AccessRightOption>[] = [
    { header: "Modules / Sub-modules", accessorKey: "name" },
    {
      header: "Access Level Management",
      accessorKey: "accessLevel",
      cell: ({ row }) => TableData(row.original.accessLevel),
    },
  ];
  const modules: AccessRightOption[] = [
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
  
  return (
    <section className="col-span-2">
      <div className="flex justify-between">
        <h2 className="text-lg font-semibold mb-4">{props.name}</h2>
        <div className="space-x-2">
          <Button
            type="button"
            value="Close"
            onClick={() => alert("Close clicked")}
            className="tertiary"
          />
          <Button
            type="button"
            value="Edit"
            onClick={() => alert("Edit clicked")}
            className="secondary"
          />
        </div>
      </div>
      <TableComponent
        columns={accessColumns}
        data={modules}
        rowClass="even:bg-white odd:bg-[#F2F4F7]"
        className={" shadow-md"}
      />
    </section>
  );
};

export default ActiveAccess;
