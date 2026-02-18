import { useEffect, useState } from "react";
import { HeaderControls } from "@/components/HeaderControls";
import PageOutline from "../../Components/PageOutline";
import AnnualThemeCard from "./Components/AnnualThemeCard";
import { Modal } from "@/components/Modal";
import AnnualThemeForm from "./Components/AnnualThemeForm";
import { api } from "@/utils/api/apiCalls";
import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import { showDeleteDialog, showNotification } from "../../utils";


const AnnualThemeManager = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState<any | null>(null);
    const [themes, setThemes] = useState<any[]>();

      const { data, loading, refetch } = useFetch(api.fetch.fetchAnnualTheme);
      const { executeDelete, success } = useDelete(api.delete.deleteAnnualTheme);

    const handleEditTheme = (theme: any) => {
      setSelectedTheme(theme);
      setIsFormOpen(true);
    };


    useEffect(() => {
        if (data && data.data && Array.isArray(data.data)) {
          setThemes(data.data);
        }
      }, [data]);
    
      useEffect(() => {
        if (success) {
          refetch();
          showNotification("Attendance record deleted successfully", "success");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [success]);

      const deletetheme = async (themeId: string | number) => {
    executeDelete({ id: String(themeId) });
  };

    return ( 
        <PageOutline>
            <HeaderControls
                    title="Theme Manager"
                    subtitle="Manage annual themes for church communication"
                    btnName="New Theme"
                    hasFilter
                    hasSearch={false}
                    // showFilter={showFilter}
                    // setShowFilter={setShowFilter}
                    screenWidth={window.innerWidth}
                    handleClick={() => {
                      setSelectedTheme(null);
                      setIsFormOpen(true);
                    }}
                  />

            <div>
        {(themes as any[] || []).map((theme) => (
            <AnnualThemeCard
              key={theme.id}
              theme={theme}
              onEdit={() => handleEditTheme(theme)}
              // onDelete={() => handleDeleteTheme(theme.id)}
              onDelete={() => {
                      if (theme.id !== undefined) {
                        showDeleteDialog(
                          {
                            name: theme.title ?? "Theme",
                            id: theme.id,
                          },
                          deletetheme
                        );
                      }
                    }}
            />
        ))}
            </div>


            <Modal
              open={isFormOpen}
              onClose={() => {
                setIsFormOpen(false);
                setSelectedTheme(null);
              }}
            >
              <AnnualThemeForm
                initialValues={selectedTheme ?? undefined}
                onClose={() => setIsFormOpen(false)}
                refetch={refetch}
              />
                
            </Modal>

        </PageOutline>
     );
}
 
export default AnnualThemeManager;