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
  const [receiptData, setReceiptData] = React.useState<FinanceConfigValues[]>([]);
  const [selectedReceipt, setSelectedReceipt] = React.useState<FinanceConfigValues | null>(null);
  const { data, loading, refetch } = useFetch(api.fetch.fetchReceiptConfig);
  const { executeDelete, success } = useDelete(api.delete.deleteReceiptConfig);

  const closeModal = () => {
    setOpenModal(false);
    setSelectedReceipt(null);
  };

  React.useEffect(() => {
    if (Array.isArray(data?.data)) {
      setReceiptData(data.data as FinanceConfigValues[]);
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
        <div className="space-y-4">
            <PageHeader
                title={"Receipt"}
                buttonValue={"Create Receipt"}
                onClick={() => {
                  setSelectedReceipt(null);
                  setOpenModal(true);
                }}
            />

             {loading ? (
              <p className="rounded-lg bg-lightGray/30 px-4 py-6 text-sm text-primaryGray">
                Loading receipt configuration...
              </p>
             ) : receiptData.length === 0 ? (
              <p className="rounded-lg bg-lightGray/30 px-4 py-6 text-sm text-primaryGray">
                No receipt configuration found. Create one to get started.
              </p>
             ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {receiptData?.map((receipt:FinanceConfigValues) => (
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
             )}

            <Modal open={openModal} onClose={closeModal} className="max-w-2xl">
                <FinanceConfigForm 
                    onClose={closeModal}
                    onSubmit={closeModal}
                    type="receipt"
                    refetch={refetch}
                    initialData={selectedReceipt|| undefined}
                />
            </Modal>
     
        </div>
     );
}
 
export default Receipt;
