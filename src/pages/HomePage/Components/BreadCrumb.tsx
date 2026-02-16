import { routes } from "@/routes/appRoutes";
import React from "react";
import { useLocation, useNavigate, matchRoutes } from "react-router-dom";


// Types
export type BreadcrumbLink = string | (() => void);

export interface BreadcrumbItem {
  label: string;
  link?: BreadcrumbLink;
  icon?: React.ReactNode;
}

export interface AutoBreadcrumbProps {
  separator?: React.ReactNode;
  className?: string;
  navClassName?: string;
  itemClassName?: string;
  activeItemClassName?: string;
  separatorClassName?: string;
  onNavigate?: (link: BreadcrumbLink) => void;
  maxItems?: number;
  ariaLabel?: string;
}

// Default separator component
const DefaultSeparator = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M6 12L10 8L6 4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const AutoBreadcrumb: React.FC<AutoBreadcrumbProps> = ({
  separator = <DefaultSeparator />,
  className = "",
  navClassName = "",
  itemClassName = "",
  activeItemClassName = "",
  separatorClassName = "",
  onNavigate,
  maxItems,
  ariaLabel = "breadcrumb",
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleClick = (link: BreadcrumbLink) => {
    if (onNavigate) {
      onNavigate(link);
      return;
    }

    if (typeof link === "string") {
      navigate(link);
    } else if (typeof link === "function") {
      link();
    }
  };

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const matches = matchRoutes(routes as any, location);
    if (!matches) return [];

    type NamedRoute = { name?: string };

    // Only include routes that actually contribute to navigation meaning
    const namedMatches = matches.filter(
      (m) => (m.route as NamedRoute)?.name && m.pathname !== undefined
    );

    return namedMatches.map((match, index) => {
      const isLast = index === namedMatches.length - 1;
      const route = match.route as NamedRoute;

      return {
        label: route.name || "",
        link: isLast ? undefined : match.pathname,
      };
    });
  };

  const items = generateBreadcrumbs();

  // Handle maxItems truncation
  let displayItems = items;
  if (maxItems && items.length > maxItems) {
    const firstItem = items[0];
    const lastItems = items.slice(-(maxItems - 1));
    displayItems = [
      firstItem,
      { label: "...", link: undefined },
      ...lastItems,
    ];
  }

  if (displayItems.length === 0) return null;

  return (
    <div className={`py-2 ${className}`}>
      <nav aria-label={ariaLabel} className={`px-5 rounded ${navClassName}`}>
        <ol className="flex space-x-2 items-center">
          {displayItems.map((item, index) => {
            const isLast = index === displayItems.length - 1;
            const isEllipsis = item.label === "...";

            return (
              <React.Fragment key={`${item.label}-${index}`}>
                {index > 0 && (
                  <li
                    className={`flex items-center ${separatorClassName}`}
                    aria-hidden="true"
                  >
                    {separator}
                  </li>
                )}
                {isLast ? (
                  <li
                    className={`font-bold ${activeItemClassName} ${itemClassName}`}
                    aria-current="page"
                  >
                    {item.icon && (
                      <span className="inline-flex items-center mr-1">
                        {item.icon}
                      </span>
                    )}
                    {item.label}
                  </li>
                ) : (
                  <li className={itemClassName}>
                    {item.link !== undefined && !isEllipsis ? (
                      <button
                        type="button"
                        className="hover:font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded transition-all inline-flex items-center"
                        onClick={() => handleClick(item.link!)}
                        aria-label={`Navigate to ${item.label}`}
                      >
                        {item.icon && (
                          <span className="inline-flex items-center mr-1">
                            {item.icon}
                          </span>
                        )}
                        {item.label}
                      </button>
                    ) : (
                      <span className="inline-flex items-center">
                        {item.icon && !isEllipsis && (
                          <span className="inline-flex items-center mr-1">
                            {item.icon}
                          </span>
                        )}
                        {item.label}
                      </span>
                    )}
                  </li>
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};

export default AutoBreadcrumb;
