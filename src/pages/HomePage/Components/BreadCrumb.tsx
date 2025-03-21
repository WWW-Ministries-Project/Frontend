import AngleRight from "@/assets/AngleRight";
import React from "react";
import { Link, useLocation } from "react-router-dom";

type BreadcrumbProps = {
  separator?: string;
};

const Breadcrumb: React.FC<BreadcrumbProps> = ({ separator = <AngleRight/> }) => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x && !Number(x));

  return (
    <div className="m-3 p-2 bg-white text-dark900 rounded-lg  z-10 cursor-pointer">
      {pathnames.length > 1 ? (
        <nav aria-label="breadcrumb" className="bg-gray-100 px-5 rounded ">
          <ol className="flex space-x-2 items-center">
            {/* <li className="text-blue-500 hover:underline">
          <Link to="/">Home</Link>
        </li> */}
            {pathnames.map((value, index) => {
              const isLast = index === pathnames.length - 1;
              const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;

              return (
                <React.Fragment key={index}>
                  {index > 0 && <li className="text-dark900">{separator}</li>}
                  {isLast ? (
                    <li className="text-dark900 font-bold " aria-current="page">
                      {value.replace(/-/g, " ").replace(/_/g, " ")}
                    </li>
                  ) : (
                    <li className="text-dark900  hover:text-bold">
                      <Link to={routeTo}>
                        {value.replace(/-/g, " ").replace(/_/g, " ")}
                      </Link>
                    </li>
                  )}
                </React.Fragment>
              );
            })}
          </ol>
        </nav>
      ) : (
        <></>
      )}
    </div>
  );
};

export default Breadcrumb;
