import { Modal } from "@/components/Modal";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import React from "react";
import FinanceConfigForm, { FinanceConfigValues } from "./FinanceConfigForm";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import { useDelete } from "@/CustomHooks/useDelete";
import { showDeleteDialog, showNotification } from "@/pages/HomePage/utils";
import ConfigCard from "./ConfigCard";

const BankAccount = () => {
    const [openModal, setOpenModal] = React.useState(false);
    const [bankAccountData, setBankAccountData] = React.useState<FinanceConfigValues[]>([]);
      const [selectedBankAccount, setSelectedBankAccount] = React.useState<FinanceConfigValues | null>(null);
      const { data, loading, refetch } = useFetch(api.fetch.fetchBankAccountConfig);
      const { executeDelete, success } = useDelete(api.delete.deleteBankAccountConfig);
      const closeModal = () => {
        setOpenModal(false);
        setSelectedBankAccount(null);
      };

      React.useEffect(() => {
          if (Array.isArray(data?.data)) {
            setBankAccountData(data.data as FinanceConfigValues[]);
          }
        }, [data]);
      
        const handleEditBankAccount = (bankAccount:FinanceConfigValues) => {
          setSelectedBankAccount(bankAccount );
          setOpenModal(true);
        };
      
        const deleteBankAccount = async (id: string | number) => {
          executeDelete({ id: String(id) });
        };
      
        React.useEffect(() => {
                if (success) {
                  refetch();
                  showNotification("Bank Account record deleted successfully", "success");
                }
                // eslint-disable-next-line react-hooks/exhaustive-deps
              }, [success]);


    return (
        <div className="space-y-4">
            <PageHeader
                title={"Bank Account"}
                buttonValue={"Create bank account"}
                onClick={() => {
                  setSelectedBankAccount(null);
                  setOpenModal(true);
                }}
            />

             {loading ? (
              <p className="rounded-lg bg-lightGray/30 px-4 py-6 text-sm text-primaryGray">
                Loading bank account configuration...
              </p>
             ) : bankAccountData.length === 0 ? (
              <p className="rounded-lg bg-lightGray/30 px-4 py-6 text-sm text-primaryGray">
                No bank account configuration found. Create one to get started.
              </p>
             ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {
                bankAccountData?.map((bankAccount:FinanceConfigValues) => (
                 
                    <ConfigCard
                        key={bankAccount?.id}
                        configData={bankAccount}
                        onEdit={() => handleEditBankAccount(bankAccount)}
                        onDelete={() => {
                                              if (bankAccount.id !== undefined) {
                                                showDeleteDialog(
                                                  {
                                                    name: bankAccount.name ?? "bankAccount",
                                                    id: bankAccount.id,
                                                  },
                                                  deleteBankAccount
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
                    type="bankAccount"
                    refetch={refetch}
                    initialData={selectedBankAccount|| undefined}
                />
            </Modal>
     
        </div>
     );
}
 
export default BankAccount;
