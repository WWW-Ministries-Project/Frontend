import {create} from 'zustand';
import createMemberSlice from '@/pages/HomePage/pages/Members/utils/membersSlice';
import { MemberSlice } from '@/pages/HomePage/pages/Members/utils/membersInterfaces';

type StoreState = MemberSlice 

export const useStore = create<StoreState>((set, get) => ({
  ...createMemberSlice(set,get),
}));

