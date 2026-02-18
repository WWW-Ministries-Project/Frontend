import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { cn } from "@/utils/cn";
import { BreadcrumbItem } from "./BreadCrumb";

interface PageOutlineProps {
  children: ReactNode;
  className?: string;
  crumbs?: BreadcrumbItem[];
}

const PageOutline = ({
  children,
  className,
  crumbs,
}: PageOutlineProps): JSX.Element => {
  const navigate = useNavigate();

  const handleCrumbClick = (link?: BreadcrumbItem["link"]) => {
    if (!link) return;
    if (typeof link === "function") {
      link();
      return;
    }
    navigate(link);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {crumbs && crumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="app-page-padding flex-shrink-0 border-b border-lightGray"
        >
          <ol className="flex flex-wrap items-center gap-2 text-xs text-primaryGray md:text-sm">
            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1;
              return (
                <li key={`${crumb.label}-${index}`} className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!crumb.link || isLast}
                    onClick={() => handleCrumbClick(crumb.link)}
                    className={cn(
                      "transition-colors",
                      isLast
                        ? "cursor-default font-semibold text-primary"
                        : "hover:text-primary"
                    )}
                  >
                    {crumb.label}
                  </button>
                  {!isLast && <span className="text-primaryGray/60">/</span>}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      <section
        role="main"
        className={cn(
          "app-page-content app-page-padding app-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto rounded-xl",
          className
        )}
      >
        {children}
      </section>
    </div>
  );
};

export default PageOutline;
