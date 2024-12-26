import {create} from 'zustand';
import createMemberSlice from '@/pages/HomePage/pages/Members/utils/membersSlice';
import type { MemberSlice } from '@/pages/HomePage/pages/Members/utils/membersInterfaces';
import createEventSlice from '@/pages/HomePage/pages/EventsManagement/utils/eventsSlice';
import { EventSlice } from '@/pages/HomePage/pages/EventsManagement/utils/eventInterfaces';
// import createAssetSlice from '@/pages/HomePage/pages/AssetsManagement/utils/AssetsSlice';
// import { AssetSlice } from '@/pages/HomePage/pages/AssetsManagement/utils/assetsInterface';
import createEditableTableSlice from "@/pages/HomePage/pages/Requisitions/requisitionStore/editableTableSlice"
import { EditableTableStore, RequisitionStore } from '@/pages/HomePage/pages/Requisitions/types/requestInterface';
import createRequisitionSlice from "@/pages/HomePage/pages/Requisitions/requisitionStore/useRequisitionStore"

type StoreState = MemberSlice & EventSlice & EditableTableStore & RequisitionStore;

export const useStore = create<StoreState>((set, get) => ({
  ...createMemberSlice(set,get),
  ...createEventSlice(set,get),
  // ...createAssetSlice(set,get),
  ...createEditableTableSlice(set),
  ...createRequisitionSlice(set)
}));

