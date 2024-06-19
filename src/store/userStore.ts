import { create } from 'zustand';
import { UserType as memberType } from '@/pages/HomePage/pages/Members/utils/membersInterfaces';
// import { persist } from 'zustand/middleware';
type userType = {
    name:string
    email:string
    selectedMember:memberType
}
type Action = {
    setName:(name:string)=>void
    setEmail:(email:string)=>void
    setSelectedMember:(selectedMember:memberType)=>void
}

export const useUserStore = create<userType & Action>((set)=>({
name:"",
email:"",
selectedMember:{email:"",name:"",primary_number:""},


setName:(name:string)=>set({name}),
setEmail:(email:string)=>set({email}),
setSelectedMember:(selectedMember:memberType)=>set({selectedMember}),
}));