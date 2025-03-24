import { useEffect, useRef, useState } from "react";
import CardWrappers from "@/Wrappers/CardWrapper";
import ellipse from "@/assets/ellipse.svg";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import { useNavigate } from "react-router-dom";
import { formatTime } from "@/utils/helperFunctions";

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
  eligibility: "Members" | "Non_Members" | "Both";
  topics: string[];
  cohorts: Cohort[];
}

interface ProgramsCardProps {
  program: Program;
  cohorts: Cohort[];
  handleCopyLink: (programId: number) => void;
  toggleMenu: () => void;
  isMenuOpen: number | null; // Added isMenuOpen prop
}

interface EligibilityBadgeProps {
  eligibility: Program["eligibility"];
}

const ProgramsCard = ({
  program,
  cohorts,
  handleCopyLink,
}: ProgramsCardProps) => {
  const navigate = useNavigate();

  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<number | null>(null);

  // Close menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(null); // Close the menu
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Function to toggle the menu when the ellipsis button is clicked
  const toggleMenu = (id: number) => {
    if (isMenuOpen === id) {
      setIsMenuOpen(null); // If the menu is already open, close it
    } else {
      setIsMenuOpen(id); // Otherwise, open it for the clicked program
    }
  };

  const getEligibilityBadge = ({ eligibility }: EligibilityBadgeProps): JSX.Element | null => {
    switch (eligibility) {
      case "Members":
        return <Badge>Members Only</Badge>;
      case "Non_Members":
        return (
          <Badge className="bg-red-50 text-xs text-red-700 border border-red-200">
            Non Members Only
          </Badge>
        );
      case "Both":
        return (
          <Badge className="bg-green/10 text-xs text-green-700 border border-green/50">
            Open to All
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <CardWrappers key={program.id} className={"border border-1 border-lightGray p-4 rounded-lg space-y-3 text-dark900 flex flex-col"}>
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
              {topic.name}
            </p>
          ))}
        </div>
      </div>

      {/* Cohorts */}
      {/* {cohorts.length > 0 && ( */}
        <div>
          <div className="text-sm font-semibold">Cohorts</div>
          <div>
            {cohorts.length > 0 && cohorts.map((cohort) => (
              <div key={cohort.id} className="border border-1 border-lightGray/50 rounded-lg p-2 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{cohort.name}</div>
                    <div className="text-sm">
                      <p>{formatTime(cohort.startDate)}</p>
                    </div>
                  </div>
                  <Badge className="text-sm bg-primary/10 text-primary border border-lightGray">{cohort.status}</Badge>
                </div>
              </div>
            ))}
            {cohorts.length === 0 && <div className="border border-1 border-lightGray/50 rounded-lg px-2 py-4 space-y-2">
              No cohort added yet
            </div>
            }
          </div>
        </div>
      {/* )} */}
      <div className="flex-grow" />

      <div>
        <hr className="text-lightGray/50  " />
      </div>
      

      {/* Actions */}
      <div className=" flex justify-between items-center">
        <div>
          <Button onClick={() => navigate(`programs?program=${program.id}`)} value="Manage" className="bg-primary text-white px-4" />
        </div>
        <div>
          <div className="relative" ref={menuRef}>
            <button className="text-primary" onClick={() => toggleMenu(program.id)}>
              <img src={ellipse} alt="options" className="cursor-pointer" />
            </button>
            {isMenuOpen === program.id && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-lightGray rounded-lg shadow-lg">
                <ul className="py-1">
                  <li className="px-4 py-2 hover:bg-lightGray cursor-pointer">Edit Program</li>
                  <li className="px-4 py-2 hover:bg-lightGray cursor-pointer">Add Cohort</li>
                  <li onClick={() => handleCopyLink(program.id)} className="px-4 py-2 hover:bg-lightGray cursor-pointer">
                    Copy Application Link
                  </li>
                  <li onClick={() => window.open(`/programs/apply/${program.id}`, "_blank")} className="px-4 py-2 hover:bg-lightGray cursor-pointer">
                    View Application Page
                  </li>
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

export default ProgramsCard;
