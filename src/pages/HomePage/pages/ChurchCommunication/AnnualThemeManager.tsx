import { useEffect, useState } from "react";
import { HeaderControls } from "@/components/HeaderControls";
import PageOutline from "../../Components/PageOutline";
import AnnualThemeCard from "./Components/AnnualThemeCard";
import { Modal } from "@/components/Modal";
import AnnualThemeForm from "./Components/AnnualThemeForm";
import type { IAnnualThemeForm } from "./Components/AnnualThemeForm";
import { api } from "@/utils/api/apiCalls";
import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import { showDeleteDialog, showNotification } from "../../utils";
import EmptyState from "@/components/EmptyState";

type AnnualThemeItem = IAnnualThemeForm & { id: string | number };

const AnnualThemeManager = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState<AnnualThemeItem | null>(null);
    const [themes, setThemes] = useState<AnnualThemeItem[]>([]);

      const { data, loading, refetch } = useFetch(api.fetch.fetchAnnualTheme);
      const { executeDelete, success } = useDelete(api.delete.deleteAnnualTheme);

    const handleEditTheme = (theme: AnnualThemeItem) => {
      setSelectedTheme(theme);
      setIsFormOpen(true);
    };


    useEffect(() => {
        if (data && data.data && Array.isArray(data.data)) {
          setThemes(data.data as AnnualThemeItem[]);
        }
      }, [data]);
    
      useEffect(() => {
        if (success) {
          refetch();
          showNotification("Theme deleted successfully", "success");
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

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {themes.map((theme) => (
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
        {!loading && themes.length === 0 && (
          <EmptyState
            scope="page"
            msg="No annual themes found"
            description="Create your first annual theme to keep church communication aligned."
          />
        )}
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
