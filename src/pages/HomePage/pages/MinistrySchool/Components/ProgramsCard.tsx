import CardWrappers from "@/Wrappers/CardWrapper";
import ellipse from "@/assets/ellipse.svg";
import Badge from "@/components/Badge";
import { Button } from "@/components";
import { formatDate } from "@/utils/helperFunctions";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// Define the Cohort type
interface Cohort {
  id: number;
  name: string;
  startDate: string;
  status: string;
}

// Define the Program type
interface Program {
  id: number;
  title: string;
  description: string;
  eligibility: "Members" | "Non_Members" | "Both";
  topics: { name: string }[];
  cohorts: Cohort[];
}

interface ProgramsCardProps {
  program: Program;
  cohorts?: Cohort[];
  handleCopyLink?: (programId: number) => void;
  onOpen?: () => void;
  onDelete?: () => void;
  applyCard?: boolean;
}

interface EligibilityBadgeProps {
  eligibility: Program["eligibility"];
}

const ProgramsCard = ({
  program,
  cohorts = [],
  handleCopyLink,
  onOpen,
  onDelete,
  applyCard = false,
}: ProgramsCardProps) => {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Close menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Toggle menu
  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };

  const getEligibilityBadge = ({ eligibility }: EligibilityBadgeProps): JSX.Element => {
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
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <CardWrappers
      className="border border-lightGray rounded-lg p-6 flex flex-col gap-4 text-primary transition-shadow hover:shadow-md"
    >
      <div>
        {/* Header: Title and Eligibility */}
      <div className="flex justify-between items-start gap-3">
        <h3 className={`${applyCard?"text-2xl font-semibold":"text-lg font-semibold line-clamp-2"}`}>{program.title}</h3>
        {!applyCard&&getEligibilityBadge({ eligibility: program.eligibility })}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-700 line-clamp-3">{program.description}</p>
      </div>

      {/* Topics */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Topics</h4>
        <div className="flex flex-wrap gap-2">
          {program?.topics?.map((topic, index) => (
            <span
              key={index}
              className="text-xs py-1 px-3 border border-lightGray rounded-full bg-lightGray/30"
            >
              {topic.name}
            </span>
          ))}
        </div>
      </div>

      {!applyCard&&<hr className="border-lightGray" />}

      {/* Cohorts */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Cohorts</h4>
        <div className="space-y-2">
          {cohorts.length > 0 ? (
            cohorts.map((cohort) => (
              <div
                key={cohort.id}
                className="border border-lightGray rounded-lg p-3 transition-colors hover:bg-gray-50"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{cohort.name}</div>
                    <div className="text-xs text-gray-600">
                      {formatDate(cohort.startDate)}
                    </div>
                  </div>
                  <Badge 
                    className={`text-xs px-3 py-1 ${
                      cohort.status === "Active" 
                        ? "bg-green-50 text-green-700 border-green-200" 
                        : cohort.status === "Completed"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                    }`}
                  >
                    {cohort.status}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="border border-dashed border-lightGray rounded-lg p-4 text-center text-gray-500 text-sm">
              No cohorts added yet
            </div>
          )}
        </div>
      </div>
      

      <div className="flex-grow" />
      {!applyCard&&<hr className="my-0 w-[calc(100%+32px)] -mx-4 border-t-1 border-lightGray" />}

      {/* Actions */}
      {
      applyCard?<div className="flex justify-between items-center pt-2">
      <Button
        onClick={() => navigate(`${program.title}`)}
        value="Apply"
        className="bg-primary text-white px-6 py-2 w-full hover:bg-primary/90 transition-colors"
      />
      </div>
       :
       <div className="flex justify-between items-center pt-2">
       <Button
         onClick={() => navigate(`programs/${program.id}`)}
         value="Manage"
         className="bg-primary text-white px-6 py-2 hover:bg-primary/90 transition-colors"
       />
       
       <div className="relative" ref={menuRef}>
         <button
           className="p-2 rounded-full hover:bg-gray-100 transition-colors"
           onClick={toggleMenu}
           aria-label="Program options"
           aria-expanded={isMenuOpen}
           aria-haspopup="true"
         >
           <img src={ellipse} alt="" className="w-5 h-5" />
         </button>
         
         {isMenuOpen && (
           <div 
             className="absolute right-0 mt-2 w-56 bg-white border border-lightGray rounded-lg shadow-lg z-10"
             role="menu"
             aria-orientation="vertical"
           >
             <ul className="py-1">
               <li>
                 <button
                   className="w-full text-left px-4 py-2 text-sm hover:bg-lightGray/30 transition-colors"
                   onClick={() => {
                     onOpen?.();
                     setIsMenuOpen(false);
                   }}
                   role="menuitem"
                 >
                   Edit Program
                 </button>
               </li>
               <li>
                 <button
                   className="w-full text-left px-4 py-2 text-sm hover:bg-lightGray/30 transition-colors"
                   onClick={() => {
                     navigate(`programs/${program.id}/add-cohort`);
                     setIsMenuOpen(false);
                   }}
                   role="menuitem"
                 >
                   Add Cohort
                 </button>
               </li>
               <li>
                 <button
                   className="w-full text-left px-4 py-2 text-sm hover:bg-lightGray/30 transition-colors"
                   onClick={() => {
                     handleCopyLink?.(program.id);
                     setIsMenuOpen(false);
                   }}
                   role="menuitem"
                 >
                   Copy Application Link
                 </button>
               </li>
               <li>
                 <button
                   className="w-full text-left px-4 py-2 text-sm hover:bg-lightGray/30 transition-colors"
                   onClick={() => {
                     window.open(`/programs/apply/${program.id}`, "_blank");
                     setIsMenuOpen(false);
                   }}
                   role="menuitem"
                 >
                   View Application Page
                 </button>
               </li>
               <hr className="my-1 border-lightGray" />
               <li>
                 <button
                   className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                   onClick={() => {
                     onDelete?.();
                     setIsMenuOpen(false);
                   }}
                   role="menuitem"
                 >
                   Delete Program
                 </button>
               </li>
             </ul>
           </div>
         )}
       </div>
     </div>
      }
    </CardWrappers>
  );
};

export default ProgramsCard;