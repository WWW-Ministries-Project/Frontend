import React, { useEffect } from "react";
import { useStore } from "@/store/useStore";
import DeleteIcon from "@/assets/DeleteIcon";
import Button from "@/components/Button";

const TableHeader = ({ header }: { header: string }) => {
  return (
    <th className="border border-[#D9D9D9] px-2 py-1 text-left">{header}</th>
  );
};

const TableData = ({
  children,
  className,
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) => {
  return (
    <td
      className={`border border-[#D9D9D9] px-2 py-1 ${className}`}
      colSpan={colSpan}
    >
      {children}
    </td>
  );
};

interface InputProps {
  type: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}
const TableInput = ({ type, value, onChange, disabled }: InputProps) => {
  return (
    <input
      type={type}
      className="w-full bg-inherit border-none outline-none rounded px-2 py-1"
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  );
};

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
  data,
}) => {
  const { addRow, deleteRow, rows, updateRow, setInitialRows } = useStore();

  const products = data ?? [];

  useEffect(() => {
    if (products) {
      setInitialRows(products);
    }
  }, [setInitialRows]);
  const handleInputChange = (
    index: number,
    field: keyof TableRow,
    value: string
  ) => {
    updateRow(index, field, value);
  };

  const totalSum = rows.reduce((sum, row) => sum + row.total, 0);

  return (
    <div className="p-4">
      {isEditable && (
        <Button
          value="+ Add item"
          className="font-bold text-primaryViolet cursor-pointer float-right"
          onClick={addRow}
        />
      )}
      {rows?.length > 0 && (
        <table className="min-w-full border-collapse border border-[#D9D9D9]">
          <thead>
            <tr className="bg-[#F2F4F7]">
              <TableHeader header="Name" />
              <TableHeader header="Quantity" />
              <TableHeader header="Amount" />
              <TableHeader header="Total" />

              {isEditable && <TableHeader header="Remove" />}
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
                  />
                </TableData>
                <TableData>{row.total}</TableData>
                {isEditable && (
                  <TableData className="mt-2 flex items-center justify-center border-none">
                    <DeleteIcon onClick={() => deleteRow(index)} />
                  </TableData>
                )}
              </tr>
            ))}
            <tr >
              <TableData colSpan={3}>Total</TableData>
              <TableData>{totalSum.toFixed(2)}</TableData>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
};

export default EditableTable;
