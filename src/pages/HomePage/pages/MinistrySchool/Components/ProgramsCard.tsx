import CardWrappers from "@/Wrappers/CardWrapper";

// Define the Cohort type
interface Cohort {
    id: number;
    name: string;
    startDate: string;
    status: string;
}

// Define the Program type outside the component
interface Program {
    id: number;
    title: string;
    description: string;
    eligibility: "members" | "non-members" | "both";
    topics: string[];
    cohorts: Cohort[];
}

interface ProgramsCardProps {
    program: Program;
    toggleMenu: (id: number) => void;
    isMenuOpen: number | null;
    cohorts: Cohort[];
}

interface EligibilityBadgeProps {
    eligibility: Program["eligibility"];
}

const ProgramsCard = ({ program, toggleMenu, isMenuOpen, cohorts }: ProgramsCardProps) => {
    const getEligibilityBadge = ({ eligibility }: EligibilityBadgeProps): JSX.Element | null => {
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

    return (
        <CardWrappers key={program.id} className={"border border-1 border-lightGray p-4 rounded-lg space-y-3 text-dark900"}>
                        <div className="flex justify-between gap-2">
                          <div className="text-lg font-semibold">{program.title}</div>
                          <div>{getEligibilityBadge({ eligibility: program.eligibility })}</div>
                        </div>
        
                        {/* Description */}
                        <div>
                          <p className="text-sm">{program.description}</p>
                        </div>
        
                        {/* Topics */}
                        <div className="space-y-1">
                          <div>
                            <p className="text-sm font-semibold">Topics</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {program.topics.map((topic: string, index: number) => (
                              <p key={index} className="text-sm py-1 px-2 border border-lightGray rounded-lg bg-lightGray/50">
                              {topic}
                              </p>
                            ))}
                          </div>
                        </div>
        
                        {/* Cohorts */}
                        {cohorts.length > 0 && (
                          <div>
                            <div className="text-sm font-semibold">Cohorts</div>
                            <div>
                              {cohorts.map((cohort) => (
                                <div key={cohort.id} className="border border-1 border-lightGray rounded-lg p-2 space-y-2">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <div className="font-medium">{cohort.name}</div>
                                      <div className="text-sm">
                                        <p>{cohort.startDate}</p>
                                      </div>
                                    </div>
                                    <div className="text-sm bg-primary text-white py-1 px-2 rounded-lg border border-lightGray">
                                      {cohort.status}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
        
                        <div>
                          <hr className="text-lightGray my-4" />
                        </div>
        
                        {/* Actions */}
                        <div className="flex justify-between items-center">
                          <div>
                            <button 
                                className="text-primary" 
                                onClick={() => window.location.href = `ministry-school/${program.id}`}
                            >
                                Manage
                            </button>
                          </div>
                          <div>
                            <div className="relative">
                              <button className="text-primary" onClick={() => toggleMenu(program.id)}>
                                Menu
                              </button>
                              {isMenuOpen === program.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-lightGray rounded-lg shadow-lg">
                                  <ul className="py-1">
                                    <li className="px-4 py-2 hover:bg-lightGray cursor-pointer">Edit Program</li>
                                    <li className="px-4 py-2 hover:bg-lightGray cursor-pointer">Add Cohort</li>
                                    <li className="px-4 py-2 hover:bg-lightGray cursor-pointer">Copy Application Link</li>
                                    <li className="px-4 py-2 hover:bg-lightGray cursor-pointer">View Application Page</li>
                                    <hr className="text-lightGray" />
                                    <li className="px-4 py-2 hover:bg-lightGray cursor-pointer text-red-600">Delete Program</li>
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardWrappers>
    );
};
 
export default ProgramsCard
