import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { AccessRightOption } from "../utils/settingsInterfaces";
import TableData from "./TableData";

interface IProps {
  name: string;
  permissions: Record<string, string>;
}
export const ActiveAccess = (props: IProps) => {
  const accessColumns: ColumnDef<AccessRightOption>[] = [
    { header: "Modules / Sub-modules", accessorKey: "name" },
    {
      header: "Access Level Management",
      accessorKey: "accessLevel",
      cell: ({ row }) => TableData(row.original.accessLevel),
    },
  ];

  const modules = useMemo(() => {
    const accessLevelMap: Record<string, string> = {
      Can_View: "Can View",
      Can_Manage: "Can Manage",
      Super_Admin: "Super Admin",
    };

    return props.permissions
      ? Object.entries(props.permissions).map(([name, accessLevel], index) => ({
          id: index,
          name: name.replace(/_/g, " "),
          accessLevel: accessLevelMap[accessLevel] || accessLevel || "",
        }))
      : [];
  }, [props.permissions]);

  return (
    <>
      <div className="flex justify-between">
        <h2 className="text-lg font-semibold mb-4">{props.name}</h2>
      </div>
      <TableComponent
      //   @ts-expect-error i have no idea what is happening and I wrote the table component myself 🤷🏾‍♂️ good luck
        columns={accessColumns}
        data={modules || []}
        rowClass="even:bg-white odd:bg-lightGray/10"
        className={""}
      />
    </>
  );
};
