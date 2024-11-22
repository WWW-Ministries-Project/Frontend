import {create} from 'zustand';
import createMemberSlice from '@/pages/HomePage/pages/Members/utils/membersSlice';
import type { MemberSlice } from '@/pages/HomePage/pages/Members/utils/membersInterfaces';
import createEventSlice from '@/pages/HomePage/pages/EventsManagement/utils/eventsSlice';
import { EventSlice } from '@/pages/HomePage/pages/EventsManagement/utils/eventInterfaces';
import createAssetSlice from '@/pages/HomePage/pages/AssetsManagement/utils/AssetsSlice';
import { AssetSlice } from '@/pages/HomePage/pages/AssetsManagement/utils/assetsInterface';

type StoreState = MemberSlice & EventSlice & AssetSlice;

export const useStore = create<StoreState>((set, get) => ({
  ...createMemberSlice(set,get),
  ...createEventSlice(set,get),
  ...createAssetSlice(set,get)
}));

