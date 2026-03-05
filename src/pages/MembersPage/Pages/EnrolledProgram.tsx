import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components";
import CourseSidebar from "../Component/CourseSidebar";
import { useParams } from "react-router-dom";
import BannerWrapper from "../layouts/BannerWrapper";
import LearningUnit from "@/pages/HomePage/pages/MinistrySchool/Components/LearningUnit";
import { api, Topic } from "@/utils";
import { useFetch } from "@/CustomHooks/useFetch";
import { useAuth } from "@/context/AuthWrapper";
import { Modal } from "@/components/Modal";
import { TrophyIcon } from "@heroicons/react/24/solid";
import CertificateModal from "@/pages/HomePage/pages/MinistrySchool/Components/CertificateModal";
import { ApiResponse, QueryType } from "@/utils/interfaces";


type NavItem = { 
  id: string | number; 
  name: string; 
  active: boolean; 
  completed?: boolean;
  type?: string;
};

type ProgramCompletionStatus = {
  title?: string;
  description?: string;
  completed?: boolean;
  topics?: Topic[];
};

type CompletionPrompt = {
  completedTopicName: string;
  nextTopicId: string | number;
  nextTopicName: string;
};

/**
 * EnrolledProgram Component
 * Displays a program's details with topics, assignments, and materials
 */
