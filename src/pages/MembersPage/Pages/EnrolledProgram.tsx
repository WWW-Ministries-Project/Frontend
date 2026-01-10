import React, { useEffect, useState } from "react";
import { Button } from "@/components";
import CourseSidebar from "../Component/CourseSidebar";
import { useParams, useNavigate } from "react-router-dom";
import BannerWrapper from "../layouts/BannerWrapper";
import LearningUnit from "@/pages/HomePage/pages/MinistrySchool/Components/LearningUnit";
import { api, ProgramTopic, Topic } from "@/utils";
import { useFetch } from "@/CustomHooks/useFetch";
import { useAuth } from "@/context/AuthWrapper";
import { Modal } from "@/components/Modal";
import { CheckCircleIcon, TrophyIcon } from "@heroicons/react/24/solid";
import CertificateModal from "@/pages/HomePage/pages/MinistrySchool/Components/CertificateModal";


type NavItem = { 
  id: string | number; 
  name: string; 
  active: boolean; 
  completed?: boolean;
  type?: string | null;
};

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
  const [viewCertificate, setViewCertificate] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

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
    // Find first incomplete topic
    const firstIncompleteTopic =
      backendTopics.find((t) => !t.completed) ?? backendTopics[0];

    const items = backendTopics.map((t) => ({
      id: t.id,
      name: t.name,
      active: t.id === firstIncompleteTopic.id,
      completed: t.completed || false,
      type: t.learningUnit?.type ?? null,
    }));

    setNavItems(items);
    setSelectedTopicId(firstIncompleteTopic.id);
  } else {
    setNavItems([]);
    setSelectedTopicId(null);
  }

  setIsLoading(false);
}, [data]);

useEffect(() => {
  if (!data?.data?.completed || !user || !programId) return;

  const celebrationKey = `program_completed_${programId}_${user.id}`;
  const hasCelebrated = localStorage.getItem(celebrationKey);

  if (!hasCelebrated) {
    setShowCelebration(true);
    localStorage.setItem(celebrationKey, "true");
  }
}, [data, user, programId]);

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
        <div className="space-y-4 w-full">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-3 flex-1">
              <h1 className="font-bold text-2xl md:text-3xl lg:text-4xl ">
                {data?.data?.title}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {data?.data?.description}
              </p>
            </div>
            {data?.data.completed&&<div>
              <Button
                value="View Certificate"
                variant="primary"
                className="bg-white text-primary"
                onClick={() =>setViewCertificate(true)}
              />
            </div>}
          </div>
        </div>
      </BannerWrapper>

      {/* Main Content Area */}
      <main className="mx-auto py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Topics Sidebar - Left */}
          <aside
            className="w-full lg:w-[280px] shrink-0 lg:sticky lg:top-[13rem]"
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
            className="flex-1 min-w-0"
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
                    topicId={selectedTopic.id} 
                    userId ={user!.id} 
                    programId= {programId}
                    completed={selectedTopic.completed}
                    refetch={refetch}
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
      <Modal open={viewCertificate} onClose={()=>setViewCertificate(false)} className="">
        <CertificateModal
          open={viewCertificate}
          recipientName={user.name}
          program={data?.data?.title!}
          description={`For the success completion of ${
      data?.data?.title! ? `${data?.data?.title!} program` : "the program"
    }. `}
          onClose={()=>setViewCertificate(false)}
        />
      </Modal>

      <Modal
        open={showCelebration}
        onClose={() => setShowCelebration(false)}
        className="max-w-md text-center"
      >
        <div className="space-y-6 p-6">
          <div className="flex justify-center">
            <TrophyIcon className="h-16 w-16 text-yellow-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Congratulations 🎉
            </h2>
            <p className="text-sm text-gray-600">
              You have successfully completed the program.
              We’re proud of your dedication and commitment.
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <Button
              value="View Certificate"
              variant="primary"
              onClick={() => {
                setShowCelebration(false);
                setViewCertificate(true);
              }}
            />
            <Button
              value="Close"
              variant="secondary"
              onClick={() => setShowCelebration(false)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EnrolledProgram;