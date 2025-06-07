import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { HeaderControls } from "@/components/HeaderControls";
import { SoulsWonType } from "@/utils/api/lifeCenter/interfaces";
import { tableColumns } from "../utils/tableColumn";

export function SoulsWon({ soulsWon }: { soulsWon: SoulsWonType[] }) {
  return (
    <div>
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
    </div>
  );
}