const EnrolledProgram: React.FC = () => {
  const { programId } = useParams<{ programId: string }>();
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const [topics, setTopics] = useState<Topic[]>([]);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | number | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [viewCertificate, setViewCertificate] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [completionPrompt, setCompletionPrompt] = useState<CompletionPrompt | null>(null);

  const { data, refetch } = useFetch<ApiResponse<ProgramCompletionStatus>>(
    api.fetch.fetchMyProgram as (
      query?: QueryType
    ) => Promise<ApiResponse<ProgramCompletionStatus>>,
    { programId: programId ?? "", userId }
  );

  useEffect(() => {
    if (!data?.data) return;

    const backendTopics = data.data.topics ?? [];
    setTopics(backendTopics);

    if (backendTopics.length === 0) {
      setNavItems([]);
      setSelectedTopicId(null);
      setIsLoading(false);
      return;
    }

    const selectedFromCurrentState =
      selectedTopicId !== null
        ? backendTopics.find((topic) => String(topic.id) === String(selectedTopicId))
        : null;

    const fallbackTopic = backendTopics.find((topic) => !topic.completed) ?? backendTopics[0];
    const activeTopic = selectedFromCurrentState ?? fallbackTopic;

    const items = backendTopics.map((topic) => ({
      id: topic.id,
      name: topic.name,
      active: String(topic.id) === String(activeTopic.id),
      completed: topic.completed || false,
      type: topic.learningUnit?.type ?? undefined,
    }));

    setNavItems(items);
    setSelectedTopicId(activeTopic.id);
    setIsLoading(false);
  }, [data, selectedTopicId]);

  useEffect(() => {
    if (!data?.data?.completed || !user || !programId) return;

    const celebrationKey = `program_completed_${programId}_${user.id}`;
    const hasCelebrated = localStorage.getItem(celebrationKey);

    if (!hasCelebrated) {
      setShowCelebration(true);
      localStorage.setItem(celebrationKey, "true");
    }
  }, [data, user, programId]);

  const handleTopicSelect = useCallback((navId: string | number) => {
    setNavItems((items) =>
      items.map((item) => ({ ...item, active: String(item.id) === String(navId) }))
    );
    setSelectedTopicId(navId);
    setCompletionPrompt(null);
  }, []);

  const selectedTopic = useMemo(
    () => topics.find((topic) => String(topic.id) === String(selectedTopicId)) ?? null,
    [topics, selectedTopicId]
  );

  const selectedTopicIndex = useMemo(
    () => topics.findIndex((topic) => String(topic.id) === String(selectedTopicId)),
    [topics, selectedTopicId]
  );

  const previousTopic = selectedTopicIndex > 0 ? topics[selectedTopicIndex - 1] : null;
  const nextTopic =
    selectedTopicIndex >= 0 && selectedTopicIndex < topics.length - 1
      ? topics[selectedTopicIndex + 1]
      : null;

  const completedTopics = useMemo(
    () => topics.filter((topic) => topic.completed).length,
    [topics]
  );
  const progressPercentage = topics.length
    ? Math.round((completedTopics / topics.length) * 100)
    : 0;

  const handleTopicCompleted = useCallback(
    (completedTopicId: string | number) => {
      const completedIndex = topics.findIndex(
        (topic) => String(topic.id) === String(completedTopicId)
      );
      if (completedIndex < 0) return;

      const nextAvailableTopic = topics[completedIndex + 1];
      if (!nextAvailableTopic) return;

      setCompletionPrompt({
        completedTopicName: topics[completedIndex]?.name ?? "Topic",
        nextTopicId: nextAvailableTopic.id,
        nextTopicName: nextAvailableTopic.name,
      });
    },
    [topics]
  );

  const goToPromptNextTopic = useCallback(() => {
    if (!completionPrompt) return;
    handleTopicSelect(completionPrompt.nextTopicId);
    setCompletionPrompt(null);
  }, [completionPrompt, handleTopicSelect]);

    

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
            {data?.data?.completed&&<div>
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
                    <div className="rounded-xl border border-lightGray bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-widest text-primaryGray/80">
                            Learning Progress
                          </p>
                          <p className="text-sm font-medium text-primary">
                            {completedTopics}/{topics.length} topics completed
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            value="Previous Topic"
                            variant="secondary"
                            className="min-w-[140px]"
                            onClick={() => previousTopic && handleTopicSelect(previousTopic.id)}
                            disabled={!previousTopic}
                          />
                          <Button
                            value={nextTopic ? "Next Topic" : "Last Topic"}
                            variant="primary"
                            className="min-w-[140px]"
                            onClick={() => nextTopic && handleTopicSelect(nextTopic.id)}
                            disabled={!nextTopic}
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between text-xs font-medium text-primaryGray">
                          <span>{progressPercentage}% complete</span>
                          <span>Topic {Math.max(selectedTopicIndex + 1, 1)} of {topics.length}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-lightGray/40">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-lightGray bg-white p-5 shadow-sm">
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold text-primary">{selectedTopic.name}</h2>
                        <span className="rounded-full bg-lightGray/40 px-3 py-1 text-xs font-semibold text-primaryGray">
                          Topic {Math.max(selectedTopicIndex + 1, 1)}
                        </span>
                      </div>
                      <div
                        className="prose max-w-none text-primaryGray"
                        dangerouslySetInnerHTML={{
                          __html: String(selectedTopic.description ?? ""),
                        }}
                      />
                    </div>

                    <LearningUnit 
                    unit={selectedTopic.learningUnit ?? undefined} 
                    topicId={selectedTopic.id} 
                    userId={userId}
                    programId= {programId}

                    topicCompleted={selectedTopic.completed}
                    topicStatus={selectedTopic.status}
                    topicScore={selectedTopic.score ?? undefined}
                    topicCompletedAt={selectedTopic.completedAt}
                    activation={selectedTopic.activation}

                    hasNextTopic={Boolean(nextTopic)}
                    nextTopicName={nextTopic?.name}
                    onGoToNextTopic={nextTopic ? () => handleTopicSelect(nextTopic.id) : undefined}
                    onTopicCompleted={handleTopicCompleted}

                    refetch={refetch}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px]">
                    <div className="text-center space-y-2">
                      <svg
                        className="mx-auto h-12 w-12 text-primaryGray"
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
          program={data?.data?.title ?? ""}
          description={`For the success completion of ${
      data?.data?.title ? `${data?.data?.title} program` : "the program"
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
	            <h2 className="text-2xl font-bold text-primary">
	              Congratulations 🎉
	            </h2>
	            <p className="text-sm text-primaryGray">
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

      <Modal
        open={Boolean(completionPrompt)}
        onClose={() => setCompletionPrompt(null)}
        className="max-w-md"
      >
        <div className="space-y-5 p-6">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-primary">Topic Completed</h3>
            <p className="text-sm text-primaryGray">
              You completed <span className="font-semibold text-primary">{completionPrompt?.completedTopicName}</span>.
              Would you like to continue to{" "}
              <span className="font-semibold text-primary">{completionPrompt?.nextTopicName}</span>?
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              value="Stay Here"
              variant="secondary"
              onClick={() => setCompletionPrompt(null)}
            />
            <Button
              value="Go To Next Topic"
              variant="primary"
              className="inline-flex items-center gap-2"
              onClick={goToPromptNextTopic}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EnrolledProgram;
