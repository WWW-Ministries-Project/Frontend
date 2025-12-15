import React, { useEffect, useState } from "react";
import { Button } from "@/components";
import { FileCard } from "@/pages/HomePage/pages/MinistrySchool/Components/FileCard";
import TopicDetails from "@/pages/HomePage/pages/MinistrySchool/Components/TopicDetails";
import { mockText } from "@/pages/HomePage/utils/dummydata";
import AssMatSidebar from "../Component/AssMatSidebar";
import CourseSidebar from "../Component/CourseSidebar";
import { useParams, useNavigate } from "react-router-dom";
import { dummyProgData } from "@/pages/HomePage/utils/dummyProgData";
import BannerWrapper from "../layouts/BannerWrapper";

type Program = typeof dummyProgData[number];
type NavItem = { id: string | number; name: string; active: boolean };

/**
 * EnrolledProgram Component
 * Displays a program's details with topics, assignments, and materials
 */
const EnrolledProgram: React.FC = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const id = Number(programId);

  const [program, setProgram] = useState<Program | null>(null);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    setIsLoading(true);
    
    const found = dummyProgData.find((p) => p.id === id) || null;
    setProgram(found);

    if (found?.topics?.length) {
      const items = found.topics.map((t, idx) => ({
        id: t.id,
        name: t.name,
        active: idx === 0,
      }));
      setNavItems(items);
      setSelectedTopicId(found.topics[0].id);
    }

    setIsLoading(false);
  }, [id]);

  const handleTopicSelect = (navId: string | number) => {
    setNavItems((items) =>
      items.map((i) => ({ ...i, active: i.id === navId }))
    );
    setSelectedTopicId(Number(navId));
  };

  const selectedTopic =
    program?.topics?.find((t) => t.id === selectedTopicId) ?? null;

  const assignments = selectedTopic?.assignments ?? [];
  const materials = selectedTopic?.materials ?? [];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading program...</p>
        </div>
      </div>
    );
  }

  // Error state - Program not found
  if (!program) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="max-w-md text-center space-y-4 p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            Program Not Found
          </h2>
          <p className="text-sm text-muted-foreground">
            We couldn't find a program with ID: <strong>{id}</strong>
          </p>
          {/* <Button
            onClick={() => navigate("/programs")}
            className="mt-4"
          >
            Browse Programs
          </Button> */}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Banner Section */}
      <BannerWrapper>
        <div className="space-y-4 max-w-4xl">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <h1 className="font-bold text-2xl md:text-3xl lg:text-4xl text-gray-900">
                {program.title}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {program.description}
              </p>
            </div>
          </div>

          {/* Optional: Progress indicator or metadata */}
          {/* {program && (
            <div className="flex flex-wrap gap-3 text-xs md:text-sm text-muted-foreground">
              {program.duration && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {program.duration}
                </span>
              )}
              {program.metadata.level && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {program.metadata.level}
                </span>
              )}
            </div>
          )} */}
        </div>
      </BannerWrapper>

      {/* Main Content Area */}
      <main className="mx-auto py-8 ">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Topics Sidebar - Left */}
          <aside 
            className="w-full lg:w-[280px] shrink-0"
            aria-label="Course topics navigation"
          >
            <div className="lg:sticky lg:top-24">
              <CourseSidebar
                navItems={navItems}
                onSelect={handleTopicSelect}
                heading="Topics"
              />
            </div>
          </aside>

          {/* Main Content - Center */}
          <section 
            className="flex-1 min-w-0"
            aria-label="Topic content"
          >
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8 min-h-[400px]">
                {selectedTopic ? (
                  <TopicDetails
                    topicName={selectedTopic.name}
                    topicDetails={selectedTopic.content || mockText}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[300px]">
                    <div className="text-center space-y-2">
                      <svg
                        className="w-12 h-12 text-gray-400 mx-auto"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="text-sm text-muted-foreground">
                        Select a topic to view details
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="w-full 2xl:hidden mt-6">
              <AssMatSidebar
                materials={materials}
                assignments={assignments}
              />
            </div>
          </section>

          {/* Assignments & Materials Sidebar - Right */}
          <aside 
            className="w-full hidden 2xl:block lg:w-[300px] xl:w-[320px] shrink-0"
            aria-label="Assignments and materials"
          >
            <div className="lg:sticky lg:top-24">
              <AssMatSidebar
                materials={materials}
                assignments={assignments}
              />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default EnrolledProgram;