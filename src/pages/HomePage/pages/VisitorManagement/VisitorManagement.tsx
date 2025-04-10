import HeaderControls from "@/components/HeaderControls";
import Modal from "@/components/Modal";
import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { api } from "@/utils/api/apiCalls";
import { formatTime } from "@/utils/helperFunctions";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageOutline from "../../Components/PageOutline";
import ActionButton from "../../Components/reusable/ActionButton";
import TableComponent from "../../Components/reusable/TableComponent";
import SkeletonLoader from "../../Components/TableSkeleton";
import { showNotification } from "../../utils";
import { IVisitorForm, VisitorForm } from "./Components/VisitorForm";

interface Visitor {
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
}

export function VisitorManagement  () {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<number | string>("");
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<
    IVisitorForm | undefined
  >(undefined);
  //  const apiCalls = new ApiCalls();
  const { data, loading } = useFetch(api.fetch.fetchAllVisitors);
  const { executeDelete, success } = useDelete(api.delete.deleteVisitor);
  const { postData, loading: postLoading } = usePost(api.post.createVisitor);

  useEffect(() => {
    if (data && Array.isArray(data.data)) {
      setVisitors(data.data as Visitor[]);
    }
  }, [data]);
  useEffect(() => {
    if (success) {
      setVisitors((prevVisitors) =>
        prevVisitors.filter((visitor) => visitor.id !== selectedId.toString())
      );
      showNotification("Visitor deleted successfully", "success");
    }
  }, [success]);

  const handleShowOptions = (id: number | string) => {
    setSelectedId((prevSelectedId) => (prevSelectedId === id ? "" : id));
  };
  const handleSubmit = (visitor: IVisitorForm) => {
    console.log(visitor, "aha");
    postData(visitor);
  };

  //TODO: ask JOJO why this is here
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
  ];
  const deleteVisitor = async (visitorId: number) => {
    executeDelete(visitorId);
  };

  const headings = [
    {
      accessorKey: "firstName",
      header: "Full Name",
      cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
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
      cell: ({ row }) => formatTime(row.original.visitDate),
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
      cell: ({ row }: { row: { original: (typeof visitors)[number] } }) => (
        <div onClick={() => handleShowOptions(row.original.id)}>
          <ActionButton
            showOptions={row.original.id == selectedId}
            hideDelete={false}
            onView={() => {
              navigate(`visitor/${row.original.id}`);
            }}
            onEdit={() => {
              setSelectedVisitor(row.original);
              setIsModalOpen(true);
            }}
            onDelete={() => {
              deleteVisitor(Number(row.original.id));
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <PageOutline>
      {/* {showFeedback && (
          <AlertComp
            message={feedback}
            type={"success"}
            onClose={() => setShowFeedback(false)}
          />
        )} */}
      {loading ? (
        <div className="space-y-4">
          <div className="animate-pulse space-y-2  w-[40rem] ">
            <div className="h-8 bg-lightGray rounded w-2/6"></div>
            <div className="h-6 bg-lightGray rounded w-4/6"></div>
          </div>
          <SkeletonLoader />
        </div>
      ) : (
        <div className="space-y-8">
          <HeaderControls
            title="Visitor Management"
            showSubtitle={true}
            subtitle="Register, track, and analyze visitor information"
            btnName="Register visitor"
            handleNavigation={() => setIsModalOpen(true)}
          />

          <div>
            <TableComponent data={visitors} columns={headings} />
          </div>
        </div>
      )}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <VisitorForm
          onClose={() => setIsModalOpen(false)}
          selectedVisitor={selectedVisitor}
          onSubmit={handleSubmit}
          loading={postLoading}
        />
      </Modal>
    </PageOutline>
  );
};
