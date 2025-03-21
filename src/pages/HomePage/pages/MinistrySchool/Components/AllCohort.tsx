import Badge from "@/components/Badge";
import Button from "@/components/Button";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { useNavigate } from "react-router-dom";

interface AllCohortsPageProps {
  onCreate: () => void;
}

const AllCohortsPage: React.FC<AllCohortsPageProps> = ({ onCreate }) => {
  const navigate = useNavigate()
  // Mock data for cohorts (you can replace this with actual data from your database)
  const cohortsData = [
    {
      id: 101,
      name: "Spring 2023",
      program: "Biblical Leadership",
      startDate: "2023-06-01",
      duration: "12 weeks",
      status: "Active",
      applicationDeadline: "2023-05-15",
    },
    {
      id: 102,
      name: "Fall 2023",
      program: "Discipleship Training",
      startDate: "2023-09-15",
      duration: "8 weeks",
      status: "Upcoming",
      applicationDeadline: "2023-08-30",
    },
    {
      id: 103,
      name: "Summer 2023",
      program: "Bible Study Methods",
      startDate: "2023-07-10",
      duration: "10 weeks",
      status: "Upcoming",
      applicationDeadline: "2023-06-25",
    },
    {
      id: 104,
      name: "Winter 2023",
      program: "Marriage Enrichment",
      startDate: "2023-11-05",
      duration: "10 weeks",
      status: "Upcoming",
      applicationDeadline: "2023-10-15",
    },
  ];

  return (
    <div className="px-4">
      <div className="p-0">
        <section className=" py-4 space-y-2 rounded-t-lg  ">
          <div className="container mx-auto flex justify-between">
            <div className="">
              <h1 className="text-dark900 text-2xl font-bold">All Cohorts</h1>
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

        <section className="">
          <div className="container mx-auto text-dark900">
            <div className="grid gap-4 grid-cols-3">
              {cohortsData.map((cohort) => (
                <div
                  key={cohort.id}
                  className="border border-lightGray rounded-lg p-4 space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <div className="font-semibold text-lg">{cohort.name}</div>
                    <Badge className={`text-xs border-lightGray ${cohort.status === "Active" ? "bg-primary/20 text-dark900" : "bg-yellow-100 text-dark900"}`}>
                      {cohort.status}
                    </Badge>
                  </div>
                  <div className="text-sm">
                    <p>Program: {cohort.program}</p>
                    <p>Start Date: {cohort.startDate}</p>
                    <p>Duration: {cohort.duration}</p>
                    <p>Application Deadline: {cohort.applicationDeadline}</p>
                  </div>

                  <div className="flex justify-between items-center">
                    <Button
                      value="View Details"
                      className="p-2 m-1 text-primary min-h-10 max-h-14 bg-white"
                    />
                    <Button
                      value="Manage Cohort"
                      className="p-2 m-1 text-white min-h-10 max-h-14 bg-primary"
                      onClick={() => navigate(`cohort/${cohort.id}`)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AllCohortsPage;
