import Modal from "@/components/Modal";
import { ApiCalls } from "@/utils/api/apiFetch";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AllStudents from "../Components/AllStudents";
import EnrollStudent from "../Components/EnrollStudent";
import ViewPageTemplate from "../Components/ViewPageTemplate";

export function ViewClass () {
  const apiCalls = new ApiCalls();
  const { id: classId } = useParams(); // Get cohort ID from the route
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCohortData = async () => {
    if (!classId) return; // Ensure we have the programId before making the API call

    try {
      setLoading(true);
      // Fetch cohort details by programId
      const programResponse = await apiCalls.fetchCourseById(classId);
      if (programResponse.status === 200) {
        setSelectedClass(programResponse.data);
      } else {
        setError("Error fetching cohort details");
      }
    } catch (err) {
      setError("An error occurred while fetching cohort details.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchCohortData(); // Call the function when programId changes
  }, [classId]);

  return (
    <div className="px-4">
      <ViewPageTemplate
        Data={selectedClass}
        primaryButton=""
        onPrimaryButtonClick={() => {
          /* Add appropriate edit click handler here */
        }}
        secondaryButton=""
        onSecondaryButtonClick={() => {
          /* Add appropriate cancel click handler here */
        }}
        title="Class Details"
        description="View detailed information about the selected class."
        showTopic={true}
        loading={loading}
        isGrid={false}
        details={
          <div className="flex  gap-x-12 gap-y-4 grid grid-cols-3 w-1/2">
            
            {selectedClass?.instructor && (
              <div>
                <div className="font-semibold text-small">Instructor</div>
                <div>{selectedClass?.instructor}</div>
              </div>
            )}
            {selectedClass?.schedule && (
              <div>
                <div className="font-semibold text-small">Schedule</div>
                <div>{selectedClass?.schedule}</div>
              </div>
            )}
            {selectedClass?.format && (
              <div>
                <div className="font-semibold text-small">Format</div>
                <div>{selectedClass?.format}</div>
              </div>
            )}
            {selectedClass?.location && (
              <div>
                <div className="font-semibold text-small">Location</div>
                <div>{selectedClass?.location} </div>
              </div>
            )}
            {selectedClass?.meetingLink && (
              <div>
                <div className="font-semibold text-small">MeetingLink</div>
                <div>{selectedClass?.meetingLink} </div>
              </div>
            )}
            {
              <div>
                <div className="font-semibold text-small">Enrollment</div>
                <div>
                  {selectedClass?.enrolled}/ {selectedClass?.capacity} students
                </div>
              </div>
            }
          </div>
        }
      >
        <div>
          <AllStudents
            Data={selectedClass?.enrollments}
            onOpen={() => setIsModalOpen(true)}
          />
        </div>
      </ViewPageTemplate>
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <EnrollStudent
          selectedClass={selectedClass}
          onClose={() => setIsModalOpen(false)}
          fetchCohortData={() => fetchCohortData()}
        />
      </Modal>
    </div>
  );
};

