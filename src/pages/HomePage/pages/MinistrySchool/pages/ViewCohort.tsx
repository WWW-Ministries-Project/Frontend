import Badge from "@/components/Badge";
import Button from "@/components/Button";
import PageOutline from "@/pages/HomePage/Components/PageOutline";

const ViewCohort = () => {
  // Mock data for cohort (You can replace this with real data from an API or database)
 
   const cohort =
      {
        id: 101,
        name: "Spring 2023",
        description: "First cohort of the Biblical Leadership program",
        startDate: "2023-06-01",
        duration: "12 weeks",
        applicationDeadline: "2023-05-15",
        status: "Active",
        classes: [
          {
            id: 1001,
            name: "Monday Evening Class",
            instructor: "Pastor James Wilson",
            capacity: 15,
            enrolled: 12,
            format: "in-person",
            location: "Main Campus - Room 201",
            schedule: "Mondays, 7:00 PM - 9:00 PM",
            meetingLink: "",
          },
          {
            id: 1002,
            name: "Wednesday Morning Class",
            instructor: "Elder Sarah Johnson",
            capacity: 15,
            enrolled: 8,
            format: "hybrid",
            location: "Main Campus - Fellowship Hall",
            meetingLink: "https://zoom.us/j/123456789",
            schedule: "Wednesdays, 10:00 AM - 12:00 PM",
          },
          {
            id: 1003,
            name: "Online Weekend Class",
            instructor: "Dr. Michael Brown",
            capacity: 20,
            enrolled: 4,
            format: "online",
            location: "",
            meetingLink: "https://zoom.us/j/987654321",
            schedule: "Saturdays, 9:00 AM - 11:00 AM",
          },
        ],
      }
    


  return (
    <div className="px-4">
      <PageOutline className="p-0">
        <section className=" sticky top-0">
        <div className="bg-primary rounded-t-lg text-white">
                    <div className="lg:container mx-auto p-4 space-y-3">
                        <div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className=" text-white text-2xl font-bold">
                        {cohort.name}
                        </div>
                        <Badge className="text-xs bg-primary text-white">{cohort.status}</Badge>
                        </div>
                      <Button value="Edit Cohort" className="p-2 m-1 bg-white min-h-10 max-h-14 text-primary" />
                      
                    </div>
                    <div className="text-sm">
                      <p>{cohort.description}</p>
                    </div>
                    </div>

                    <div className="flex gap-8">
                      <div>
                        <div className="font-semibold text-small">Start date</div>
                        <div>{cohort.startDate}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-small">Duration</div>
                        <div>{cohort.duration}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-small">Application Deadline</div>
                        <div>{cohort.applicationDeadline}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-small">Classes</div>
                        <div>{cohort.classes.length} classes</div>
                      </div>
                    </div>
                    </div>
                </div>
        
        </section>
        <section>
            {/* classes */}
            <div  className="container mx-auto rounded-lg p-4 space-y-2">
                {/* Classes */}
                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-lg">Classes</div>
                      <Button value="Add Class" className="p-2 m-1 text-white min-h-10 max-h-14 bg-primary" />
                    </div>

                    <div className="grid gap-4 grid-cols-2">
                    {cohort.classes.map((classItem) => (
                      <div key={classItem.id} className="border border-lightGray shadow-sm rounded-lg p-4 space-y-2">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="font-semibold text-lg">{classItem.name}</div>
                            <Badge className="text-xs bg-primary text-white">{classItem.format}</Badge>
                          </div>

                          <div className="flex justify-between items-center">
                            <div>Instructor</div>
                            <div className="font-medium">{classItem.instructor}</div>
                          </div>

                          <div className="flex justify-between items-center">
                            <div>Schedule</div>
                            <div className="font-medium">{classItem.schedule}</div>
                          </div>

                          <div className="flex justify-between items-center">
                            <div>Capacity</div>
                            <div className="font-medium flex items-center gap-2">
                              <div>{classItem.enrolled}/{classItem.capacity}</div>
                              <Badge className="bg-yellow-200 text-xs text-yellow-900 border-lightGray">
                                {classItem.enrolled >= classItem.capacity ? "Full" : "Almost full"}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <div>Location</div>
                            <div className="font-medium">{classItem.location || "N/A"}</div>
                          </div>

                          {classItem.meetingLink && (
                            <div className="flex justify-between items-center">
                              <div>Meeting link</div>
                              <div className="font-medium">{classItem.meetingLink}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    </div>
                  </div>
        </section>
      </PageOutline>
    </div>
  );
};

export default ViewCohort;
