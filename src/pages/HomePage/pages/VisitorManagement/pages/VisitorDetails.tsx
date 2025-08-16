import { HeaderControls } from "@/components/HeaderControls";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import BannerSkeletonLoader from "@/pages/HomePage/Components/reusable/BannerSkeletonLoader";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import TableSkeletonLoader from "@/pages/HomePage/Components/TableSkeleton";
import { api } from "@/utils";
import { formatDate } from "@/utils/helperFunctions";
import { EnvelopeIcon, HomeIcon, PhoneIcon } from "@heroicons/react/24/solid";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ListDetailComp } from "../../DashBoard/Components/ListDetailComp";
import { Banner } from "../../Members/Components/Banner";
import { FollowUps } from "../Components/FollowUps";
import { Visits } from "../Components/Visit";

export const VisitorDetails = () => {
  const { visitorId } = useParams();
  const [selectedTab, setSelectedTab] = useState<string>("Visit");

  const { data, loading } = useFetch(api.fetch.fetchVisitorById, {
    id: visitorId!,
  });
  const visitor = useMemo(() => data?.data, [data]);

  const handleTabSelect = (tab: string) => setSelectedTab(tab);

  return (
    <PageOutline>
      {loading ? (
        <BannerSkeletonLoader />
      ) : (
        visitor && (
          <Banner
            name={`${visitor.firstName} ${visitor.lastName}`}
            id={visitor.id}
            src="https://media.istockphoto.com/id/587805156/vector/profile-picture-vector-illustration.jpg?s=612x612&w=0&k=20&c=gkvLDCgsHH-8HeQe7JsjhlOY6vRBJk_sKW9lyaLgmLo="
            email={visitor?.email}
            primary_number={visitor?.phone}
            onClick={() => {}}
          />
        )
      )}

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
                  <Visits visits={visitor?.visits || []} visitorId={visitorId!} />
                </div>
              )}

              {selectedTab === "Follow-ups" && (
                <div className="overflow-x-auto">
                  <FollowUps
                    followUps={visitor?.followUps || []}
                    visitorId={visitorId!}
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
            </div>
          )}
        </section>
      </div>
    </PageOutline>
  );
};

/* Tailwind helpers (optional)
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
*/
