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
        <div className="bg-gradient-to-r from-primary to-primary/90 rounded-t-lg text-white flex p-4 px-6 justify-between items-center">
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

            {/* Topics */}
            {/* {loading
              ? Data?.topics &&
                Data?.showTopic && (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-4 bg-lightGray rounded w-20"></div>
                    <div className="flex gap-2">
                      {Array.from({ length: 9 }).map((_, index) => (
                        <div
                          className="h-4 bg-lightGray rounded-full w-20"
                          key={index}
                        ></div>
                      ))}
                    </div>
                  </div>
                )
              : Data?.topics &&
                Data?.showTopic && (
                  <div className="space-y-1">
                    <p className="text-white text-lg font-semibold">Topics</p>
                    <div className="flex flex-wrap gap-2">
                      {Data?.topics.map((topic, index) => (
                        <Badge
                          key={index}
                          className="bg-lightGray border-lightGray font-medium text-sm text-primary"
                        <button
                          ref={buttonRef} // Reference to the button
                          className="text-primary"
                          onClick={handleMenuToggle}
                        >
                  </div>
                )} */}
          </div>
          <div className="flex gap-4">
            {/* <div >
              <Button
                value="Manage class"
                className="  text-primary min-h-10 max-h-14 bg-white"
                onClick={() => {}}
              />
            </div> */}
            <div className="relative">
            <button
              ref={buttonRef} // Reference to the button
              className="text-primary"
              onClick={handleMenuToggle}
            >
              <div className="flex gap-2 text-white border p-2 rounded-lg">
                Create
              </div>
            </button>
            {isMenuOpen  && (
              <div
                ref={menuRef}
                className="absolute right-0  mt-2 w-48 bg-white text-primary border border-lightGray rounded-lg shadow-lg"
              >
                <ul className="py-1">
                  <li
                    className="px-4 py-2 hover:bg-lightGray cursor-pointer"
                                        onClick={() => {
                      setIsCohortModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                  >
                    Cohort
                  </li>
                  <li
                    className="px-4 py-2 hover:bg-lightGray cursor-pointer"
                    onClick={() => setIsTopicModalOpen(true)}
                  >
                    Topic
                  </li>

                  
                </ul>
              </div>
            )}
          </div>
          </div>
        </div>
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
