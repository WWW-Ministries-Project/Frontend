import React from "react";
import { HeaderControls } from "@/components/HeaderControls";
import PageOutline from "../../Components/PageOutline";
import FinanceCard from "./Components/FinanaceCard";
import { useNavigate } from "react-router-dom";

const dummyData = [
{
    id: 1,
    title: "August 2024, Week Three",
    createdBy: "Admin User",
    from: "2024-08-21",
    to: "2024-08-27",
    createdDate: "2024-08-21",
    updatedBy: "Finance Manager",
    updatedDate: "2024-08-22",
},
{
    id: 2,
    title: "August 2024, Week Two",
    createdBy: "Admin User",
    from: "2024-08-14",
    to: "2024-08-20",
    createdDate: "2024-08-14",
    updatedBy: "Finance Manager",
    updatedDate: "2024-08-15",
},
{
    id: 3,
    title: "August 2024, Week One",
    createdBy: "Admin User",
    from: "2024-08-07",
    to: "2024-08-13",
    createdDate: "2024-08-07",
    updatedBy: "Finance Manager",
    updatedDate: "2024-08-08",
},
{
    id: 4,
    title: "July 2024, Week Four",
    createdBy: "Admin User",
    from: "2024-07-31",
    to: "2024-08-06",
    createdDate: "2024-07-31",
    updatedBy: "Finance Manager",
    updatedDate: "2024-08-01",
}
]

const getMonthYearLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
};

const groupByMonthYear = (data: typeof dummyData) => {
  return data.reduce((acc, item) => {
    const group = getMonthYearLabel(item.createdDate);
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(item);
    return acc;
  }, {} as Record<string, typeof dummyData>);
};

const getCurrentMonthYear = () => {
  const now = new Date();
  return now.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
};

const FinanceManager = () => {
    const navigate= useNavigate()
    const groupedData = groupByMonthYear(dummyData);
    const currentGroup = getCurrentMonthYear();

    const groupKeys = Object.keys(groupedData);

    // Determine default open group
    const defaultOpenGroup = groupKeys.includes(currentGroup)
      ? currentGroup
      : groupKeys.sort(
          (a, b) => new Date(b).getTime() - new Date(a).getTime()
        )[0];

    const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>(
      groupKeys.reduce((acc, key) => {
        acc[key] = key === defaultOpenGroup;
        return acc;
      }, {} as Record<string, boolean>)
    );

    return ( 
        <PageOutline className="p-6">
            <HeaderControls
        title="Finance Management"
        subtitle="Manage all financial activities and records"
        screenWidth={window.innerWidth}
        btnName="Add Transaction"
        handleClick={() => {
            navigate('create')
          console.log("Add Transaction clicked");
        }}

            />

            {/* Finance data */}
            <div className="space-y-4">
              {Object.entries(groupedData).map(([group, items]) => (
                <div key={group} className="space-y-3">
                  <button
                    className="w-full flex justify-between items-center font-semibold text-lg py-2 px-4 bg-gray-50 rounded-lg"
                    onClick={() =>
                      setOpenGroups((prev) => ({
                        ...prev,
                        [group]: !prev[group],
                      }))
                    }
                  >
                    <div className="flex gap-x-2">
                      <span>{group}</span>
                      <span>({items.length})</span>
                    </div>
                    <span className="text-sm">
                      {openGroups[group] ? "−" : "+"}
                    </span>
                  </button>

                  {openGroups[group] && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {items.map((item) => (
                        <div key={item.id}>
                            <FinanceCard
                              finance={item}
                              onEdit={() => console.log("Edit clicked")}
                              onDelete={() => console.log("Delete clicked")}
                            />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
        </PageOutline>
     );
}
 
export default FinanceManager;