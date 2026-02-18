import { Modal } from "@/components/Modal";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import React from "react";
import FinanceConfigForm, { FinanceConfigValues } from "./FinanceConfigForm";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import { useDelete } from "@/CustomHooks/useDelete";
import { showDeleteDialog, showNotification } from "@/pages/HomePage/utils";
import ConfigCard from "./ConfigCard";

const TitheBreakdown = () => {
    const [openModal, setOpenModal] = React.useState(false);
    const [titheBreakdownData, setTitheBreakdownData] = React.useState<FinanceConfigValues[]>([]);
      const [selectedTitheBreakdown, setSelectedTitheBreakdown] = React.useState<FinanceConfigValues | null>(null);
      const { data, loading, refetch } = useFetch(api.fetch.fetchTitheBreakdownConfig);
      const { executeDelete, success } = useDelete(api.delete.deleteTitheBreakdownConfig);

      React.useEffect(() => {
          if (Array.isArray(data?.data)) {
            setTitheBreakdownData(data.data as FinanceConfigValues[]);
          }
        }, [data]);
      
        const handleEditTitheBreakdown = (titheBreakdown:FinanceConfigValues) => {
          setSelectedTitheBreakdown(titheBreakdown );
          setOpenModal(true);
        };
      
        const deleteTitheBreakdown = async (id: string | number) => {
          executeDelete({ id: String(id) });
        };
      
        React.useEffect(() => {
                if (success) {
                  refetch();
                  showNotification("Tithe Breakdown record deleted successfully", "success");
                }
                // eslint-disable-next-line react-hooks/exhaustive-deps
              }, [success]);


    return ( 
        <div>
            <PageHeader
                className="font-semibold text-xl"
                title={"Tithe Breakdown"}
                buttonValue={"Create tithe breakdown"}
                onClick={() => {
                  setOpenModal(true);
                //   setDisplayForm(!displayForm);
                //   setInputValue({ created_by: userId, name: "", description: "" });
                }}
            />

             <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {
                titheBreakdownData?.map((titheBreakdown:FinanceConfigValues) => (
                 
                    <ConfigCard
                        key={titheBreakdown?.id}
                        configData={titheBreakdown}
                        onEdit={() => handleEditTitheBreakdown(titheBreakdown)}
                        onDelete={() => {
                                              if (titheBreakdown.id !== undefined) {
                                                showDeleteDialog(
                                                  {
                                                    name: titheBreakdown.name ?? "titheBreakdown",
                                                    id: titheBreakdown.id,
                                                  },
                                                  deleteTitheBreakdown
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
                    type="tithe"
                    refetch={refetch}
                    initialData={selectedTitheBreakdown|| undefined}
                />
            </Modal>
     
        </div>
     );
}
 
export default TitheBreakdown;
