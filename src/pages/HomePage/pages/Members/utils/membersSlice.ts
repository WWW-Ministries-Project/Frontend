import { StateCreator } from 'zustand';
import { StoreState, UserType, MemberSlice } from './membersInterfaces';

// const createMemberSlice: StateCreator<StoreState, [], [], MemberSlice> = (set) => ({
    const createMemberSlice = (set: any, get: any): MemberSlice => ({
  members: [],
  addMember: (member) => {
    set((state: any) => ({
      members: [...state.members, member],
    }));
    get().setMembersOptions();
  },
  removeMember: (memberId) => {
    set((state: any) => ({
      members: state.members.filter((pos: UserType) => pos.id !== memberId),
    }));
    get().setMembersOptions();
  },
  updateMember: (updatedMember) => {
    set((state: any) => ({
      members: state.members.map((pos: UserType) =>
        pos.id === updatedMember.id ? updatedMember : pos
      ),
    }));
    get().setMembersOptions();
  },
  setMembers: (members) => {
    set({ members });
    get().setMembersOptions();
  },
});

export default createMemberSlice;
