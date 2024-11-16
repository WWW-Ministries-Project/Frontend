import { StateCreator } from 'zustand';
import { StoreState, UserType, MemberSlice } from './membersInterfaces';

    const createMemberSlice = (set: any, get: any): MemberSlice => ({
  members: [],
  addMember: (member) => {
    set((state: any) => ({
      members: [...state.members, member],
    }));

  },
  removeMember: (memberId) => {
    set((state: any) => ({
      members: state.members.filter((pos: UserType) => pos.id !== memberId),
    }));

  },
  updateMember: (updatedMember) => {
    set((state: any) => ({
      members: state.members.map((pos: UserType) =>
        pos.id === updatedMember.id ? updatedMember : pos
      ),
    }));

  },
  setMembers: (members) => {
    set({ members });

  },
});

export default createMemberSlice;
