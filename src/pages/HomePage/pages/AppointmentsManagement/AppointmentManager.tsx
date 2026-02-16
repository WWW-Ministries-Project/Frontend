import { HeaderControls } from "@/components/HeaderControls";
import PageOutline from "../../Components/PageOutline";
import { useState } from "react";
import { Appointment } from "@/utils/api/appointment/interfaces";
import AllAppointmentsLayout from "./Layout/AllAppointmentsLayout";
import { dummyAppointments } from "@/pages/MembersPage/Pages/MyAppointments";
import { Modal } from "@/components/Modal";
import AppointmentBookingForm from "@/pages/MembersPage/Component/AppointmentBookingForm";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils/api/apiCalls";

const AppointmentManager = () => {
  const { data: appointmentData, refetch, loading } = useFetch(
        api.fetch.fetchAppointment
      );
    const [isModalOpen, setIsModalOpen] = useState(false);
      const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>(undefined);
    
      const handleBookAppointment = () => {
        setSelectedAppointment(undefined); // create mode
        setIsModalOpen(true);
      };
    return ( 
        <PageOutline className="p-6">
            <HeaderControls
                title="Appointment Manager"
                subtitle="Manage all appointments scheduled within the system"
                btnName="Add Appointment"
                screenWidth={typeof window !== "undefined" ? window.innerWidth : 0}
                handleClick={handleBookAppointment}

            />
            <div>
                {/* Appointment list and management components go here */}
                <AllAppointmentsLayout 
                 Appointments={{ all: appointmentData?.data || [] }}
          onEdit={(appt) => {
            setSelectedAppointment(appt);
            setIsModalOpen(true);
          }}
          onDelete={(appt) => {
            void appt;
          }}
                />
            </div>

            <Modal
        open={isModalOpen}
        className="max-w-4xl"
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAppointment(undefined);
        }}
      >
        <AppointmentBookingForm
          appointment={selectedAppointment}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAppointment(undefined);
          }}
        />
      </Modal>
        </PageOutline>
     );
}
 
export default AppointmentManager;
