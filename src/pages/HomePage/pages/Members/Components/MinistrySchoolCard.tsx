import Badge from "@/components/Badge";
import Button from "@/components/Button";

interface MinistrySchoolCardProps {
  enrollment?: any; // Made optional for empty state
}

const MinistrySchoolCard = ({ enrollment }: MinistrySchoolCardProps) => {
  if (!enrollment) {
    return (
      <div className="bg-white p-4 rounded-b-xl space-y-4">
        <div className="flex justify-between item-center">
          <div className="font-bold text-xl text-dark900">School of Ministry</div>
        </div>
        
        {/* Empty state */}
        <div className="w-full rounded-lg p-6 bg-primary/5 text-center">
          <div className="text-gray-500 mb-2">
            No active enrollments
          </div>
          <p className="text-sm text-gray-400 mb-4">
            You're not currently enrolled in any programs
          </p>
          
        </div>
      </div>
    );
  }

  return ( 
    <div className="bg-white p-4 rounded-b-xl space-y-4">
      <div className="flex justify-between item-center">
        <div className="font-bold text-xl text-dark900">School of Ministry</div>
      </div>
      
      {/* List of programs */}
      <div className="w-full rounded-lg p-4 bg-primary/5 space-y-2">
        <div className="flex justify-between">
          <div className="font-bold">
            {enrollment.course.cohort.program.title}
          </div>
          <div>
            <Badge>{enrollment.course.cohort.status}</Badge>
          </div>
        </div>
        <div className="flex text-sm">
          <p className="font-semibold">{enrollment.course.cohort.name}</p> - {enrollment.course.name}
        </div>
        <div>
          progress
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="font-semibold">
          Total Courses Completed 
        </div>
        <div>
          <div className="border border-lightGray px-2 py-1 rounded-md">3</div>
        </div>
      </div>
      <Button
        className={"border border-lightGray w-full"}
        value="View All Courses"
      />
    </div>
  );
}
 
export default MinistrySchoolCard;