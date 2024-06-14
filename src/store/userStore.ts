import { create } from 'zustand';
// import { persist } from 'zustand/middleware';
type userType = {
    name:string
    email:string
}
type Action = {
    setName:(name:string)=>void
    setEmail:(email:string)=>void
}

export const useUserStore = create<userType & Action>((set)=>({
name:"",
email:"",

setName:(name:string)=>set({name}),
setEmail:(email:string)=>set({email}),

}));