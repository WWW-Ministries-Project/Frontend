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
        <div>
            <PageHeader
                className="font-semibold text-xl"
                title={"Bank Account"}
                buttonValue={"Create bank account"}
                onClick={() => {
                  setOpenModal(true);
                //   setDisplayForm(!displayForm);
                //   setInputValue({ created_by: userId, name: "", description: "" });
                }}
            />

             <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
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

            <Modal open={openModal}  onClose={() => {setOpenModal(false)}}>
                <FinanceConfigForm 
                    onClose={() => {setOpenModal(false)}}
                    onSubmit={() => {setOpenModal(false)}}
                    type="bankAccount"
                    refetch={refetch}
                    initialData={selectedBankAccount|| undefined}
                />
            </Modal>
     
        </div>
     );
}
 
export default BankAccount;
