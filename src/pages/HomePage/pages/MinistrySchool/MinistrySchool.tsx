import HeaderControls from "@/components/HeaderControls";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import CardWrappers from "@/Wrappers/CardWrapper";
import { useState } from "react";
import ProgramsCard from "./Components/ProgramsCard";

interface Program {
  id: number;
  title: string;
  description: string;
  eligibility: "members" | "non-members" | "both";
  topics: string[];
  cohorts: Cohort[];
}

interface Cohort {
  id: number;
  name: string;
  startDate: string;
  status: "Active" | "Upcoming" | "Completed";
  classes: number;
  enrolledCount: number;
}

const MinistrySchool = () => {
  const programs: Program[] = [
    {
      id: 1,
      title: "Biblical Leadership",
      description: "A comprehensive program on biblical principles of leadership",
      eligibility: "both",
      topics: ["Biblical Leadership Foundations", "Character Development", "Vision Casting", "Team Building"],
      cohorts: [
        {
          id: 101,
          name: "Spring 2023",
          startDate: "2023-06-01",
          status: "Active",
          classes: 3,
          enrolledCount: 24,
        },
        {
          id: 102,
          name: "Fall 2023",
          startDate: "2023-09-15",
          status: "Upcoming",
          classes: 2,
          enrolledCount: 18,
        },
      ],
    },
    {
      id: 2,
      title: "Discipleship Training",
      description: "Learn how to effectively disciple others in their faith journey",
      eligibility: "members",
      topics: ["Discipleship Basics", "Mentoring Skills", "Spiritual Formation", "Accountability"],
      cohorts: [
        {
          id: 201,
          name: "Summer 2023",
          startDate: "2023-07-15",
          status: "Upcoming",
          classes: 2,
          enrolledCount: 15,
        },
      ],
    },
    {
      id: 3,
      title: "Bible Study Methods",
      description: "Learn effective methods for studying and interpreting the Bible",
      eligibility: "both",
      topics: ["Observation", "Interpretation", "Application", "Bible Study Tools"],
      cohorts: [
        {
          id: 301,
          name: "Spring 2023",
          startDate: "2023-05-10",
          status: "Completed",
          classes: 2,
          enrolledCount: 32,
        },
      ],
    },
    {
      id: 4,
      title: "Marriage Enrichment",
      description: "Strengthen your marriage with biblical principles and practical tools",
      eligibility: "non-members",
      topics: ["Communication", "Conflict Resolution", "Intimacy", "Parenting"],
      cohorts: [
        {
          id: 401,
          name: "Fall 2023",
          startDate: "2023-08-05",
          status: "Upcoming",
          classes: 1,
          enrolledCount: 12,
        },
      ],
    },
  ];

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const toggleMenu = (id: number) => {
    setOpenMenuId((prevId) => (prevId === id ? null : id));
  };

  const getEligibilityBadge = (eligibility: Program["eligibility"]): JSX.Element | null => {
    switch (eligibility) {
      case "members":
        return (
          <div className="bg-blue-50 text-xs text-blue-700 rounded-lg py-1 px-2 border border-blue-200">
            Members Only
          </div>
        );
      case "non-members":
        return (
          <div className="bg-red/50 text-xs text-red-700 rounded-lg py-1 px-2 border border-red-200">
            Non-Members Only
          </div>
        );
      case "both":
        return (
          <div className="bg-green/50 text-xs text-green-700 rounded-lg py-1 px-2 border border-green/50">
            Open to All
          </div>
        );
      default:
        return null;
    }
  };

  const getCohortToShow = (cohorts: Cohort[]) => {
    const activeCohort = cohorts.find((cohort) => cohort.status === "Active");
    if (activeCohort) {
      return [activeCohort]; // Show only the active cohort
    }

    const upcomingCohort = cohorts.find((cohort) => cohort.status === "Upcoming");
    if (upcomingCohort) {
      return [upcomingCohort]; // Show only the most immediate upcoming cohort
    }

    return []; // If no active or upcoming, show no cohort
  };

  return (
    <div className="p-4">
      <PageOutline>
        <HeaderControls
          title="Ministry School"
          showSearch={false}
          showFilter={false}
          totalMembers={0}
          btnName="Create program"
        />

        <section className="grid gap-4 xl:grid-cols-3 md:grid-cols-2 xs:grid-cols-2">
          {programs.map((program) => {
            const cohortsToShow = getCohortToShow(program.cohorts);

            return (
              <ProgramsCard
                key={program.id}
                program={program}
                toggleMenu={() => toggleMenu(program.id)}
                isMenuOpen={openMenuId }
                cohorts={cohortsToShow}
              />
            );
          })}
        </section>
      </PageOutline>
    </div>
  );
};

export default MinistrySchool;
