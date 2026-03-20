import { HeaderControls } from "@/components/HeaderControls";
import { Modal } from "@/components/Modal";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePut } from "@/CustomHooks/usePut";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import BannerSkeletonLoader from "@/pages/HomePage/Components/reusable/BannerSkeletonLoader";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import TableSkeletonLoader from "@/pages/HomePage/Components/TableSkeleton";
import { api, VisitorType } from "@/utils";
import { formatDate } from "@/utils/helperFunctions";
import { EnvelopeIcon, HomeIcon, PhoneIcon } from "@heroicons/react/24/solid";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ListDetailComp } from "../../DashBoard/Components/ListDetailComp";
import { Banner } from "../../Members/Components/Banner";
import { IVisitorForm, VisitorForm } from "../Components/VisitorForm";
import { FollowUps } from "../Components/FollowUps";
import { Visits } from "../Components/Visit";
import { mapVisitorToForm } from "../utils";
import { ProfilePicture } from "@/components";
import { showNotification } from "../../../utils";

export const VisitorDetails = () => {
  const { visitorId } = useParams();
  const [selectedTab, setSelectedTab] = useState<string>("Visit");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<
    (IVisitorForm & { id: string }) | undefined
  >(undefined);
  const { canManage } = useAccessControl();
  const canManageVisitors = canManage("Visitors");

  const { data, loading, refetch } = useFetch(api.fetch.fetchVisitorById, {
    id: visitorId!,
  });
  const {
    updateData,
    loading: putLoading,
    data: putSuccess,
    error: putError,
  } = usePut(api.put.updateVisitor);
  const visitor = useMemo(() => data?.data, [data]);
  const visitorClergyInfo = useMemo(() => {
    if (!visitor?.isClergy) return null;

    return {
      churchName: visitor.churchName || "",
      churchLocation: visitor.churchLocation || "",
      churchRole: visitor.churchRole || "",
    };
  }, [visitor?.churchLocation, visitor?.churchName, visitor?.churchRole, visitor?.isClergy]);
  const responsibleMemberNames = useMemo(() => {
    const names =
      visitor?.responsibleMembersNames?.map((member) => member.name).filter(Boolean) || [];

    return Array.from(new Set(names));
  }, [visitor?.responsibleMembersNames]);

  const handleTabSelect = (tab: string) => setSelectedTab(tab);
  const profileImg = "https://media.istockphoto.com/id/587805156/vector/profile-picture-vector-illustration.jpg?s=612x612&w=0&k=20&c=gkvLDCgsHH-8HeQe7JsjhlOY6vRBJk_sKW9lyaLgmLo="
  const handleOpenEditModal = () => {
    if (!visitor) return;
    setSelectedVisitor(mapVisitorToForm(visitor as VisitorType));
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (formValues: IVisitorForm & { id?: string }) => {
    const visitorIdToUpdate = selectedVisitor?.id || String(visitor?.id || "");

    if (!visitorIdToUpdate) {
      showNotification("Unable to update visitor: missing visitor id", "error");
      return;
    }

    void updateData(formValues, { id: visitorIdToUpdate });
  };

  useEffect(() => {
    if (!putSuccess) return;

    showNotification("Visitor updated successfully", "success");
    void refetch();
    setIsEditModalOpen(false);
    setSelectedVisitor(undefined);
  }, [putSuccess, refetch]);

  useEffect(() => {
    if (!putError) return;

    showNotification(putError.message || "Unable to update visitor", "error");
  }, [putError]);

  return (
    <div>
      
      {loading ? (
        <BannerSkeletonLoader />
      ) : (
        visitor && (
          <div className="sticky top-0 z-10 w-full">
          <Banner>
            <div className="flex justify-between items-cente  container mx-auto">
                                <div className="flex gap-4 items-center  ">
                                  <ProfilePicture
                                    className="w-24 h-24 outline outline-white"
                                    src={profileImg || ""}
                                    alt="cover Image"
                                    name={`${visitor.firstName} ${visitor.lastName}`}
                                    id="coverPic"
                                  />
                                  <article className="xs:hidden md:inline space-y-2">
                                    <div className="font-bold text-2xl ">
                                      {`${visitor.firstName} ${visitor.lastName}` || "No Name"}
                                    </div>
                                    
                                    <div className="">
                                      {(visitor?.email || "No Email") +
                                        " | " +
                                        (visitor?.phone || "No Phone")}
                                    </div>
                                    
                                  </article>
                                </div>
                                
                              </div>
          </Banner>
          </div>
        )
      )}
      <PageOutline>
      {/* Main layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 sm:p-4">
        {/* Left: content */}
        <section className="order-2 md:order-1 md:col-span-2">
          {/* Tabs (mobile scrollable) */}
          <div className="mb-4 sm:mb-6 -mx-3 sm:mx-0">
            {loading ? (
              <div className="animate-pulse flex gap-3 sm:gap-4 overflow-hidden px-3 sm:px-0">
                <div className="h-9 bg-lightGray rounded w-1/3"></div>
                <div className="h-9 bg-lightGray rounded w-1/3"></div>
                <div className="h-9 bg-lightGray rounded w-1/3"></div>
              </div>
            ) : (
              <div className="overflow-x-auto no-scrollbar px-3 sm:px-0">
                <div className="min-w-max">
                  <TabSelection
                    tabs={["Visit", "Follow-ups"]}
                    selectedTab={selectedTab}
                    onTabSelect={handleTabSelect}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Body */}
          {loading ? (
            <div className="space-y-4">
              <div className="animate-pulse space-y-2 w-full max-w-3xl">
                <div className="h-8 bg-lightGray rounded w-2/3 sm:w-1/2"></div>
                <div className="h-6 bg-lightGray rounded w-4/5 sm:w-2/3"></div>
              </div>
              <div className="overflow-x-auto rounded-lg border border-lightGray/50">
                <TableSkeletonLoader />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedTab === "Visit" && (
                <div className="overflow-x-auto">
                  <Visits
                    visits={visitor?.visits || []}
                    visitorId={visitorId!}
                    onRefetch={async () => {
                      await refetch();
                    }}
                  />
                </div>
              )}

              {selectedTab === "Follow-ups" && (
                <div className="overflow-x-auto">
                  <FollowUps
                    followUps={visitor?.followUps || []}
                    visitorId={visitorId!}
                    responsibleMembers={visitor?.responsibleMembersNames || []}
                    onRefetch={async () => {
                      await refetch();
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right: sidebar */}
        <section className="order-1 md:order-2 md:col-span-1">
          {loading ? (
            <div className="animate-pulse border border-lightGray p-4 rounded-lg space-y-4 text-primary">
              <div className="flex justify-between">
                <div className="h-6 bg-lightGray rounded w-3/5"></div>
                <div className="h-4 bg-lightGray rounded w-1/5"></div>
              </div>
              <div className="h-4 bg-lightGray rounded w-1/2"></div>
              <div className="h-4 bg-lightGray rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-lightGray rounded w-2/3"></div>
                <div className="h-4 bg-lightGray rounded w-1/2"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-10 bg-lightGray rounded flex-1"></div>
                <div className="h-10 bg-lightGray rounded flex-1"></div>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-4 space-y-4 md:sticky md:top-4">
              <HeaderControls
                title="Visitor Details"
                subtitle={`Visitor since: ${formatDate(visitor?.visitDate || "")}`}
                btnName={canManageVisitors ? "Edit visitor" : undefined}
                handleClick={handleOpenEditModal}
                screenWidth={window.innerWidth}
              />

              <div className="space-y-3 break-words">
                <ListDetailComp icon={EnvelopeIcon} title={visitor?.email || ""} />
                <ListDetailComp icon={PhoneIcon} title={visitor?.phone || ""} />
                <ListDetailComp
                  icon={HomeIcon}
                  title={`${visitor?.country || ""} - ${visitor?.state || ""}`}
                />
              </div>

              <HorizontalLine />

              <div className="space-y-1">
                <div className="font-semibold text-sm sm:text-base">How they heard about us:</div>
                <div className="text-sm sm:text-base break-words">{visitor?.howHeard}</div>
              </div>

              {visitorClergyInfo ? (
                <>
                  <HorizontalLine />

                  <div className="space-y-2">
                    <div className="font-semibold text-sm sm:text-base">
                      Clergy Information
                    </div>
                    <div className="text-sm sm:text-base break-words">
                      Church: {visitorClergyInfo.churchName}
                    </div>
                    <div className="text-sm sm:text-base break-words">
                      Location: {visitorClergyInfo.churchLocation}
                    </div>
                    {visitorClergyInfo.churchRole ? (
                      <div className="text-sm sm:text-base break-words">
                        Role: {visitorClergyInfo.churchRole}
                      </div>
                    ) : null}
                  </div>
                </>
              ) : null}

              <HorizontalLine />

              <div className="space-y-1">
                <div className="font-semibold text-sm sm:text-base">
                  Responsible person{responsibleMemberNames.length > 1 ? "s" : ""}:
                </div>
                {responsibleMemberNames.length > 0 ? (
                  <ul className="list-disc pl-5 text-sm sm:text-base break-words space-y-1">
                    {responsibleMemberNames.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm sm:text-base break-words">Not assigned</div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </PageOutline>

    <Modal
      open={isEditModalOpen}
      className="max-w-5xl"
      onClose={() => {
        setIsEditModalOpen(false);
        setSelectedVisitor(undefined);
      }}
    >
      <VisitorForm
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedVisitor(undefined);
        }}
        selectedVisitor={selectedVisitor}
        onSubmit={handleEditSubmit}
        loading={putLoading}
      />
    </Modal>
    </div>
  );
};
