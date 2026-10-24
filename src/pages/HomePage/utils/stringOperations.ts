import { RequisitionStatusType } from "../pages/Requisitions/types/requestInterface"

export const getStatusColor = (status:RequisitionStatusType) => {
    if(status==="Draft") return "bg-gray-100 text-sm h-6 w-fit p-2 flex items-center justify-center rounded-lg  text-lighterBlack"
    if(status === "Awaiting_HOD_Approval" || status === "Pending signature"|| status === "Awaiting_Executive_Pastor_Approval") return "bg-amber-100 text-sm h-6 w-fit p-2 flex items-center justify-center rounded-lg  text-amber-800"
    if(status === "APPROVED") return "bg-emerald-100 text-sm h-6 w-fit p-2 flex items-center justify-center rounded-lg  text-emerald-700"
    if(status === "REJECTED") return "bg-red-100 text-sm h-6 w-fit p-2 flex items-center justify-center rounded-lg  text-red-600"
}

export const getFillColor = (status:string)=>{
    if(status==="Draft") return "rgb(var(--color-lighterBlack))"
    if(status === "Awaiting_HOD_Approval" || status === "Pending signature") return "#996A13"
    if(status === "APPROVED") return "#039855"
    if(status === "REJECTED") return "#D14343" 
}