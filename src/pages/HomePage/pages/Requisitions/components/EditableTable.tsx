import React, { useEffect, useMemo } from "react";
import { useStore } from "@/store/useStore";
import DeleteIcon from "@/assets/DeleteIcon";
import Button from "@/components/Button";

const TableHeader = ({
  header,
  className = "",
}: {
  header: string;
  className?: string;
}) => (
  <th className={`border border-[#D9D9D9] px-2 py-1 ${className}`}>
    {header}
  </th>
);

const TableData = ({
  children,
  className = "",
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) => (
  <td
    className={`border border-[#D9D9D9] px-2 py-1 ${className}`}
    colSpan={colSpan}
  >
    {children}
  </td>
);

const TableInput = ({
  type,
  value,
  onChange,
  disabled,
  className = "",
}: {
  type: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  className?: string;
}) => (
  <input
    type={type}
    className={`w-full bg-inherit border-none outline-none rounded px-2 py-1 ${className}`}
    value={value}
    onChange={onChange}
    disabled={disabled}
  />
);

interface TableRow {
  name: string;
  quantity: number;
  amount: number;
  total: number;
}

interface EditableTableProps {
  isEditable?: boolean;
  data?: {
    name: string;
    quantity: number;
    amount: number;
    total: number;
    id: string;
  }[];
}

const EditableTable: React.FC<EditableTableProps> = ({
  isEditable = true,
  data = [],
}) => {
  const { addRow, deleteRow, rows, updateRow, setInitialRows } = useStore();

  useEffect(() => {
    if (data.length) setInitialRows(data);
  }, [data, setInitialRows]);

  const handleInputChange = (
    index: number,
    field: keyof TableRow,
    value: string
  ) => {
    updateRow(index, field, value);
  };

  const totalSum = useMemo(
    () => rows.reduce((sum, row) => sum + row.total, 0),
    [rows]
  );

  const textPosition = isEditable ? "text-left" : "text-center";

  return (
    <div className="py-4">
      {isEditable && (
        <Button
          value="+ Add item"
          className="font-bold text-primaryViolet cursor-pointer float-right"
          onClick={addRow}
        />
      )}
      {rows.length > 0 && (
        <table className="min-w-full border-collapse border border-[#D9D9D9]">
          <thead>
            <tr className="bg-[#F2F4F7]">
              <TableHeader header="Name" className="text-left pl-4" />
              <TableHeader header="Quantity" className={textPosition} />
              <TableHeader header="Amount" className={textPosition} />
              <TableHeader header="Total" className="text-center" />
              {isEditable && (
                <TableHeader header="Remove" className="text-center" />
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className="odd:bg-white even:bg-[#F2F4F7]">
                <TableData>
                  <TableInput
                    type="text"
                    value={row.name}
                    onChange={(e) =>
                      handleInputChange(index, "name", e.target.value)
                    }
                    disabled={!isEditable}
                  />
                </TableData>
                <TableData>
                  <TableInput
                    type="number"
                    value={row.quantity}
                    onChange={(e) =>
                      handleInputChange(index, "quantity", e.target.value)
                    }
                    disabled={!isEditable}
                    className={textPosition}
                  />
                </TableData>
                <TableData>
                  <TableInput
                    type="number"
                    value={row.amount}
                    onChange={(e) =>
                      handleInputChange(index, "amount", e.target.value)
                    }
                    disabled={!isEditable}
                    className={textPosition}
                  />
                </TableData>
                <TableData className="text-center">{row.total}</TableData>
                {isEditable && (
                  <TableData className="hover:bg-slate-100 flex items-center justify-center border-x-0 border-t-0 border-b-[1px] py-3">
                    <DeleteIcon onClick={() => deleteRow(index)} />
                  </TableData>
                )}
              </tr>
            ))}
            <tr className="font-semibold">
              <TableData colSpan={3} className="pl-3.5">Total</TableData>
              <TableData className="text-center">{totalSum.toFixed(2)}</TableData>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
};

export default EditableTable;
