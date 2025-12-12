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
    // find program by id from dummy data
    const found = dummyProgData.find((p) => p.id === id) || null;
    console.log("programId", programId);
    
    console.log("found",found);
    
    setProgram(found);

    if (found && found.topics && found.topics.length > 0) {
      const items = found.topics.map((t, idx) => ({ id: t.id, name: t.name, active: idx === 0 }));
      setNavItems(items);
      setSelectedTopicId(found.topics[0].id);
    } else {
      setNavItems([]);
      setSelectedTopicId(null);
    }
  }, [programId]);

  const handleTopicSelect = (navId: string | number) => {
    setNavItems((items) => items.map((i) => ({ ...i, active: i.id === navId })));
    setSelectedTopicId(Number(navId));
  };

  const selectedTopic = program?.topics?.find((t) => t.id === selectedTopicId) ?? null;

  // derive assignments and materials safely
  const assignments = selectedTopic?.assignments ?? [];
  const materials = selectedTopic?.materials ?? [];

  if (!program) {
    return (
      <div className="p-8">
        <h2 className="text-lg font-semibold">Program not found</h2>
        <p className="text-sm text-muted-foreground">We couldn't find a program with id: {id}</p>
      </div>
    );
  }

  return (
    <div>
      <BannerWrapper>
          <div className="space-y-4">
            <div className="font-bold text-3xl">{program.title}</div>
            <div>{program.description}</div>
          </div>
          </BannerWrapper>

      <main className="mx-auto py-8 ">
        <div className="flex flex-col gap-6 lg:flex-row">
          <CourseSidebar navItems={navItems} onSelect={handleTopicSelect} heading="Topics" />

          <div className="p-4 border bg-white rounded-xl flex-1">
            {selectedTopic ? (
              <TopicDetails topicName={selectedTopic.name} topicDetails={selectedTopic.content || mockText} />
            ) : (
              <div className="text-muted-foreground">Select a topic to view details</div>
            )}
          </div>

          <AssMatSidebar materials={materials} assignments={assignments} />
        </div>
      </main>
    </div>
  );
};

export default EnrolledProgram;