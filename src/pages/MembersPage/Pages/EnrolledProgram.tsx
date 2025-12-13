import React, { useEffect, useState } from "react";
import { Button } from "@/components";
import { FileCard } from "@/pages/HomePage/pages/MinistrySchool/Components/FileCard";
import TopicDetails from "@/pages/HomePage/pages/MinistrySchool/Components/TopicDetails";
import { mockText } from "@/pages/HomePage/utils/dummydata";
import AssMatSidebar from "../Component/AssMatSidebar";
import CourseSidebar from "../Component/CourseSidebar";
import { useParams } from "react-router-dom";
import { dummyProgData } from "@/pages/HomePage/utils/dummyProgData";
import BannerWrapper from "../layouts/BannerWrapper";

type Program = typeof dummyProgData[number];
type NavItem = { id: string | number; name: string; active: boolean };

const EnrolledProgram: React.FC = () => {
  const { programId } = useParams<{ programId: string }>();
  const id = Number(programId);

  const [program, setProgram] = useState<Program | null>(null);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);

  useEffect(() => {
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
  }, [programId]);

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

  if (!program) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold">Program not found</h2>
        <p className="text-sm text-muted-foreground">
          We couldn't find a program with id: {id}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Banner */}
      <BannerWrapper>
        <div className="space-y-3 max-w-5xl">
          <h1 className="font-bold text-2xl md:text-3xl">
            {program.title}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {program.description}
          </p>
        </div>
      </BannerWrapper>

      {/* Content */}
      <main className=" mx-auto py-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Topics Sidebar */}
          <aside className="lg:w-[260px] lg:sticky lg:top-6">
            <CourseSidebar
              navItems={navItems}
              onSelect={handleTopicSelect}
              heading="Topics"
            />
          </aside>

          {/* Main Content */}
          <section className="flex-1">
            <div className="p-4 sm:p-6 border bg-white rounded-xl min-h-[300px]">
              {selectedTopic ? (
                <TopicDetails
                  topicName={selectedTopic.name}
                  topicDetails={selectedTopic.content || mockText}
                />
              ) : (
                <div className="text-muted-foreground">
                  Select a topic to view details
                </div>
              )}
            </div>
          </section>

          {/* Assignments & Materials */}
          <aside className="lg:w-[300px] lg:sticky lg:top-6">
            <AssMatSidebar
              materials={materials}
              assignments={assignments}
            />
          </aside>
        </div>
      </main>
    </div>
  );
};

export default EnrolledProgram;