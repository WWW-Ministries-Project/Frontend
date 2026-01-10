import React from "react";
import { Button } from "@/components";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { api, formatDatefull } from "@/utils";
import { useNavigate } from "react-router-dom";
import { usePut } from "@/CustomHooks/usePut";

interface Submission {
     id: string;
      studentName: string;
      submittedAt: string;
      grade: number | null;
      status: "pending" | "graded";
}

interface AssignmentTopic {
     id: string;
      title: string;
      topicId?: string;
      isActive: boolean;
      dueDate?: string;
      submissions: Submission[];
}

const AssignmentManager = ({ cohortId, assignments, setSelectedAssignment, refetch }: { 
  cohortId: string; 
  assignments: AssignmentTopic[]; 
  setSelectedAssignment: (assignment: AssignmentTopic) => void;
  refetch: () => void;
}) => {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [selectedAssignment, setLocalSelectedAssignment] = React.useState<AssignmentTopic | null>(null);
    const [dueDate, setDueDate] = React.useState("");
    const [isDeactivateModalOpen, setIsDeactivateModalOpen] = React.useState(false);

    const {
        updateData: activateAssignment,
        loading: activating,
      } = usePut(api.put.activateCohortAssignment);

    const {
        updateData: deactivateAssignment,
        loading: deactivating,
      } = usePut(api.put.deactivateCohortAssignment);

    const handleAssignmentActivation = async (
      action: "activate" | "deactivate",
      assignment: AssignmentTopic,
      dueDate?: string
    ) => {
      if (!assignment?.topicId) return;

      const payload = {
        cohortId,
        topicId: assignment.topicId,
        ...(action === "activate" && dueDate
          ? { dueDate: new Date(dueDate).toISOString() }
          : {}),
      };

      try {
        if (action === "activate") {
          await activateAssignment(payload);
        } else {
          await deactivateAssignment(payload);
        }

        refetch();
      } catch (error) {
        console.error(`Failed to ${action} assignment`, error);
      }
    };

    const navigate = useNavigate()

    React.useEffect(() => {
      const now = new Date();
      console.log("assignments", assignments);
      

      assignments.forEach((assignment) => {
        if (
          assignment.isActive &&
          assignment.dueDate &&
          new Date(assignment.dueDate) < now
        ) {
          const updatedAssignment = {
            ...assignment,
            isActive: false,
          };

          console.log("Auto-deactivated Assignment (due date passed):", updatedAssignment);
        }
      });
    }, [assignments]);
    
    return ( 
        <div className="flex flex-col gap-4 lg:flex-1">
                              {assignments.length === 0 ? (
                                <div className="rounded-xl border border-border p-6 bg-card text-muted-foreground">No assignments match the selected filters.</div>
                              ) : (
                                assignments.map((topic) => (
                                  <div
                                    key={topic.id}
                                    className="flex items-center gap-6 border border-border rounded-xl justify-between p-4 w-full bg-card"
                                  >
                                    <div>
                                      <div className="flex items-center gap-3">
                                        <h3 className="font-medium text-lg text-foreground">{topic.title}</h3>
                                        <Badge
                                          className={`text-xs border normal-case text-white ${
                                            topic.isActive
                                              ? "border-green-500 bg-green-400"
                                              : "border-gray-400 bg-gray-400"
                                          }`}
                                        >
                                          {topic.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                      </div>
                                      <div className="flex gap-4 text-sm text-muted-foreground">
                                        <div>
                                          Due: {topic?.dueDate ? formatDatefull(topic.dueDate) : "N/A"}
                                        </div>
                                        <div>Submissions: {topic.submissions.length}</div>
                                        <div>Pending: {topic.submissions.filter(s => s.status === 'pending').length}</div>
                                      </div>
                                    </div>
                  
                                    <div className="flex items-center gap-3">
                                      {topic.isActive ? (
                                        <>
                                          <Button
                                            variant="secondary"
                                            value="Deactivate"
                                            onClick={() => {
                                              setLocalSelectedAssignment(topic);
                                              setIsDeactivateModalOpen(true);
                                            }}
                                          />
                                          <Button
                                            variant="primary"
                                            value="Grade"
                                            onClick={() => navigate(`grades/${topic.topicId}`)}
                                          />
                                        </>
                                      ) : (
                                        <Button
                                          variant="primary"
                                          value="Activate"
                                          onClick={() => {
                                            setLocalSelectedAssignment(topic);
                                            setDueDate("");
                                            setIsModalOpen(true);
                                          }}
                                        />
                                      )}
                                    </div>
                                  </div>
                                ))
                              )}

                              <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
                                {selectedAssignment && (
                                  <div className="w-full  bg-white rounded-xl p-6 space-y-6">
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <h2 className="text-xl font-semibold text-gray-900">Activate Assignment</h2>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          Set a due date for "{selectedAssignment.title}"
                                        </p>
                                      </div>
                                    </div>

                                    {/* Form */}
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-700">Due Date</label>
                                      <input
                                        type="date"
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                      />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end gap-3 pt-4">
                                      <Button
                                        variant="secondary"
                                        value="Cancel"
                                        onClick={() => {
                                          setIsModalOpen(false);
                                          setLocalSelectedAssignment(null);
                                        }}
                                      />
                                      <Button
                                        variant="primary"
                                        value="Activate"
                                        disabled={!dueDate || activating}
                                        onClick={async () => {
                                          await handleAssignmentActivation("activate", selectedAssignment, dueDate);
                                          setIsModalOpen(false);
                                          setLocalSelectedAssignment(null);
                                          setDueDate("");
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </Modal>

                              <Modal open={isDeactivateModalOpen} onClose={() => setIsDeactivateModalOpen(false)}>
                                {selectedAssignment && (
                                  <div className="w-full bg-white rounded-xl p-6 space-y-6">
                                    <div>
                                      <h2 className="text-xl font-semibold text-gray-900">
                                        Deactivate Assignment
                                      </h2>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        Are you sure you want to deactivate "{selectedAssignment.title}"?
                                      </p>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                      <Button
                                        variant="secondary"
                                        value="Cancel"
                                        onClick={() => {
                                          setIsDeactivateModalOpen(false);
                                          setLocalSelectedAssignment(null);
                                        }}
                                      />
                                      <Button
                                        variant="primary"
                                        value="Deactivate"
                                        disabled={deactivating}
                                        onClick={async () => {
                                          await handleAssignmentActivation("deactivate", selectedAssignment);
                                          setIsDeactivateModalOpen(false);
                                          setLocalSelectedAssignment(null);
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </Modal>
                            </div>
     );
}
 
export default AssignmentManager;