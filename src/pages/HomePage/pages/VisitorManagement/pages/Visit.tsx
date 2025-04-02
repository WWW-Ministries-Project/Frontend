import HeaderControls from "@/components/HeaderControls";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";

const Visits = () => {
    const visits= [
        {
          id: "1",
          date: "2023-04-02",
          eventName: "Sunday Morning Service",
          eventType: "service",
        },
        {
          id: "2",
          date: "2023-04-09",
          eventName: "Sunday Morning Service",
          eventType: "service",
        },
        {
          id: "3",
          date: "2023-04-16",
          eventName: "Community Outreach",
          eventType: "event",
        },
      ]

      const header = [
        { accessorKey: "date", header: "Date" },
        { accessorKey: "eventName", header: "Event Name" },
        { accessorKey: "eventType", header: "Event Type" },
      ]
    return ( 
        <div>
            <HeaderControls 
            title="Visitor History"
            subtitle="Record of all visits to services and events"
            showSubtitle={true}
            />

            <div>
                <TableComponent 
                    data={visits} 
                    columns={header} 
                />
            </div>
        </div>
     );
}
 
export default Visits;