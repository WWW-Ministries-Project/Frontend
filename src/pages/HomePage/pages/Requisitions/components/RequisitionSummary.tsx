import PageHeader from "@/pages/HomePage/Components/PageHeader";

function RequisitionSummary() {

    const items = [
        {
            title:"Requisition id",
            value:"SC-23-0002"
        },
        {
            title:"Department",
            value:"Medium"
        },
        {
            title:"Program",
            value:"IT equipments"
        },
        {
            title:"Request date",
            value:"2024-01-01"
        },
        {
            title:"Total cost",
            value:"$4,500.00"
        },
        {
            title:"Status",
            value:"Awaiting payment"
        }
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
      </div>
    </aside>
  );
}

export default RequisitionSummary;
