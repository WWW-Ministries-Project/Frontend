import React, { useState } from "react";

interface TableRow {
  name: string;
  days: number;
  amount: number;
  total: number;
}

interface EditableTableProps {
  isEditable?: boolean;
}
const EditableTable: React.FC<EditableTableProps> = ({isEditable=true}) => {
  const [rows, setRows] = useState<TableRow[]>([
    { name: "Item 1", days: 1, amount: 100, total: 100 },
    { name: "Item 2", days: 2, amount: 200, total: 400 },
  ]);

  const handleInputChange = (
    index: number,
    field: keyof TableRow,
    value: string
  ) => {
    const updatedRows = [...rows];
    const parsedValue =
      field === "days" || field === "amount" ? parseFloat(value) || 0 : value;

    if (typeof parsedValue === "string") {
      // @ts-ignore
      updatedRows[index][field] = parsedValue;
    } else {
      // @ts-ignore
      updatedRows[index][field] = parsedValue as number;
      updatedRows[index].total =
        updatedRows[index].days * updatedRows[index].amount;
    }

    setRows(updatedRows);
  };

  const addRow = () => {
    setRows([...rows, { name: "", days: 0, amount: 0, total: 0 }]);
  };

  const deleteRow = (index: number) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    setRows(updatedRows);
  };

  return (
    <div className="p-4">
     { isEditable && <div
        className="mb-4 font-bold text-primaryViolet cursor-pointer float-right"
        onClick={addRow}
      >
        {" "}
        + Add item
      </div>}
      <table className="min-w-full border-collapse border border-[#D9D9D9]">
        <thead>
          <tr className="bg-[#F2F4F7]">
            <th className="border border-[#D9D9D9] px-2 py-1 text-left">
              Name
            </th>
            <th className="border border-[#D9D9D9] px-2 py-1 text-left">
              Days
            </th>
            <th className="border border-[#D9D9D9] px-2 py-1 text-left">
              Amount
            </th>
            <th className="border border-[#D9D9D9] px-2 py-1 text-left">
              Total
            </th>
           {isEditable && <th className="border border-[#D9D9D9] px-2 py-1 text-left">
              Remove
            </th>}
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
                  value={row.days}
                  onChange={(e) =>
                    handleInputChange(index, "days", e.target.value)
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
              {isEditable && <td className="border border-[#D9D9D9] px-2 py-1">
                <button
                  className="text-red-500 hover:text-red-700"
                  onClick={() => deleteRow(index)}
                  disabled={!isEditable}
                >
                  Delete
                </button>
              </td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EditableTable;
