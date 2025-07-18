import ellipse from "@/assets/ellipse.svg";
import { Button } from "@/components";
import { Badge } from "@/components/Badge";
import EmptyState from "@/components/EmptyState";
import type { CohortType } from "@/utils";
import { formatDate } from "@/utils/helperFunctions";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

interface IProps {
  onCreate: () => void;
  cohorts: CohortType[];
  onEdit: (cohort: CohortType) => void; 
  onDelete: (id: number) => void;
}

export const AllCohorts = ({ onCreate, cohorts, onEdit, onDelete }: IProps) => {
  const navigate = useNavigate();

  const menuRef = useRef<HTMLDivElement | null>(null); // Reference for the menu container
  const buttonRef = useRef<HTMLButtonElement | null>(null); // Reference for the button that toggles the menu
  const [isMenuOpen, setIsMenuOpen] = useState<number | null>(null); // State to track which menu is open

  const toggleMenu = (id: number) => {
    if (isMenuOpen === id) {
      setIsMenuOpen(null); // Close the menu if it's already open
    } else {
      setIsMenuOpen(id); // Open the clicked menu
    }
  };

  const handleEdit = (cohort: CohortType) => {
    onEdit(cohort);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is outside the menu container and the button
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(null); // Close the menu if clicked outside
      }
    };

    // Add event listener when component mounts
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup event listener when component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="">
      <div className="p-0">
        <section className="py-4 space-y-2 rounded-t-lg">
          <div className=" flex justify-between">
            <div className="">
              <h1 className="text-primary text-2xl font-bold">All Cohorts</h1>
            </div>

            <div>
              <Button
                value="Add Cohort"
                className="p-2 m-1 text-white min-h-10 max-h-14 bg-primary"
                onClick={onCreate}
              />
            </div>
          </div>
        </section>

        {cohorts.length === 0 ? (
            <EmptyState msg={"No cohort found"} />
        ) : (
          <section className="">
            <div className=" text-primary">
              <div className="grid gap-4 lg:grid-cols-3 md:grid-cols-2">
                {cohorts?.map((cohort) => (
                  <div
                    key={cohort.id}
                    className="border border-lightGray rounded-lg p-4 space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-lg">
                        {cohort?.name}
                      </div>
                      <Badge
                        className={`text-xs border-lightGray ${
                          cohort?.status === "Active"
                            ? "bg-primary/20 text-primary"
                            : "bg-yellow-100 text-primary"
                        }`}
                      >
                        {cohort.status}
                      </Badge>
                    </div>
                    <div className="text-md space-y-1">
                      <p>
                        <span className="font-semibold">Start Date:</span>{" "}
                        {formatDate(cohort.startDate)}
                      </p>
                      <p>
                        <span className="font-semibold">Duration:</span>{" "}
                        {cohort.duration}
                      </p>
                      <p>
                        <span className="font-semibold">
                          Application Deadline:
                        </span>{" "}
                        {formatDate(cohort.applicationDeadline)}
                      </p>
                    </div>

                    <div className="flex justify-between items-center">
                      <Button
                        value="Manage Cohort"
                        className="p-2 m-1 text-white min-h-10 max-h-14 bg-primary"
                        onClick={() => navigate(`cohort/${cohort.id}`)}
                      />
                      <div className="relative">
                        <button
                          ref={buttonRef} // Reference to the button
                          className="text-primary"
                          onClick={() => toggleMenu(cohort.id)}
                        >
                          <img
                            src={ellipse}
                            alt="options"
                            className="cursor-pointer"
                          />
                        </button>
                        {isMenuOpen === cohort.id && (
                          <div
                            ref={menuRef}
                            className="absolute right-0 bottom-0 mt-2 w-48 bg-white border border-lightGray rounded-lg shadow-lg"
                          >
                            <ul className="py-1">
                              <li
                                className="px-4 py-2 hover:bg-lightGray cursor-pointer"
                                onClick={() => handleEdit(cohort)}
                              >
                                Edit Cohort
                              </li>

                              <hr className="text-lightGray" />
                              <li
                                onClick={() => onDelete(cohort.id)}
                                className="px-4 py-2 cursor-pointer text-red-600 hover:bg-red-50"
                              >
                                Delete Cohort
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
