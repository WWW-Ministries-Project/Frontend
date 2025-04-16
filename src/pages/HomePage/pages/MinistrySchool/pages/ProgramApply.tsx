import ChurchLogo from "@/components/ChurchLogo";
import ProgramsCard from "../Components/ProgramsCard";

// Sample data for programs
const programs = [
    {
        id: 1,
        title: "Biblical Leadership",
        description: "A comprehensive program on biblical principles of leadership",
        eligibility: "Both",
        topics: [
            {
                "id": 28,
                "name": "Introduction",
                "programId": 10
            },
            {
                "id": 29,
                "name": "Creation Order",
                "programId": 10
            }
        ],
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
        eligibility: "Members",
        topics: [
            {
                "id": 28,
                "name": "Introduction",
                "programId": 10
            },
            {
                "id": 29,
                "name": "Creation Order",
                "programId": 10
            }
        ],
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
        eligibility: "Both",
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
        eligibility: "Non_Members",
        topics: [
            {
                "id": 28,
                "name": "Introduction",
                "programId": 10
            },
            {
                "id": 29,
                "name": "Creation Order",
                "programId": 10
            }
        ],
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
    {
        id: 2,
        title: "Discipleship Training",
        description: "Learn how to effectively disciple others in their faith journey",
        eligibility: "Members",
        topics: [
            {
                "id": 28,
                "name": "Introduction",
                "programId": 10
            },
            {
                "id": 29,
                "name": "Creation Order",
                "programId": 10
            }
        ],
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
        id: 2,
        title: "Discipleship Training",
        description: "Learn how to effectively disciple others in their faith journey",
        eligibility: "Members",
        topics: [
            {
                "id": 28,
                "name": "Introduction",
                "programId": 10
            },
            {
                "id": 29,
                "name": "Creation Order",
                "programId": 10
            }
        ],
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
];

// Define the Cohort type
interface Cohort {
    id: number;
    name: string;
    startDate: string;
    status: string;
    classes: number;
    enrolledCount: number;
}

const ProgramApply = () => {
    const getCohortToShow = (cohorts: Cohort[]): Cohort[] => {
        const activeCohort = cohorts.find((cohort) => cohort.status === "Active");
        if (activeCohort) {
            return [activeCohort]; // Return the Active cohort
        }

        const upcomingCohort = cohorts.find((cohort) => cohort.status === "Upcoming");
        if (upcomingCohort) {
            return [upcomingCohort]; // Return the Upcoming cohort if no Active cohort
        }

        return []; // Return an empty array if neither Active nor Upcoming cohort exists
    };

    return (
    
                <div className=" w-full  flex flex-col items-center  mx-auto  overflow-auto">
                <div className="flex flex-col items-center mb-8">
                <h2 className="text-6xl font-bold mb-4 text-white">School of Ministry</h2>
                <p className="text-2xl mb-4 text-white text-center line-clamp-3">
                Equipping believers with biblical knowledge and practical skills for <br/> effective ministry
                </p>
                </div>
                <div className="grid grid-cols-3 gap-8 w-full max-w-6xl">
                    {programs
                        .filter((program) => program.cohorts.length > 0) // Only programs with cohorts
                        .map((program) => {
                            const cohortsToShow = getCohortToShow(program.cohorts);
                            return (
                                cohortsToShow.length > 0 && (
                                    <ProgramsCard
                                        key={program.id}
                                        program={program}
                                        toggleMenu={() => {}}
                                        isMenuOpen={null}
                                        cohorts={cohortsToShow}
                                        handleCopyLink={() => {}}
                                        applyCard = {true}
                                    />
                                )
                            );
                        })}
                    
                </div>
                </div>
 
    );
};

export default ProgramApply;
