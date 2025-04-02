import HeaderControls from "@/components/HeaderControls";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";

const FollowUps = () => {
    const followUps= [
        {
          id: "1",
          date: "2023-04-04",
          type: "phone",
          status: "completed",
          notes: "Called to thank John for visiting. He expressed interest in the men's Bible study.",
          assignedTo: "Pastor Adam",
        },
        {
          id: "2",
          date: "2023-04-11",
          type: "email",
          status: "completed",
          notes: "Sent email with information about upcoming events and small groups.",
          assignedTo: "Sarah Johnson",
        },
        {
          id: "3",
          date: "2023-04-18",
          type: "in-person",
          status: "pending",
          notes: "Schedule coffee meeting to discuss membership process.",
          assignedTo: "Pastor Adam",
        },
      ]

      const header = [
        { accessorKey: "date", header: "Date" },
        { accessorKey: "type", header: "Type" },
        { accessorKey: "status", header: "Status" },
        { accessorKey: "notes", header: "Notes" },
        { accessorKey: "assignedTo", header: "Assigned To" },
      ]
    return ( 
        <div>
            <HeaderControls
            title="Follow-up History"
            subtitle="Record of all visits to services and events"
            showSubtitle={true}
            />

            <div>
                <TableComponent 
                    data={followUps} 
                    columns={header} 
                />
            </div>
        </div>
     );
}
 
export default FollowUps;