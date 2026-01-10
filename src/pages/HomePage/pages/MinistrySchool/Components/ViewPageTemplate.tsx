import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { Outlet, useParams } from "react-router-dom";
import { useViewPage, ViewPageProvider } from "../customHooks/ViewPageContext";
import { Badge } from "@/components/Badge";
import { useRef, useState } from "react";
import ellipse from "@/assets/ellipse.svg"; // Update path as needed
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components";
import { Modal } from "@/components/Modal";
import { CohortForm } from "./CohortForm";
import TopicForm from "./TopicForm";
import { Banner } from "../../Members/Components/Banner";

const ViewPageTemplateInner = () => {
  const { loading, data: Data, details } = useViewPage();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
    const [isCohortModalOpen, setIsCohortModalOpen] = useState(false);
  const { id: programId } = useParams();

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSubmitTopic = () => {
    // Add your topic submission logic here
  };

  
  
  return (
    <PageOutline className="p-0 ">
      <section className="sticky top-0">
        <Banner >
          <div className="container mx-auto  space-y-4">
            <div>
              <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    {
                    loading ?  <div className="animate-pulse flex  justify-between  w-[40rem]">
                    <div className="h-6 bg-lightGray rounded w-3/5"></div>
                    <div className="h-4 bg-lightGray rounded w-1/6"></div>
                    </div> : 
                    <div className="flex items-center gap-4">
                      <div className="text-white text-2xl font-bold">{Data?.title || Data?.user?.name }</div>
                      
                    </div>
                    }
                    
                  </div>
                  
                </div>
              {/* Description */}
              {loading ? (
                <div className="animate-pulse h-4 bg-lightGray rounded w-2/6"></div>
              ) : (
                Data?.description && (
                  <div className="text-sm">
                    <p>{Data?.description}</p>
                  </div>
                )
              )}
            </div>

            {/* Overview */}
            {loading ? (
              details && (
                <div className="space-y-2 animate-pulse">
                  <div className="flex gap-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="space-y-2">
                        <div className="h-4 bg-lightGray rounded w-20"></div>
                        <div className="h-4 bg-lightGray rounded w-28"></div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : (
              <div>{details}</div>
            )}

            
          </div>
          
        </Banner>
      </section>

      {/* Render dynamic content (children) */}
      <section>
        {/* {loading ? (
          <div className="container mt-8 space-y-4 -z-50">
            <div className="animate-pulse flex items-center justify-between space-x-2">
              <div className="h-8 bg-lightGray rounded w-32"></div>
              <div className="h-10 bg-lightGray rounded w-24"></div>
            </div>
            {isGrid ? <SkeletonLoader no={6} /> : <TableSkeleton />}
          </div>
        ) : ( */}
        <div className="px-6">
          <Outlet />
        </div>
        {/* )} */}
      </section>

      
            {/* Cohort creation (reused CohortForm) */}
            <Modal open={isCohortModalOpen} onClose={() => setIsCohortModalOpen(false)}>
              <CohortForm
                onClose={() => setIsCohortModalOpen(false)}
                programId={programId ? Number(programId) : NaN}
                onSuccess={() => {
                  setIsCohortModalOpen(false);
                }}
              />
            </Modal>
      
            {/* Topic creation */}
            <Modal open={isTopicModalOpen} onClose={() => setIsTopicModalOpen(false)} className="w-[60vw]">
            <TopicForm
              open={isTopicModalOpen}
              onClose={() => setIsTopicModalOpen(false)}
              onSubmit={handleSubmitTopic}
            />
            </Modal>
    </PageOutline>
  );
};

const ViewPageTemplate = () => (
  <ViewPageProvider>
    <ViewPageTemplateInner />
  </ViewPageProvider>
);

export default ViewPageTemplate;
