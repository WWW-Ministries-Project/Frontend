import { EventSlice } from "@/pages/HomePage/pages/EventsManagement/utils/eventInterfaces";
import createEventSlice from "@/pages/HomePage/pages/EventsManagement/utils/eventsSlice";
import { createMemberSlice } from "@/pages/HomePage/pages/Members/store/membersSlice";
import type { MemberSlice } from "@/pages/HomePage/pages/Members/utils/membersInterfaces";
import { create } from "zustand";
import createEditableTableSlice from "@/pages/HomePage/pages/Requisitions/requisitionStore/editableTableSlice";
import createRequisitionSlice from "@/pages/HomePage/pages/Requisitions/requisitionStore/useRequisitionStore";
import {
  EditableTableStore,
  RequisitionStore,
} from "@/pages/HomePage/pages/Requisitions/types/requestInterface";
import createProductSlice from "@/pages/HomePage/pages/MarketPlace/utils/productsSlice";
import { type IProductSlice } from "@/utils";

type StoreState = MemberSlice &
  EventSlice &
  EditableTableStore &
  RequisitionStore &
  IProductSlice;
//TODO : check and remove unused 3rd argument
export const useStore = create<StoreState>((set, get, store) => ({
  ...createMemberSlice(set, get, store),
  ...createEventSlice(set, get),
  ...createEditableTableSlice(set),
  ...createRequisitionSlice(set),
  ...createProductSlice(set),
}));
