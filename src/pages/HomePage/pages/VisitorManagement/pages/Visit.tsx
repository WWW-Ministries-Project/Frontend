import HeaderControls from "@/components/HeaderControls";
import Modal from "@/components/Modal";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { ApiDeletionCalls } from "@/utils/apiDelete";
import { ApiCalls } from "@/utils/apiFetch";
import { useState, useEffect } from "react";
import VisitForm from "../Components/VisitForm";
import ActionButton from "@/pages/HomePage/Components/reusable/ActionButton";
import { useNavigate } from "react-router-dom";

interface Visit {
  id: string;
  date: string;
  eventName: string;
  eventType: string;
}

const Visits = ({ visitorId, visits, fetchVisitorData }: { visitorId: string; visits: Visit[]; fetchVisitorData: () => void }) => {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<number | string>(""); // Track selected row for actions
  const [isModalOpen, setIsModalOpen] = useState(false); // Track modal open state
  const [loading, setLoading] = useState(true); // Track loading state
  const [error, setError] = useState<string | null>(null); // Error state
  const [selectedVisit, setSelectedVisit] = useState<Visit | undefined>(undefined); // Store selected visit for editing
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
      fetchVisitorData()
    }
  };

  // // Function to fetch visits data from the backend
  // const fetchVisits = async () => {
  //   try {
  //     const response = await apiCalls.fetchAllVisitsByVisitorId(visitorId); // Assuming fetchVisits API method
  //     if (response?.data) {
  //       setVisits(response.data); // Update visits state with fetched data
  //     } else {
  //       setError("No visits found.");
  //     }
  //   } catch (err) {
  //     setError("Error fetching visits data.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // // Fetch visits on component mount
  // useEffect(() => {
  //   if(visitorId) fetchVisits(); // Fetch visit data when component loads
  // }, [visitorId]); // Empty dependency array means this will run once on component mount

  // Table columns configuration
  const header = [
    { accessorKey: "date", header: "Date" },
    { accessorKey: "eventName", header: "Event Name" },
    { accessorKey: "eventType", header: "Event Type" },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }: { row: { original: typeof visits[number] } }) => (
        <div onClick={() => handleShowOptions(row.original.id)}>
          <ActionButton
            showOptions={row.original.id == selectedId}
            hideDelete={true}
            onView={() => {
              navigate(`/visitor/${row.original.id}`);
            }}
            onEdit={() => {
              // Set the selected visit for editing
              setSelectedVisit(row.original);
              setIsModalOpen(true);
            }}
            onDelete={() => deleteVisit(Number(row.original.id))}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <HeaderControls
        title="Visitor History"
        subtitle="Record of all visits to services and events"
        showSubtitle={true}
        btnName="Record Visit"
        handleNavigation={() => setIsModalOpen(true)}
      />

      <div>
        <TableComponent data={visits} columns={header} />
      </div>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <VisitForm
          visitorId={visitorId || ""}
          onClose={() => setIsModalOpen(false)}
          initialData={selectedVisit} // Pass the selected visit data for editing
          fetchVisitorData={fetchVisitorData}
        />
      </Modal>
    </div>
  );
};

export default Visits;
