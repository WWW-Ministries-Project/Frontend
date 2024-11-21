import PageHeader from "@/pages/HomePage/Components/PageHeader";
import { IRequestSummary } from "../types/requestInterface";
import { getStatusColor } from "@/pages/HomePage/utils/stringOperations";
import { DateTime } from "luxon";
import StatusPill from "@/components/StatusPill";


function RequisitionSummary({summary, currency}:{summary:IRequestSummary | undefined, currency:string | undefined}) {

    const items = [
        {
            title:"Requisition id",
            value:summary?.requisition_id
        },
        {
            title:"Department",
            value:summary?.department
        },
        {
            title:"Program",
            value:summary?.program
        },
        {
            title:"Request date",
            value:       DateTime.fromISO( summary?.request_date as string).toFormat("dd/MM/yyyy"),
           
        },
        {
            title:"Total cost",
            value:`${currency} ${summary?.total_cost}`
        },
        
    ]
  return (
    <aside className="border rounded-lg p-3 h-fit border-[#D9D9D9]">
      <div className="font-bold"> 
        <PageHeader title="Requisition Summary"/>
      </div>
      <div className="flex flex-col gap-3"> 
        {items.map((item)=>(
            <div key={item.title} className="flex  whitespace-nowrap gap-3 text-left">
                <span className="font-bold ">{item.title}:</span>
                <span className="text-left font-normal text-mainGray">{item.value}</span>
            </div>
        ))}
        <div  className="flex items-center  whitespace-nowrap gap-3 text-left">
                <span className="font-bold ">Status</span>
                <StatusPill text={summary?.status as string}/>
            </div>
      </div>
    </aside>
  );
}

export default RequisitionSummary;
