import React, { useEffect, useState } from "react";
import { Button } from "@/components";
import CourseSidebar from "../Component/CourseSidebar";
import { useParams, useNavigate } from "react-router-dom";
import BannerWrapper from "../layouts/BannerWrapper";
import LearningUnit from "@/pages/HomePage/pages/MinistrySchool/Components/LearningUnit";
import { api, ProgramTopic, Topic } from "@/utils";
import { useFetch } from "@/CustomHooks/useFetch";
import { useAuth } from "@/context/AuthWrapper";


type NavItem = { id: string | number; name: string; active: boolean };

/**
 * EnrolledProgram Component
 * Displays a program's details with topics, assignments, and materials
 */
const EnrolledProgram: React.FC = () => {
  const { programId } = useParams<{ programId: string }>();
  
  const navigate = useNavigate();
  const id = Number(programId);
  const { user } = useAuth();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { data, loading, refetch } = useFetch(
  api.fetch.fetchMyProgram,
     { programId, userId: user!.id }
    
);


  useEffect(() => {
    if (!data?.data) return;

    setIsLoading(true);

    const program = data.data;
    const backendTopics = program.topics ?? [];

    setTopics(backendTopics);

    if (backendTopics.length > 0) {
      const items = backendTopics.map((t, idx) => ({
        id: t.id,
        name: t.name,
        active: idx === 0,
      }));
      setNavItems(items);
      setSelectedTopicId(backendTopics[0].id);
    } else {
      setNavItems([]);
      setSelectedTopicId(null);
    }

    setIsLoading(false);
  }, [data]);

  const handleTopicSelect = (navId: string | number) => {
    setNavItems((items) =>
      items.map((i) => ({ ...i, active: i.id === navId }))
    );
    setSelectedTopicId(Number(navId));
  };

  const selectedTopic =
    topics.find((t) => t.id === selectedTopicId) ?? null;

    

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


  return (
    <div className="w-full">
      {/* Banner Section */}
      <BannerWrapper>
        <div className="space-y-4 max-w-4xl">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <h1 className="font-bold text-2xl md:text-3xl lg:text-4xl ">
                {data?.data?.title}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {data?.data?.description}
              </p>
            </div>
          </div>
        </div>
      </BannerWrapper>

      {/* Main Content Area */}
      <main className="mx-auto py-8 min-h-[calc(100vh-12rem)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Topics Sidebar - Left */}
          <aside
            className="w-full lg:w-[280px] shrink-0 lg:sticky lg:top-[13rem] lg:h-[calc(100vh-13rem)] lg:overflow-y-auto"
            aria-label="Course topics navigation"
          >
            <div className="">
              
              <CourseSidebar
                navItems={navItems}
                onSelect={handleTopicSelect}
                heading="Topics"
              />
            </div>
          </aside>

          {/* Main Content - Center */}
          <section 
            className="flex-1 min-w-0 lg:h-[calc(100vh-13rem)] lg:overflow-y-auto"
            aria-label="Topic content"
          >
            <div>
              <div className="">
                {selectedTopic ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {selectedTopic.name}
                      </h2>
                      <div
                        className="prose max-w-none text-gray-700"
                        dangerouslySetInnerHTML={{ __html: selectedTopic.description }}
                      />
                    </div>

                    <LearningUnit 
                    unit={selectedTopic.learningUnit ?? undefined} 
                    topicId={selectedTopic.id} userId ={user!.id} 
                    completed={selectedTopic.completed}
                    refetch={()=>refetch()}
                    />
                  </div>
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
            {/* <div className="w-full 2xl:hidden mt-6">
              <AssMatSidebar
                materials={materials}
                assignments={assignments}
              />
            </div> */}
          </section>

          {/* Assignments & Materials Sidebar - Right */}
          {/* <aside 
            className="w-full hidden 2xl:block lg:w-[300px] xl:w-[320px] shrink-0"
            aria-label="Assignments and materials"
          >
            <div className="lg:sticky lg:top-24">
              <AssMatSidebar
                materials={materials}
                assignments={assignments}
              />
            </div>
          </aside> */}
        </div>
      </main>
    </div>
  );
};

export default EnrolledProgram;