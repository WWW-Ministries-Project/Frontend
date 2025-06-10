import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { HeaderControls } from "@/components/HeaderControls";
import { SoulsWonType } from "@/utils/api/lifeCenter/interfaces";
import { ColumnDef } from "@tanstack/react-table";
import ActionButton from "@/pages/HomePage/Components/reusable/ActionButton";
import { useMemo, useState } from "react";
import { useDelete } from "@/CustomHooks/useDelete";
import { api } from "@/utils/api/apiCalls";
import { showDeleteDialog, showNotification } from "@/pages/HomePage/utils";

interface Props {
  soulsWon: SoulsWonType[];
  setSoulsWon: React.Dispatch<React.SetStateAction<SoulsWonType[]>>;
}

export function SoulsWon({ soulsWon, setSoulsWon }: Props) {
  const [selectedId, setSelectedId] = useState<number | string>("");

  const { executeDelete } = useDelete(api.delete.deleteSoulWon);

  const handleShowOptions = (id: number | string) => {
    setSelectedId((prev) => (prev === id ? "" : id));
  };

  const deleteSoul = (id: string, name: string) => {
    showDeleteDialog({ id, name }, async () => {
      await executeDelete({ id });
      setSoulsWon((prev) => prev.filter((soul) => soul.id !== id));
      showNotification("Soul deleted successfully", "success");
    });
  };

  const tableColumns: ColumnDef<SoulsWonType>[] = useMemo(
    () => [
      {
        header: "NAME",
        cell: ({ row }) => {
          const name = `${row.original.first_name} ${row.original.last_name}`;
          return <div>{name}</div>;
        },
      },
      {
        header: "CONTACT",
        accessorKey: "contact_number",
      },
      {
        header: "LOCATION",
        accessorKey: "country",
      },
      {
        header: "DATE WON",
        accessorKey: "date_won",
      },
      {
        header: "WON BY",
        accessorKey: "wonByName",
      },
      {
        header: "Action",
        cell: ({ row }) => {
          const name = `${row.original.first_name} ${row.original.last_name}`;
          return (
            <div onClick={() => handleShowOptions(row.original.id)}>
              <ActionButton
                showOptions={row.original.id === selectedId}
                onDelete={() => deleteSoul(row.original.id, name)}
                onEdit={() => {}}
              />
            </div>
          );
        },
      },
    ],
    [deleteSoul]
  );

  return (
    <>
      <HeaderControls
        title={`Souls won (${soulsWon.length})`}
        subtitle=""
        screenWidth={window.innerWidth}
        btnName="Add Record"
        handleClick={() => {}}
      />

      <TableComponent
        columns={tableColumns}
        data={soulsWon}
        displayedCount={10}
      />
    </>
  );
}
