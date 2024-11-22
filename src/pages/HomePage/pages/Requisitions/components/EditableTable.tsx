import React, { useEffect, useState } from "react";
import useEditableTableStore from "../requisitionStore/EditableTableStore";
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
  }[];
}
const EditableTable: React.FC<EditableTableProps> = ({
  isEditable = true,
  data,
}) => {
  const { addRow, deleteRow, rows, updateRow, setInitialRows } =
    useEditableTableStore();
  const products = data ?? [
    { name: "Item 1", quantity: 1, amount: 100, total: 100 },
  ];
  // const [rows, setRows] = useState<TableRow[]>( isEditable ? [
  //   { name: "Item 1", quantity: 1, amount: 100, total: 100 },
  //   { name: "Item 2", quantity: 2, amount: 200, total: 400 },
  // ] : products);

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

  // const addRow = () => {
  //   setRows([...rows, { name: "", quantity: 0, amount: 0, total: 0 }]);
  // };

  // const deleteRow = (index: number) => {
  //   const updatedRows = rows.filter((_, i) => i !== index);
  //   setRows(updatedRows);
  // };

  return (
    <div className="p-4">
      {isEditable && (
        <div
          className="mb-4 font-bold text-primaryViolet cursor-pointer float-right"
          onClick={addRow}
        >
          {" "}
          + Add item
        </div>
      )}
      <table className="min-w-full border-collapse border border-[#D9D9D9]">
        <thead>
          <tr className="bg-[#F2F4F7]">
            <th className="border border-[#D9D9D9] px-2 py-1 text-left">
              Name
            </th>
            <th className="border border-[#D9D9D9] px-2 py-1 text-left">
              Quanity
            </th>
            <th className="border border-[#D9D9D9] px-2 py-1 text-left">
              Amount
            </th>
            <th className="border border-[#D9D9D9] px-2 py-1 text-left">
              Total
            </th>
            {isEditable && (
              <th className="border border-[#D9D9D9] px-2 py-1 text-left">
                Remove
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="odd:bg-white even:bg-[#F2F4F7]">
              <td className="border border-[#D9D9D9] px-2 py-1">
                <input
                  type="text"
                  className="w-full bg-inherit border-none outline-none rounded px-2 py-1"
                  value={row.name}
                  onChange={(e) =>
                    handleInputChange(index, "name", e.target.value)
                  }
                  disabled={!isEditable}
                />
              </td>
              <td className="border border-[#D9D9D9] px-2 py-1">
                <input
                  type="number"
                  className="w-full bg-inherit border-none outline-none rounded px-2 py-1"
                  value={row.quantity}
                  onChange={(e) =>
                    handleInputChange(index, "quantity", e.target.value)
                  }
                  disabled={!isEditable}
                />
              </td>
              <td className="border border-[#D9D9D9] px-2 py-1">
                <input
                  type="number"
                  className="w-full bg-inherit border-none outline-none rounded px-2 py-1"
                  value={row.amount}
                  onChange={(e) =>
                    handleInputChange(index, "amount", e.target.value)
                  }
                  disabled={!isEditable}
                />
              </td>
              <td className="border border-[#D9D9D9] px-2 py-1">{row.total}</td>
              {isEditable && (
                <td className="border border-[#D9D9D9] px-2 py-1">
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => deleteRow(index)}
                    disabled={!isEditable}
                  >
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EditableTable;
