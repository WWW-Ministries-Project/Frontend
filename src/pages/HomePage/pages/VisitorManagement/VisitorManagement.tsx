import HeaderControls from "@/components/HeaderControls";
import PageOutline from "../../Components/PageOutline";
import TableComponent from "../../Components/reusable/TableComponent";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ActionButton from "../../Components/reusable/ActionButton";

const VisitorManagement = () => {
      const navigate = useNavigate();
      const [selectedId, setSelectedId] = useState<number | string>("");
    
      const handleShowOptions = (id: number | string) => {
        setSelectedId((prevSelectedId) => (prevSelectedId === id ? "" : id));
      };
    const visitors = [
        {
          id: "1",
          firstName: "John",
          lastName: "Smith",
          email: "john.smith@example.com",
          phone: "(555) 123-4567",
          visitDate: "2023-04-02",
          eventName: "Sunday Morning Service",
          howHeard: "friend",
          followUpStatus: "pending",
          visits: 1,
        },
        {
          id: "2",
          firstName: "Maria",
          lastName: "Garcia",
          email: "maria.garcia@example.com",
          phone: "(555) 987-6543",
          visitDate: "2023-04-02",
          eventName: "Sunday Morning Service",
          howHeard: "website",
          followUpStatus: "completed",
          visits: 3,
        },
        {
          id: "3",
          firstName: "David",
          lastName: "Johnson",
          email: "david.johnson@example.com",
          phone: "(555) 456-7890",
          visitDate: "2023-04-05",
          eventName: "Wednesday Bible Study",
          howHeard: "social",
          followUpStatus: "pending",
          visits: 2,
        },
        {
          id: "4",
          firstName: "Sarah",
          lastName: "Williams",
          email: "sarah.williams@example.com",
          phone: "(555) 789-0123",
          visitDate: "2023-04-07",
          eventName: "Community Outreach",
          howHeard: "friend",
          followUpStatus: "not-started",
          visits: 1,
        },
        {
          id: "5",
          firstName: "Michael",
          lastName: "Brown",
          email: "michael.brown@example.com",
          phone: "(555) 234-5678",
          visitDate: "2023-04-09",
          eventName: "Sunday Morning Service",
          howHeard: "drive-by",
          followUpStatus: "completed",
          visits: 4,
        },
      ]
      const headings = [
        {
          accessorKey: "firstName",
          header: "First Name",
        },
        {
          accessorKey: "lastName",
          header: "Last Name",
        },
        {
          accessorKey: "email",
          header: "Email",
        },
        {
          accessorKey: "phone",
          header: "Phone",
        },
        {
          accessorKey: "visitDate",
          header: "Visit Date",
        },
        {
          accessorKey: "eventName",
          header: "Event Name",
        },
        {
          accessorKey: "howHeard",
          header: "How Heard",
        },
        {
          accessorKey: "followUpStatus",
          header: "Follow-Up Status",
        },
        {
          accessorKey: "visits",
          header: "Visits",
        },
        {
            header: "Actions",
            accessorKey: "actions",
            cell: ({ row }: { row: { original: typeof visitors[number] } }) => (
              <div onClick={() => handleShowOptions(row.original.id)}>
                <ActionButton
                  showOptions={row.original.id == selectedId}
                  hideDelete={true}
                  onView={() => {
                    navigate(`${row.original.id}`);;
                  }}
                  onEdit={() => {
                    navigate(`${row.original.id}`);
                  }}
                  onDelete={() => {}}
                />
              </div>
            ),
          },
      ];

    return ( 
        <div className="p-4">
            <PageOutline>
                <HeaderControls 
                title="Visitor Management"
                />
              
                <div>
                    <TableComponent 
                        data={visitors} 
                        columns={headings} 
                    />
                </div>
            </PageOutline>
        </div>
     );
}
 
export default VisitorManagement;