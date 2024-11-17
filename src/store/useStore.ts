import {create} from 'zustand';
import createMemberSlice from '@/pages/HomePage/pages/Members/utils/membersSlice';
import type { MemberSlice } from '@/pages/HomePage/pages/Members/utils/membersInterfaces';
import createEventSlice from '@/pages/HomePage/pages/EventsManagement/utils/eventsSlice';
import { EventSlice } from '@/pages/HomePage/pages/EventsManagement/utils/eventInterfaces';

type StoreState = MemberSlice & EventSlice;

export const useStore = create<StoreState>((set, get) => ({
  ...createMemberSlice(set,get),
  ...createEventSlice(set,get),
}));

