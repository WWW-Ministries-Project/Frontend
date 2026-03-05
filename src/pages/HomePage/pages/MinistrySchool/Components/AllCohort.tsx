const isPastDate = (date: string | Date) => {
  return new Date(date).getTime() < new Date().setHours(0, 0, 0, 0);
};
import ellipse from "@/assets/ellipse.svg";
import { Button } from "@/components";
import { Badge } from "@/components/Badge";
import { useRouteAccess } from "@/context/RouteAccessContext";
import EmptyState from "@/components/EmptyState";
import {
  COHORT_STATUS,
  getCohortStatusLabel,
  normalizeCohortStatus,
  type CohortType,
} from "@/utils";
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
  const { canManageCurrentRoute } = useRouteAccess();
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
        <section className=" space-y-2 rounded-t-lg mb-4">
          <div className=" flex justify-between items-center">
            <div className="">
              <h1 className="text-primary text-2xl font-bold">Cohort Management</h1>
            </div>

            <div>
              <Button
                value="Add Cohort"
                className="p-2 m-1 text-white min-h-10 max-h-14 bg-primary"
                onClick={onCreate}
                disabled={!canManageCurrentRoute}
              />
            </div>
          </div>
        </section>

        {cohorts.length === 0 ? (
            <EmptyState scope="section" msg={"No cohort found"} />
        ) : (
          <section className="w-full">
            <div className="grid grid-cols-6 gap-4 font-semibold text-primaryGray px-4 py-3 mb-4">
              <div>Name</div>
              <div>Start date</div>
              <div>Duration</div>
              <div>Application Deadline</div>
              <div>Status</div>
              <div className="text-center">
                {/* Actions */}
                </div>
            </div>
            <div className=" text-primary">
              <div className="space-y-3">
                {cohorts?.map((cohort) => {
                  const normalizedStatus = normalizeCohortStatus(cohort.status);
                  const statusLabel = getCohortStatusLabel(cohort.status);
                  const statusClass =
                    normalizedStatus === COHORT_STATUS.ONGOING
                      ? "bg-primary/20 text-primary"
                      : normalizedStatus === COHORT_STATUS.COMPLETED
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-primary";

                  return (
                    <div
                      key={cohort.id}
                      className="border border-lightGray rounded-lg p-4 space-y-3"
                    >
                      <div className="grid grid-cols-6 gap-4 items-center">
                        <div
                          className="font-semibold text-lg truncate cursor-pointer"
                          onClick={() => navigate(`cohort/${cohort.id}`)}
                        >
                          {cohort?.name}
                        </div>

                        <p>{formatDate(cohort.startDate)}</p>
                        <p>{cohort.duration}</p>
                        {isPastDate(cohort.applicationDeadline) &&
                        normalizedStatus === COHORT_STATUS.ONGOING ? (
                          <Badge className="bg-red-100 text-red-600 text-xs">
                            Application Closed
                          </Badge>
                        ) : (
                          <p>{formatDate(cohort.applicationDeadline)}</p>
                        )}
                        <Badge className={`text-xs border-lightGray ${statusClass}`}>
                          {statusLabel}
                        </Badge>

                        <div className="relative flex justify-end gap-2">
                          {canManageCurrentRoute && (
                            <button
                              ref={buttonRef}
                              className="text-primary"
                              onClick={() => toggleMenu(cohort.id)}
                            >
                              <img
                                src={ellipse}
                                alt="options"
                                className="cursor-pointer"
                              />
                            </button>
                          )}
                          {canManageCurrentRoute && isMenuOpen === cohort.id && (
                            <div
                              ref={menuRef}
                              className="absolute right-0 bottom-0 mt-2 w-48 bg-white border border-lightGray rounded-lg shadow-lg"
                            >
                              <ul className="py-1">
                                <li
                                  className="px-4 py-2 hover:bg-lightGray cursor-pointer"
                                  onClick={() => navigate(`cohort/${cohort.id}`)}
                                >
                                  Manage Cohort
                                </li>
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
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
