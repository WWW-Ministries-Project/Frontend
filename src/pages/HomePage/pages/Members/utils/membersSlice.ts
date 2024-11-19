import { MemberSlice, UserType } from "./membersInterfaces";

const createMemberSlice = (set: any, get: any): MemberSlice => ({
  members: [],
  userStats: {
    total_members: 0,
    total_males: 0,
    total_females: 0,
    stats: {
      adults: { Male: 0, Female: 0, Total: 0 },
      children: { Male: 0, Female: 0, Total: 0 },
    },
  },
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
  setUserStats: (userStats) => {
    set({ userStats });
  },
});

export default createMemberSlice;
