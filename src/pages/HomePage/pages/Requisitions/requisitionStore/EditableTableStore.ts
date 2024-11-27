// src/store/useEditableTableStore.ts
import {create} from 'zustand';

interface TableRow {
  name: string;
  quantity: number;
  amount: number;
  total: number;
  id:string | number
}

interface EditableTableStore {
  rows: TableRow[];
  addRow: () => void;
  deleteRow: (index: number) => void;
  updateRow: (index: number, field: keyof TableRow, value: string) => void;
  setInitialRows: (data: TableRow[]) => void; // New method to set initial rows
}

const useEditableTableStore = create<EditableTableStore>((set) => ({
  rows: [],
  addRow: () => set((state) => ({
    rows: [...state.rows, { name: `item ${state.rows?.length+1}`, quantity: 5, amount: 1, total: 5,id:state.rows?.length+1 }],
  })),
  deleteRow: (index) => set((state) => ({
    rows: state.rows.filter((_, i) => i !== index),
  })),
  updateRow: (index, field, value) => set((state) => {
    const updatedRows = [...state.rows];
    const parsedValue = field === "quantity" || field === "amount" ? parseFloat(value) || 0 : value;

    if (typeof parsedValue === "string") {
      // @ts-ignore
      updatedRows[index][field] = parsedValue;
    } else {
      // @ts-ignore
      updatedRows[index][field] = parsedValue;
      updatedRows[index].total = updatedRows[index].quantity * updatedRows[index].amount;
    }

    return { rows: updatedRows };
  }),
  setInitialRows: (data) => set({ rows: data }), // Set initial rows from data
}));

export default useEditableTableStore;