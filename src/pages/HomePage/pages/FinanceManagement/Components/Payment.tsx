import { Modal } from "@/components/Modal";
import FinanceConfigForm, { FinanceConfigValues } from "./FinanceConfigForm";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import React from "react";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import { useDelete } from "@/CustomHooks/useDelete";
import { showDeleteDialog, showNotification } from "@/pages/HomePage/utils";
import ConfigCard from "./ConfigCard";

const Payment = () => {
    const [openModal, setOpenModal] = React.useState(false);
    const [paymentData, setPaymentData] = React.useState<FinanceConfigValues[]>([]);
      const [selectedPayment, setSelectedPayment] = React.useState<FinanceConfigValues | null>(null);
      const { data, loading, refetch } = useFetch(api.fetch.fetchPaymentConfig);
      const { executeDelete, success } = useDelete(api.delete.deletePaymentConfig);
      const closeModal = () => {
        setOpenModal(false);
        setSelectedPayment(null);
      };
    
      React.useEffect(() => {
        if (Array.isArray(data?.data)) {
          setPaymentData(data.data as FinanceConfigValues[]);
        }
      }, [data]);
    
      const handleEditPayment = (payment: FinanceConfigValues) => {
        setSelectedPayment(payment);
        setOpenModal(true);
      };
    
      const deletePayment = async (id: string | number) => {
        executeDelete({ id: String(id) });
      };
    
      React.useEffect(() => {
              if (success) {
                refetch();
                showNotification("Payment record deleted successfully", "success");
              }
              // eslint-disable-next-line react-hooks/exhaustive-deps
            }, [success]);


    return (
        <div className="space-y-4">
            <PageHeader
                title={"Payment"}
                buttonValue={"Create payment"}
                onClick={() => {
                  setSelectedPayment(null);
                  setOpenModal(true);
                }}
            />

             {loading ? (
              <p className="rounded-lg bg-lightGray/30 px-4 py-6 text-sm text-primaryGray">
                Loading payment configuration...
              </p>
             ) : paymentData.length === 0 ? (
              <p className="rounded-lg bg-lightGray/30 px-4 py-6 text-sm text-primaryGray">
                No payment configuration found. Create one to get started.
              </p>
             ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {
                paymentData?.map((payment:FinanceConfigValues) => (
                 
                    <ConfigCard
                        key={payment?.id}
                        configData={payment}
                        onEdit={() => handleEditPayment(payment)}
                        onDelete={() => {
                                              if (payment.id !== undefined) {
                                                showDeleteDialog(
                                                  {
                                                    name: payment.name ?? "payment",
                                                    id: payment.id,
                                                  },
                                                  deletePayment
                                                );
                                              }
                                            }}
                    />
                    
                ))}
                </div>
             )}

            <Modal open={openModal} onClose={closeModal} className="max-w-2xl">
                <FinanceConfigForm 
                    onClose={closeModal}
                    onSubmit={closeModal}
                    type="payment"
                    refetch={refetch}
                    initialData={selectedPayment? selectedPayment : undefined}
                />
            </Modal>
     
        </div>
     );
}
 
export default Payment;
