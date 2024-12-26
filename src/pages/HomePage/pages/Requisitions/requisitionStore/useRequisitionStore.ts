import { Requisition, RequisitionStore } from "../types/requestInterface";


const requisitionSlice = (set:any):RequisitionStore => ({
  requests: [],

  removeRequest: (id: string) =>
    set((state: { requests: Requisition[] }) => ({
      requests: state.requests.filter(
        (request) => request.requisition_id !== id
      ),
    })),

  setRequests: (requests: Requisition[]) =>
    set(() => ({
      requests,
    })),
});


export default requisitionSlice;
