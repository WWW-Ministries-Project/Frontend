
import AssignmentCard from "./AssignmentCard";
import MaterialItem from "./MaterialItem";



const AssMatSidebar = ({materials, assignments}: {materials: any[], assignments: any[]}) => {
  return (
    <aside className="w-full space-y-6 lg:w-72 lg:flex-shrink-0">
      {/* Assignments */}
      <div>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Assignment
        </h3>
        <div className="space-y-3">
          {assignments.map((assignment, index) => (
            <div
              key={assignment.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <AssignmentCard {...assignment} />
            </div>
          ))}
        </div>
      </div>

      {/* Materials */}
      <div>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Material
        </h3>
        <div className="space-y-2">
          {materials.map((material, index) => (
            <div
              key={material.id}
              className="animate-fade-in"
              style={{ animationDelay: `${(index + 2) * 100}ms` }}
            >
              <MaterialItem {...material} />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default AssMatSidebar;
