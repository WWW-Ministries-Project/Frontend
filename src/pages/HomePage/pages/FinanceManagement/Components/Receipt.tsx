import { Button } from "@/components";
import { Modal } from "@/components/Modal";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import React, { useEffect } from "react";
import FinanceConfigForm, { FinanceConfigValues } from "./FinanceConfigForm";
import { useDelete } from "@/CustomHooks/useDelete";
import { api } from "@/utils";
import { useFetch } from "@/CustomHooks/useFetch";
import ConfigCard from "./ConfigCard";
import { showDeleteDialog, showNotification } from "@/pages/HomePage/utils";

const Receipt = () => {
  const [openModal, setOpenModal] = React.useState(false);
  const [receiptData, setReceiptData] = React.useState([]);
  const [selectedReceipt, setSelectedReceipt] = React.useState(null);
  const { data, loading, refetch } = useFetch(api.fetch.fetchReceiptConfig);
  const { executeDelete, success } = useDelete(api.delete.deleteReceiptConfig);
  


  React.useEffect(() => {
    if (data?.data) {
      setReceiptData(data?.data);
    }
  }, [data]);

  const handleEditReceipt = (receipt:FinanceConfigValues) => {
    setSelectedReceipt(receipt );
    setOpenModal(true);
  };

  const deleteReceipt = async (id: string | number) => {
    executeDelete({ id: String(id) });
  };

  useEffect(() => {
          if (success) {
            refetch();
            showNotification("Receipt record deleted successfully", "success");
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [success]);


  
    return ( 
        <div>
            <PageHeader
                className="font-semibold text-xl"
                title={"Receipt"}
                buttonValue={"Create Receipt"}
                onClick={() => {
                  setOpenModal(true);
                //   setDisplayForm(!displayForm);
                //   setInputValue({ created_by: userId, name: "", description: "" });
                }}
            />

             <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {
                receiptData?.map((receipt:FinanceConfigValues) => (
                 
                    <ConfigCard
                        key={receipt?.id}
                        configData={receipt}
                        onEdit={() => handleEditReceipt(receipt)}
                        onDelete={() => {
                                              if (receipt.id !== undefined) {
                                                showDeleteDialog(
                                                  {
                                                    name: receipt.name ?? "receipt",
                                                    id: receipt.id,
                                                  },
                                                  deleteReceipt
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
                    type="receipt"
                    refetch={refetch}
                    initialData={selectedReceipt|| undefined}
                />
            </Modal>
     
        </div>
     );
}
 
export default Receipt;