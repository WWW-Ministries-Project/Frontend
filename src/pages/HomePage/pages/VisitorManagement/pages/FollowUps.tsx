import HeaderControls from "@/components/HeaderControls";
import Modal from "@/components/Modal";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { ApiDeletionCalls } from "@/utils/apiDelete";
import { ApiCalls } from "@/utils/apiFetch";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FollowUpForm from "../Components/FollowUpForm";

interface FollowUpsProps {
  visitorId: number | string;
  followUps: Array<{
    id: string;
    date: string;
    type: string;
    status: string;
    notes: string;
    assignedTo: string;
  }>;
}

const FollowUps: React.FC<FollowUpsProps> = ({ visitorId, followUps }) => {
  const navigate = useNavigate();
    const [selectedId, setSelectedId] = useState<number | string>(""); // Track selected row for actions
    const [isModalOpen, setIsModalOpen] = useState(false); // Track modal open state
    const [loading, setLoading] = useState(true); // Track loading state
    const [error, setError] = useState<string | null>(null); // Error state
    interface FollowUp {
      id: string;
      date: string;
      type: string;
      status: string;
      notes: string;
      assignedTo: string;
    }

    const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | undefined>(undefined); // Store selected visit for editing
    const apiCalls = new ApiCalls();
    const apiDelete = new ApiDeletionCalls();
  
    // Function to toggle the options menu for each row
    const handleShowOptions = (id: number | string) => {
      setSelectedId((prevSelectedId) => (prevSelectedId === id ? "" : id));
    };
  
    // Function to delete a visit
    const deleteVisit = async (id: number) => {
      try {
        setLoading(true);
        const response = await apiDelete.deleteVisit(id); // Assuming deleteVisit API method
        if (response.status === 200) {
          // Remove the deleted visit from the list
          // setVisits((prevVisits) => prevVisits.filter((visit) => visit.id !== id.toString()));
          console.log("Visit deleted successfully");
        } else {
          setError("Error deleting visit.");
        }
      } catch (error) {
        console.error("Error deleting visit", error);
        setError("An error occurred while deleting the visit.");
      } finally {
        setLoading(false);
      }
    };
    const mockFollowUps = [
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
            btnName="Add Follow-up"
        handleNavigation={() => setIsModalOpen(true)}
            />

            <div>
                <TableComponent 
                    data={followUps} 
                    columns={header} 
                />
            </div>
            <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <FollowUpForm
          visitorId={visitorId}
          onClose={() => setIsModalOpen(false)}
          initialData={selectedFollowUp} // Pass the selected visit data for editing
        />
      </Modal>
        </div>
     );
}
 
export default FollowUps;