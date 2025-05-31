import { Button } from "@/components";
import { Badge } from "@/components/Badge";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import TableSkeleton from "@/pages/HomePage/Components/TableSkeleton";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { ReactNode } from "react";

interface Data {
  name: string;
  title: string;
  status: string;
  description: string;
  startDate: string;
  duration: string;
  applicationDeadline: string;
  classesLength: number;
  topics: string[];
  instructor: string;
  schedule: string; // Added schedule property
  format: string; // Added format property
  location: string; // Added location property
  meetingLink: string; // Added meetingLink property
  enrolled: number; // Added enrolled property
  capacity: number; // Added capacity property
  firstName?: string; // Added firstName property
  lastName?: string; // Added lastName property
  eligibility?: string; // Added
}

interface ViewPageTemplateProps {
  Data: Data;
  onPrimaryButtonClick: () => void;
  onSecondaryButtonClick: () => void;
  children: ReactNode;
  details: ReactNode; // Added the missing 'details' property
  primaryButton: string;
  secondaryButton: string;
  showTopic: boolean;
  loading: boolean;
  isGrid: boolean;
  title: string;
  description: string;
}

const ViewPageTemplate: React.FC<ViewPageTemplateProps> = ({
  Data,
  onPrimaryButtonClick,
  onSecondaryButtonClick,
  children,
  details,
  primaryButton,
  secondaryButton,
  showTopic,
  loading,
  isGrid = true,
}) => {
  return (
    <PageOutline className="p-0">
      <section className="sticky top-0">
        <div className="bg-gradient-to-r from-primary to-primary/90 rounded-t-lg text-white">
          <div className="container mx-auto p-4 space-y-4">
            <div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  {loading ? (
                    <div className="animate-pulse flex  justify-between  w-[40rem]">
                      <div className="h-6 bg-lightGray rounded w-3/5"></div>
                      <div className="h-4 bg-lightGray rounded w-1/6"></div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="text-white text-2xl font-bold">
                        {Data?.title || Data?.name} {Data?.firstName}{" "}
                        {Data?.lastName}
                      </div>
                      {(Data?.status || Data?.eligibility) && (
                        <Badge className="text-xs bg-primary text-white">
                          {String(Data?.status || Data?.eligibility)}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                {loading ? (
                  <div className="animate-pulse flex justify-end space-x-2 w-[30rem]">
                    <div className="h-10 bg-lightGray rounded w-1/3"></div>
                    <div className="h-10 bg-lightGray rounded w-1/3"></div>
                  </div>
                ) : (
                  <div>
                    {primaryButton && (
                      <Button
                        value={`${primaryButton}`}
                        onClick={onPrimaryButtonClick}
                        className="p-2 m-1 bg-white min-h-10 max-h-14 text-primary"
                      />
                    )}
                    {secondaryButton && (
                      <Button
                        value={`${secondaryButton}`}
                        onClick={onSecondaryButtonClick}
                        className="p-2 m-1 border border-white min-h-10 max-h-14 text-white"
                      />
                    )}
                  </div>
                )}
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
            {loading
              ? Data?.topics &&
                showTopic && (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-4 bg-lightGray rounded w-20"></div>
                    <div className="flex gap-2">
                      {Array.from({ length: 9 }).map((_, index) => (
                        <div className="h-4 bg-lightGray rounded-full w-20" key={index}></div>
                      ))}
                    </div>
                  </div>
                )
              : Data?.topics &&
                showTopic && (
                  <div className="space-y-1">
                    <p className="text-white text-lg font-semibold">Topics</p>
                    <div className="flex flex-wrap gap-2">
                      {Data?.topics.map((topic, index) => (
                        <Badge
                          key={index}
                          className="bg-lightGray border-lightGray font-medium text-sm text-primary"
                        >
                          {topic?.name || topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
          </div>
        </div>
      </section>

      {/* Render dynamic content (children) */}
      <section>
        {loading ? (
          <div className="container mt-8 space-y-4 -z-50">
            <div className="animate-pulse flex items-center justify-between space-x-2">
              <div className="h-8 bg-lightGray rounded w-32"></div>
              <div className="h-10 bg-lightGray rounded w-24"></div>
            </div>
            {isGrid ? <SkeletonLoader no={6} /> : <TableSkeleton />}
          </div>
        ) : (
          <div className="container">{children}</div>
        )}
      </section>
    </PageOutline>
  );
};

export default ViewPageTemplate;
