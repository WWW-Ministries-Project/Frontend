import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

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

// Route labels mapping - matches your application structure
const routeLabels: Record<string, string> = {
  // Home routes
  "/home": "Home",
  "/home/dashboard": "Dashboard",
  
  // Members
  "/home/members": "Members",
  "/home/members/manage-member": "Manage Member",
  
  // Visitors
  "/home/visitors": "Visitors",
  "/home/visitors/visitor": "Visitor Details",
  
  // Events
  "/home/events": "Events",
  "/home/events/all-events": "All Events",
  "/home/events/events": "Events Schedule",
  "/home/manage-event": "Manage Event",
  "/home/events/events/view-event": "View Event",
  
  // Assets
  "/home/assets": "Assets",
  "/home/assets/manage-asset": "Manage Asset",
  
  // Users
  "/home/users": "Users",
  
  // Life Centers
  "/home/life-centers": "Life Centers",
  "/home/life-centers/roles": "Life Center Roles",
  "/home/life-centers/life-center-analytics": "Life Centers Analytics",
  "/home/life-centers/life-center": "Life Center Details",
  
  // Market Place
  "/home/market-place": "Market Place",
  "/home/market-place/create-product": "Add Product",
  "/home/market-place/edit-product": "Edit Product",
  
  // Ministry School
  "/home/ministry-school": "School of Ministry",
  "/home/ministry-school/programs": "Programs",
  "/home/ministry-school/programs/topic": "Topic",
  "/home/ministry-school/programs/cohort": "Cohort",
  "/home/ministry-school/programs/cohort/class": "Class",
  
  // Settings
  "/home/settings": "Settings",
  "/home/settings/access-rights": "Access Rights",
  "/home/settings/access-rights/manage-access": "Manage Access",
  
  // Member routes
  "/member": "Member Portal",
  "/member/dashboard": "Dashboard",
  "/member/market": "Market",
  "/member/market/product": "Product Details",
  "/member/market/carts": "Shopping Cart",
  "/member/market/check-out": "Checkout",
  "/member/market/orders": "My Orders",
  "/member/market/verify_payment": "Verify Payment",
  "/member/life-center": "My Life Center",
  "/member/school-of-ministries": "School of Ministries",
  "/member/school-of-ministries/programs": "All Programs",
  "/member/school-of-ministries/programs/my-enrolled-programs": "My Learning",
  "/member/school-of-ministries/programs/instructor-portal": "Instructor Portal",
  
  // Out routes (public)
  "/out/programs": "Programs",
  "/out/register-member": "Member Registration",
  "/out/register-visitor": "Visitor Registration",
  "/out/events/register-event": "Event Registration",
  "/out/products": "Products",
  "/out/products/check-out": "Checkout",
  "/out/verify-payment": "Verify Payment",
};

// Routes to skip in breadcrumbs (intermediate routes without pages)
const skipPaths = [
  "/home/events", // Parent route with no element
  "/home/ministry-school/programs", // Intermediate route
];

// Helper function to check if a segment is an ID or dynamic parameter
const isDynamicSegment = (segment: string): boolean => {
  // Check if it's a UUID
  if (/^[a-f0-9-]{36}$/i.test(segment)) return true;
  
  // Check if it's a numeric ID
  if (/^\d+$/.test(segment)) return true;
  
  // Check if it looks like a route parameter (not a known route segment)
  const knownSegments = [
    "home", "dashboard", "members", "visitors", "events", "assets", "users",
    "life-centers", "market-place", "ministry-school", "settings", "member",
    "programs", "cohort", "class", "topic", "student", "manage-member",
    "all-events", "manage-event", "view-event", "manage-asset", "roles",
    "life-center-analytics", "access-rights", "manage-access", "market",
    "carts", "check-out", "orders", "verify_payment", "school-of-ministries",
    "my-enrolled-programs", "instructor-portal", "product", "life-center",
    "create-product", "edit-product", "visitor", "my-learning", "info", "fam-info"
  ];
  
  return !knownSegments.includes(segment);
};

// Helper function to format segment labels
const formatSegment = (segment: string, fullPath: string): string => {
  // Check if we have a predefined label for this path
  if (routeLabels[fullPath]) {
    return routeLabels[fullPath];
  }
  
  // Check for partial path matches (for dynamic routes)
  for (const [path, label] of Object.entries(routeLabels)) {
    // Handle dynamic segments by comparing structure
    const pathParts = path.split('/');
    const fullPathParts = fullPath.split('/');
    
    if (pathParts.length === fullPathParts.length) {
      let matches = true;
      for (let i = 0; i < pathParts.length; i++) {
        if (pathParts[i] !== fullPathParts[i] && !isDynamicSegment(fullPathParts[i])) {
          matches = false;
          break;
        }
      }
      if (matches) return label;
    }
  }
  
  // If it's a dynamic segment, format it nicely
  if (isDynamicSegment(segment)) {
    // Check what type of ID based on parent path
    if (fullPath.includes('/members/') && !fullPath.includes('/info')) {
      return "Member Details";
    }
    if (fullPath.includes('/visitor/')) {
      return "Visitor Details";
    }
    if (fullPath.includes('/life-center/') && !fullPath.includes('analytics')) {
      return "Life Center Details";
    }
    if (fullPath.includes('/market-place/') && !fullPath.includes('product')) {
      return "Market Details";
    }
    if (fullPath.includes('/product/')) {
      return "Product Details";
    }
    if (fullPath.includes('/programs/') && fullPath.includes('/my-enrolled-programs/')) {
      return "Program Details";
    }
    if (fullPath.includes('/cohort/')) {
      return "Cohort Details";
    }
    if (fullPath.includes('/class/')) {
      return "Class Details";
    }
    if (fullPath.includes('/student/')) {
      return "Student Details";
    }
    if (fullPath.includes('/topic/')) {
      return "Topic Details";
    }
    
    // Generic fallback for IDs
    return "Details";
  }
  
  // Default formatting: kebab-case to Title Case
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

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

  // Generate breadcrumb items from current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname
      .split("/")
      .filter((segment) => segment !== "");

    // If we're on the home page or root
    if (pathSegments.length === 0) {
      return [];
    }

    // Skip breadcrumbs for login and auth pages
    if (pathSegments[0] === "login" || pathSegments[0] === "forgot-password" || pathSegments[0] === "reset-password") {
      return [];
    }

    const items: BreadcrumbItem[] = [];
    let currentPath = "";

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      // Skip paths that are in the skipPaths list
      if (skipPaths.includes(currentPath)) {
        return;
      }

      // Skip info and fam-info segments (they're just tabs, not separate pages)
      if (segment === "info" || segment === "fam-info") {
        return;
      }

      // Get label for this segment
      const label = formatSegment(segment, currentPath);

      items.push({
        label,
        link: isLast ? undefined : currentPath,
      });
    });

    return items;
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