import { RequisitionStatusType } from "../pages/Requisitions/types/requestInterface"

export const getStatusColor = (status:RequisitionStatusType) => {
    if(status==="Draft") return "bg-[#EDEFF5] text-sm h-6 w-fit p-2 flex items-center justify-center rounded-lg  text-lighterBlack"
    if(status === "Awaiting_HOD_Approval" || status === "Pending signature"|| status === "Awaiting_Executive_Pastor_Approval") return "bg-[#FFEFD2] text-sm h-6 w-fit p-2 flex items-center justify-center rounded-lg  text-[#996A13]"
    if(status === "APPROVED") return "bg-[#D2F4EA] text-sm h-6 w-fit p-2 flex items-center justify-center rounded-lg  text-[#039855]"
    if(status === "REJECTED") return "bg-[#F9DADA] text-sm h-6 w-fit p-2 flex items-center justify-center rounded-lg  text-[#D14343]"
}

export const getFillColor = (status:string)=>{
    if(status==="Draft") return "#575570"
    if(status === "Awaiting_HOD_Approval" || status === "Pending signature") return "#996A13"
    if(status === "APPROVED") return "#039855"
    if(status === "REJECTED") return "#D14343" 
}