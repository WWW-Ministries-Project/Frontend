export const getStatusColor = (status: string) => {
    if(status === "Pending") return "bg-[#FFEFD2] text-sm w-fit p-2 flex items-center justify-center rounded-lg text-center text-[#996A13]"
    if(status === "Awaiting Approval") return "bg-neutralGray text-sm h-6 w-fit p-2 flex items-center justify-center rounded-lg text-center text-lighterBlack"
    if(status === "Approved") return "bg-[#D2F4EA] text-sm h-6 w-fit p-2 flex items-center justify-center rounded-lg text-center text-[#039855]"
    if(status === "Disapproved") return "bg-[#FFEFD2] text-sm h-6 w-fit p-2 flex items-center justify-center rounded-lg text-center text-[#996A13]"
    if(status==="Draft") return "bg-neutralGray text-sm h-6 w-fit p-2 flex items-center justify-center rounded-lg text-center text-lighterBlack"
}