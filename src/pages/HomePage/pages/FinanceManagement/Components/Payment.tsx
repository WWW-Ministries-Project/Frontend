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
    const [paymentData, setPaymentData] = React.useState([]);
      const [selectedPayment, setSelectedPayment] = React.useState(null);
      const { data, loading, refetch } = useFetch(api.fetch.fetchPaymentConfig);
      const { executeDelete, success } = useDelete(api.delete.deletePaymentConfig);
      
    
    
      React.useEffect(() => {
        if (data?.data) {
          setPaymentData(data?.data);
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
        <div>
            <PageHeader
                className="font-semibold text-xl"
                title={"Payment"}
                buttonValue={"Create payment"}
                onClick={() => {
                  setOpenModal(true);
                //   setDisplayForm(!displayForm);
                //   setInputValue({ created_by: userId, name: "", description: "" });
                }}
            />

             <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
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

            <Modal open={openModal}  onClose={() => {setOpenModal(false)}}>
                <FinanceConfigForm 
                    onClose={() => {setOpenModal(false)}}
                    onSubmit={() => {setOpenModal(false)}}
                    type="payment"
                    refetch={refetch}
                    initialData={selectedPayment? selectedPayment : undefined}
                />
            </Modal>
     
        </div>
     );
}
 
export default Payment;