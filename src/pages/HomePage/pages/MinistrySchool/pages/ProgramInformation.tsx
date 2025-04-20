import { useEffect, useState } from "react";
import { useProgramsStore } from "../store/programsStore";
import Badge from "@/components/Badge";
import { ApiCreationCalls } from "@/utils/api/apiPost";

interface UserInfo {
  name: string;
  email: string;
  phone: string;
  membershipType: string;
}

interface ClassOption {
  id: string;
  name: string;
  instructor: string;
  schedule: string;
  capacity: number;
  enrolled: number;
  location: string;
  meetingLink?: string;
  classFormat: "In-Person" | "Hybrid" | "Online";
}

const ProgramInformation = () => {
  const { currentApplicant, selectedCohort, selectedProgram } = useProgramsStore();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const apiPost = new ApiCreationCalls();

  useEffect(() => {
    console.log("Current applicant data:", currentApplicant);
    console.log("Selected cohort:", selectedCohort);
    console.log("Selected program:", selectedProgram);
  }, []);

  const handleSubmitt = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Selected class:", selectedClass);
    // Handle form submission
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);

    // Prepare the payload
    const payload = {
      firstName: currentApplicant.user.first_name,
      lastName: currentApplicant.user.last_name,
      email: currentApplicant.user.email,
      phone: currentApplicant.user.primary_number,
      isMember: true,
      courseId: selectedClass, // Add classId to the payload
      userId: currentApplicant ? currentApplicant.user.user_id
      : null, // Add selected member's ID if available
    };

    try {
      const response = await apiPost.enrollUser(payload);
      if (response.success) {
        console.log("Student enrolled successfully", response.data);
        // onClose(); // Close modal after successful enrollment
      } else {
        console.error(
          "Error enrolling student:",
          response?.error || "Unknown error"
        );
      }
    } catch (error) {
      console.error("Error in enrolling student:", error);
    } finally {
      setLoading(false);
      // onClose();
      // fetchCohortData();
    }
  };

  const getAvailabilityBadge = (format: string) => {
    let formatBadgeClass = "";
    
    switch (format) {
      case "In_Person":
        formatBadgeClass = "bg-blue-100 text-blue-800";
        break;
      case "Hybrid":
        formatBadgeClass = "bg-teal-100 text-teal-800";
        break;
      case "Online":
        formatBadgeClass = "bg-purple-100 text-purple-800";
        break;
    }
    
    return (
      <span className={`${formatBadgeClass} text-xs font-medium px-2.5 py-0.5 rounded-full`}>
        {format === "In_Person" ? "In-Person" : format === "Hybrid" ? "Hybrid" : "Online"}
      </span>
    );
  };

  const getCapacityBadge = (enrolled: number, capacity: number): JSX.Element => {
    const percentage = Math.round((enrolled / capacity) * 100);
    const availableSpots = capacity - enrolled;
    
    return (
      <div className="flex items-center space-x-2">
        {/* <div className="text-xs text-gray-600">
          {enrolled}/{capacity} ({percentage}%)
        </div> */}
        <Badge 
          className={`text-xs ${
            percentage >= 100 
              ? "bg-red-50 text-red-700 border-red-200" 
              : percentage >= 75 
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-green-50 text-green-700 border-green-200"
          }`}
        >
          {percentage >= 100 ? "Full" : percentage >= 75 ? "Filling Fast" : "Available"}
        </Badge>
      </div>
    );
  };

  return (
    (currentApplicant?<div className="bg-white rounded-lg shadow-md w-full max-w-3xl max-h-[80vh] mx-auto overflow-y-scroll px-6 md:px-8">
      {/* Welcome Header */}
      <div className="text-center mb-6 sticky top-0 bg-white z-10 p-4 rounded-lg w-[calc(100%+10px)] -mx-8 pt-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome, {currentApplicant.user.first_name + " " + currentApplicant.user.last_name}!
        </h1>
        <p className="text-gray-600">We found your membership information in our system.</p>
      </div>
      
      {/* User Information */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium">{currentApplicant.user.first_name + " " + currentApplicant.user.last_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{currentApplicant.user.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="font-medium">{currentApplicant.user.country_code + " " + currentApplicant.user.primary_number}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Membership Type</p>
            <p className="font-medium">
              {currentApplicant.user.user.membership_type === "ONLINE" 
                ? "Online e-church family" 
                : "In-person Family"}
            </p>
          </div>
        </div>
      </div>
      
      {/* Class Selection */}
      <form onSubmit={handleSubmit}>
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Select a Class</h2>
          <div className="space-y-4">
            {currentApplicant.courses?.map((option: ClassOption) => {
              const percentage = Math.round((option.enrolled / option.capacity) * 100);
              const availableSpots = option.capacity - option.enrolled;
              
              return (
                <div 
                  key={option.id}
                  className={`border ${
                    selectedClass === option.id 
                      ? 'border-primary' 
                      : percentage >= 100
                      ? 'border-gray-200 opacity-75' 
                      : 'border-gray-200 hover:border-gray-300'
                  } rounded-lg p-4 transition-all`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-0.5">
                      <input
                        type="radio"
                        id={option.id}
                        name="classOption"
                        value={option.id}
                        checked={selectedClass === option.id}
                        onChange={() => percentage < 100 && setSelectedClass(option.id)}
                        disabled={percentage >= 100}
                        className="h-4 w-4 text-primary border-gray-300"
                      />
                    </div>
                    <div className="ml-3 flex-grow">
                      <div className="flex justify-between items-center mb-2">
                        <label 
                          htmlFor={option.id} 
                          className={`font-medium ${
                            percentage >= 100 ? 'text-gray-500' : 'text-gray-900'
                          } cursor-pointer`}
                        >
                          {option.name}
                        </label>
                        <div className="flex items-center space-x-2">
                          {getAvailabilityBadge(option.classFormat)}
                          {getCapacityBadge(option.enrolled, option.capacity)}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="text-gray-500">Instructor:</span> {option.instructor}</p>
                        <p><span className="text-gray-500">Schedule:</span> {option.schedule}</p>
                        <p>
                          <span className="text-gray-500">Enrollment:</span> {option.enrolled}/{option.capacity} (
                          {percentage}% full)
                        </p>
                        {availableSpots > 0 && (
                          <p><span className="text-gray-500">Available spots:</span> {availableSpots}</p>
                        )}
                        <p><span className="text-gray-500">Location:</span> {option.location}</p>
                        {option.meetingLink && (
                          <p>
                            <span className="text-gray-500">Meeting Link:</span> {option.meetingLink}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between sticky bottom-0 bg-white py-4 px-4 border-t border-gray-200 w-[calc(100%+60px)] -mx-8">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Back
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-primary border border-transparent rounded-md text-white font-medium hover:bg-primary/70"
            disabled={!selectedClass}
          >
            Submit Application
          </button>
        </div>
      </form>
    </div>
    :
    <div className="text-center text-white mt-8 bg-primary/80 p-4 rounded-lg shadow-md w-full max-w-2xl ">
    <h2 className="text-2xl font-bold mb-4">No Programs Available</h2>
    We will be adding more programs soon.
</div>  
  )
  );
};

export default ProgramInformation;