// src/store/useEditableTableStore.ts
import { create } from "zustand";
import { Requisition } from "../types/requestInterface";

interface RequisitionStore {
  requests: Requisition[];
  removeRequest: (id: string) => void;
  setRequests: (requests: Requisition[]) => void;
}

const useRequisitions = create<RequisitionStore>((set) => ({
  requests: [],
  removeRequest: (id) =>
    set((state) => ({
      requests: state.requests.filter(
        (request) => request.requisition_id !== id
      ),
    })),
  setRequests: (requests) => set({ requests }),
}));

export default useRequisitions;
