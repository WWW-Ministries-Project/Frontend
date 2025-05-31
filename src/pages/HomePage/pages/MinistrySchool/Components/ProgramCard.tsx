import ellipse from "@/assets/ellipse.svg";
import { Button } from "@/components";
import { Cohort, ProgramResponse, relativePath } from "@/utils";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProgramBaseCard } from "./ProgramBaseCard";

interface IProps {
  program: Partial<ProgramResponse>;
  cohorts?: Cohort[];
  handleCopyLink: (id?: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const ProgramsCardManagement = ({
  program,
  cohorts = [],
  handleCopyLink,
  onEdit,
  onDelete,
}: IProps) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <ProgramBaseCard program={program} cohorts={cohorts}>
      <div className="flex justify-between items-center pt-2">
        <Button
        //   onClick={() => navigate(`programs/${program.id}`)}
          onClick={() => navigate(`${relativePath.home.ministrySchool.program}/${program.id}`)}
          value="Manage"
          variant="primary"
        />

        <div className="relative" ref={menuRef}>
          <button
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            onClick={() => setIsMenuOpen((prev) => !prev)}
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
            >
              <ul className="py-1">
                <li>
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-lightGray/30"
                    onClick={() => {
                      onEdit();
                      setIsMenuOpen(false);
                    }}
                  >
                    Edit Program
                  </button>
                </li>
                <li>
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-lightGray/30"
                    onClick={() => {
                      navigate(`programs/${program.id}/add-cohort`);
                      setIsMenuOpen(false);
                    }}
                  >
                    Add Cohort
                  </button>
                </li>
                {cohorts.length > 0 && (
                  <>
                    {" "}
                    <li>
                      <button
                        className="w-full text-left px-4 py-2 text-sm hover:bg-lightGray/30"
                        onClick={() => {
                          handleCopyLink(program.id);
                          setIsMenuOpen(false);
                        }}
                      >
                        Copy Application Link
                      </button>
                    </li>
                    <li>
                      <button
                        className="w-full text-left px-4 py-2 text-sm hover:bg-lightGray/30"
                        onClick={() => {
                          window.open(
                            `/out/programs/${program.title}`,
                            "_blank"
                          );
                          setIsMenuOpen(false);
                        }}
                      >
                        View Application Page
                      </button>
                    </li>
                  </>
                )}
                <hr className="my-1 border-lightGray" />
                <li>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    onClick={() => {
                      onDelete?.();
                      setIsMenuOpen(false);
                    }}
                  >
                    Delete Program
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </ProgramBaseCard>
  );
};
