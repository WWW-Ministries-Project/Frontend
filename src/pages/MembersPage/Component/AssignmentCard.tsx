import { formatDatefull } from "@/utils";
import { cn } from "@/utils/cn";


interface AssignmentCardProps {
  name: string;
  dueDate: string;
  submittedDate?: string|Date | number;
  status: "submitted" | "pending";
}

const AssignmentCard = ({ name, dueDate, submittedDate, status }: AssignmentCardProps) => {
  return (
    <div className="rounded-lg border border-border bg-white p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between">
        <h4 className="text-sm font-medium text-foreground">{name}</h4>
        {status === "submitted" && (
          <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
            submitted
          </span>
        )}
      </div>

      <div className="mt-3 flex gap-6 text-xs text-muted-foreground">
        <div>
          <span className="block font-medium">Due</span>
          <span>{formatDatefull(dueDate)}</span>
        </div>
        <div>
          <span className="block font-medium">Submitted</span>
          <span>{submittedDate ? formatDatefull(submittedDate) : "—"}</span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          className={cn(
            "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            status === "submitted"
              ? "bg-primary text-white hover:opacity-90"
              : "bg-primary text-white hover:opacity-90"
          )}
        >
          {status === "submitted" ? "View" : "Submit"}
        </button>
        <button className="flex-1 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary/15">
          {status === "submitted" ? "Update" : "Download"}
        </button>
      </div>
    </div>
  );
};

export default AssignmentCard;
