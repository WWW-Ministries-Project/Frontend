import HeaderControls from "@/components/HeaderControls";
import PageOutline from "../../Components/PageOutline";
import TableComponent from "../../Components/reusable/TableComponent";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ActionButton from "../../Components/reusable/ActionButton";
import { ApiCalls } from "@/utils/apiFetch";
import { ApiDeletionCalls } from "@/utils/apiDelete";
import AlertComp from "../../Components/reusable/AlertComponent";
import Modal from "@/components/Modal";
import VisitorForm from "./Components/VisitorForm";
import { formatInputDate, formatTime } from "@/utils/helperFunctions";
import SkeletonLoader from "../../Components/TableSkeleton";

interface Visitor  {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    visitDate: string;
    eventName: string;
    howHeard: string;
    followUpStatus: string;
    visitCount: number;
};

const VisitorManagement = () => {
    const navigate = useNavigate();
    const [selectedId, setSelectedId] = useState<number | string>("");
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [type, setType] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [selectedVisitor, setSelectedVisitor] = useState<Visitor | undefined>(undefined);
     const apiCalls = new ApiCalls();
      const apiDelete = new ApiDeletionCalls() 
    
    const handleShowOptions = (id: number | string) => {
        setSelectedId((prevSelectedId) => (prevSelectedId === id ? "" : id));
      };
    const visitors1 = [
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
    
        const fetchVisitors = async () => {
            try {
              const response = await apiCalls.fetchAllVisitors();
              if (response.data && Array.isArray(response.data.data)) {
                setVisitors(response.data.data as Visitor[]);
                
              } else {
                setError("Invalid data format received.");
              }
            } catch (err) {
              setError("An error occurred while fetching programs.");
            } finally {
              setLoading(false);
            }
          };
          const deleteVisitor = async (visitorId: number) => {
            try {
              setLoading(true);
              const response = await apiDelete.deleteVisitor(visitorId);
              if (response.status === 200) {
                setVisitors((prevVisitors) =>
                    prevVisitors.filter((visitor) => visitor.id !== visitorId.toString())
                );
                
                console.log("Program deleted successfully");
                setFeedback("Program deleted successfully")
                setType("success");
              } else {
                setError("Failed to delete the program.");
              }
            } catch (err) {
              setError("An error occurred while deleting the program.");
            } finally {
              setLoading(false);
              setShowFeedback(true);
              setInterval(() => {
                setShowFeedback(false);
              }, 5000);
            }
          };

         useEffect(() => {
             
         
            fetchVisitors();
           }, []); 

      const headings = [
        {
          accessorKey: "firstName",
          header: "Full Name",
          cell: ({ row }) => (`${row.original.firstName} ${row.original.lastName}`)
        },
        // {
        //   accessorKey: "lastName",
        //   header: "Last Name",
        // },
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
          cell: ({ row }) => formatTime(row.original.visitDate)
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
          accessorKey: "visitCount",
          header: "Visits",
        },
        {
            header: "Actions",
            accessorKey: "actions",
            cell: ({ row }: { row: { original: typeof visitors[number] } }) => (
              <div onClick={() => handleShowOptions(row.original.id)}>
                <ActionButton
                  showOptions={row.original.id == selectedId}
                  hideDelete={false}
                  onView={() => {
                    navigate(`visitor/${row.original.id}`);;
                  }}
                  onEdit={() => {
                    setSelectedVisitor(row.original);
              setIsModalOpen(true);
                  }}
                  onDelete={() => {deleteVisitor(Number(row.original.id))}}
                />
              </div>
            ),
          },
      ];

    return ( 
        <div className="p-4">
            <PageOutline>
            {showFeedback&&<AlertComp 
        message={feedback} 
        type={"success"} 
        onClose={() => setShowFeedback(false)} 
      />}
                {loading?
          <div className="space-y-4">
            <div className="animate-pulse space-y-2  w-[40rem] ">
            <div className="h-8 bg-lightGray rounded w-2/6"></div>
            <div className="h-6 bg-lightGray rounded w-4/6"></div>
            </div>
            <SkeletonLoader/>
          </div>
          :<div className="space-y-8">
                <HeaderControls 
                title="Visitor Management"
                showSubtitle={true}
                subtitle="Register, track, and analyze visitor information"
                btnName = "Register visitor"
                handleNavigation={() => setIsModalOpen(true)}
                />
              
                <div>
                    <TableComponent 
                        data={visitors} 
                        columns={headings} 
                    />
                </div>
                </div>}
            </PageOutline>
            <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <VisitorForm onClose={() => setIsModalOpen(false)} selectedVisitor={selectedVisitor} />
            </Modal>
        </div>
     );
}
 
export default VisitorManagement;