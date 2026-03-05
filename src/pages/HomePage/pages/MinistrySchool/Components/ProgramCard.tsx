import ellipse from "@/assets/ellipse.svg";
import { Button } from "@/components";
import { useRouteAccess } from "@/context/RouteAccessContext";
import { CohortType, ProgramResponse, relativePath } from "@/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ProgramBaseCard } from "./ProgramBaseCard";

interface IProps {
  program: Partial<ProgramResponse>;
  cohorts?: CohortType[];
  onEdit: () => void;
  onDelete: () => void;
}

export const ProgramsCard = ({
  program,
  cohorts = [],
  onEdit,
  onDelete,
}: IProps) => {
  const MENU_WIDTH = 224;
  const MENU_GAP = 8;
  const { canManageCurrentRoute } = useRouteAccess();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const resolveMenuHeight = useCallback(() => {
    const hasApplicationItem = cohorts.length > 0;
    return hasApplicationItem ? 180 : 140;
  }, [cohorts.length]);

  const positionMenu = useCallback(() => {
    if (!triggerRef.current) return;

    const triggerBounds = triggerRef.current.getBoundingClientRect();
    const menuHeight = resolveMenuHeight();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = triggerBounds.bottom + MENU_GAP;
    if (top + menuHeight > viewportHeight - MENU_GAP) {
      top = Math.max(MENU_GAP, triggerBounds.top - menuHeight - MENU_GAP);
    }

    let left = triggerBounds.right - MENU_WIDTH;
    if (left < MENU_GAP) {
      left = MENU_GAP;
    }
    if (left + MENU_WIDTH > viewportWidth - MENU_GAP) {
      left = Math.max(MENU_GAP, viewportWidth - MENU_WIDTH - MENU_GAP);
    }

    setMenuPosition({ top, left });
  }, [resolveMenuHeight]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedInsideMenu = menuRef.current?.contains(target);
      const clickedTrigger = triggerRef.current?.contains(target);
      if (!clickedInsideMenu && !clickedTrigger) setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    positionMenu();

    const handleReposition = () => positionMenu();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [isMenuOpen, positionMenu]);

  const openApplicationPage = () => {
    if (!program.title) return;
    window.open(`/out/programs/${program.title}`, "_blank");
  };

  const handleManageProgram = () => {
    if (!program.id) return;
    navigate(`${relativePath.home.ministrySchool.program}/${program.id}`);
  };

  const renderMenu = () => {
    if (!canManageCurrentRoute || !isMenuOpen) return null;

    return createPortal(
      <div
        ref={menuRef}
        className="fixed z-[70] w-56 rounded-lg border border-lightGray bg-white shadow-lg"
        style={{ top: menuPosition.top, left: menuPosition.left }}
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
          {cohorts.length > 0 && (
            <li>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-lightGray/30"
                onClick={() => {
                  openApplicationPage();
                  setIsMenuOpen(false);
                }}
              >
                View Application Page
              </button>
            </li>
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
      </div>,
      document.body
    );
  };

  return (
    <ProgramBaseCard program={program} cohorts={cohorts}>
      <div className="flex items-center gap-2">
        <Button
          onClick={handleManageProgram}
          value="Manage"
          variant="primary"
          className="flex-1 w-full"
          disabled={!program.id}
        />
        {/* {cohorts.length > 0 && (
          <Button
            onClick={openApplicationPage}
            value="Application"
            variant="secondary"
            className="hidden md:inline-flex"
          />
        )} */}

        <div className="relative" ref={menuRef}>
          {canManageCurrentRoute && (
            <button
              ref={triggerRef}
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-lightGray bg-white p-2 hover:bg-lightGray/30 transition-colors"
              onClick={() => {
                if (!isMenuOpen) positionMenu();
                setIsMenuOpen((prev) => !prev);
              }}
              aria-label="Program options"
              aria-expanded={isMenuOpen}
              aria-haspopup="true"
            >
              <img src={ellipse} alt="" className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      {renderMenu()}
    </ProgramBaseCard>
  );
};
