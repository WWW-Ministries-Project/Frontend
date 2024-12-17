import { TableRow } from "../types/requestInterface";
import { EditableTableStore } from "../types/requestInterface";


const createEditableTableSlice = (set: any):EditableTableStore => ({
  rows: [],
  addRow: () =>
    set((state: EditableTableStore) => ({
      rows: [
        ...state.rows,
        {
          name: `item ${state.rows.length + 1}`,
          quantity: 5,
          amount: 1,
          total: 5,
          id: state.rows.length + 1,
        },
      ],
    })),
  deleteRow: (index: number) =>
    set((state: EditableTableStore) => ({
      rows: state.rows.filter((_, i) => i !== index),
    })),
  updateRow: (index: number, field: keyof TableRow, value: string) =>
    set((state: EditableTableStore) => {
      const updatedRows = [...state.rows];
      const parsedValue =
        field === "quantity" || field === "amount"
          ? parseFloat(value) || 0
          : value;

      if (typeof parsedValue === "string") {
        updatedRows[index][field] = parsedValue as never;
      } else {
        updatedRows[index][field] = parsedValue as never;
        updatedRows[index].total =
          updatedRows[index].quantity * updatedRows[index].amount;
      }

      return { rows: updatedRows };
    }),
  setInitialRows: (data: TableRow[]) => set({ rows: data }),
});

export default createEditableTableSlice;
