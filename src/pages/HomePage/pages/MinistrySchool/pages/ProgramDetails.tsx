import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProgramsStore } from '../store/programsStore';
import { formatDate } from "@/utils";
import { ApiCalls } from "@/utils/api/apiFetch";

interface Cohort {
  id: string;
  name: string;
  startDate: string;
  duration: string;
  status: "Active" | "Upcoming" | "Past";
}

const ProgramDetails = () => {
  const [email, setEmail] = useState("");
  // const [selectedCohort, setSelectedCohort] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const { selectedCohort, selectedProgram, setCurrentApplicant } = useProgramsStore();
  const navigate = useNavigate();
  const apiCalls = new ApiCalls();
  
  // Sample data - in a real app this would come from props or an API
  const programInfo = {
    title: "Apply for Biblical Leadership",
    description: "A comprehensive program on biblical principles of leadership",
    cohorts: [
      {
        id: "spring-2023",
        name: "Spring 2023",
        startDate: "6/1/2023",
        duration: "12 weeks",
        status: "Active"
      },
      {
        id: "fall-2023",
        name: "Fall 2023",
        startDate: "9/15/2023",
        duration: "12 weeks",
        status: "Upcoming"
      }
    ]
  };

  const fetUsersbyEmail = async () => {
    try {
      if (!email || !selectedCohort?.id) {
        setError("Please enter your email and select a cohort");
        return;
      }
  
      setLoading(true);
      setError(null);
      
      const response = await apiCalls.fetchUserByEmailAndCohort(
        email,
        Number(selectedCohort.id) // Convert to number if your API expects number
      );
  
      if (response.data) {
        setData(response.data);
        setCurrentApplicant(response.data); // Set the current applicant in the store
        // If user exists, you might want to navigate or show success
        console.log("User found:", response.data);
        // navigate("apply", { state: { email, cohortId: selectedCohort.id } });
      } else {
        setError("User not found in this cohort");
      }
    } catch (err) {
      setError("An error occurred while checking your information");
      console.error("Error fetching user:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Selected Cohort:", selectedCohort);
    
  }, [])
  

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCohort) {
      alert("Please select a cohort to apply for");
      return;
    }
  
    if (!email) {
      alert("Please enter your email");
      return;
    }
  
    // First check if user exists in cohort
    await fetUsersbyEmail();
    
    // If user exists (data is set), proceed to next step
    if (data) {
      navigate("apply", { state: { email, cohortId: selectedCohort.id } });
    }
    // If not, the error will be shown from fetUsersbyEmail
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-3 py-1 rounded-full">
            Active
          </span>
        );
      case "Upcoming":
        return (
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
            Upcoming
          </span>
        );
      case "Past":
        return (
          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-3 py-1 rounded-full">
            Past
          </span>
        );
      default:
        return null;
    }
  };

  return (
    (selectedCohort?<div className="p-8 bg-white w-full max-w-xl rounded-lg border border-gray-200 shadow-md">
      {error && (
  <div className="text-red-600 text-sm mt-2 p-2 bg-red-50 rounded">
    {error}
  </div>
)}
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedProgram?.title}</h1>
        <p className="text-gray-600">{selectedProgram?.description}</p>
      </div>

      {/* Available Cohorts */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Available Cohorts</h2>
        <div className="space-y-3">
          {
            <div 
               
              className={`border rounded-lg p-4 flex justify-between items-center transition-colors  
                
              `}
              // onClick={() => setSelectedCohort(cohort.id)}
            >
              <div>
                <h3 className="font-medium text-gray-900">{selectedCohort?.name}</h3>
                <p className="text-sm text-gray-600">
                  Starts: {formatDate(selectedCohort?.startDate || "")} • Duration: {selectedCohort?.duration || "N/A"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedCohort?.status ?? "")}
                {/* {selectedCohort === cohort.id && (
                  <span className="text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </span>
                )} */}
              </div>
            </div>
          }
        </div>
      </div>

      {/* Divider */}
      <hr className="my-8 border-gray-200" />

      {/* Application Form */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Start Your Application</h2>
        <div className="text-gray-800 mb-4">
          <p><span className="font-bold">Note:</span></p>
          <li className="text-sm">This program is for only members of the worldwide word ministries</li>
          <li className="text-sm">If you are not a member, please <span 
              className="text-blue-800 font-bold animate-pulse hover:animate-none hover:underline cursor-pointer" 
              onClick={() => window.open(`${window.location.origin}/out/register-member`, '_blank', 'noopener,noreferrer')}
            >
              register
            </span> first
          </li>
          <li className="text-sm">If you are already a registered member, please enter your email or phone number to continue</li>
        </div>
        
        <form onSubmit={handleContinue}>
          <div className="mb-4">
            <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-700 mb-1">
              Email or Phone Number
            </label>
            <input
              type="text"
              id="emailOrPhone"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email or phone number"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-primary outline-none transition-all"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-md transition-colors"
            disabled={!selectedCohort}
          >
            Continue
          </button>
        </form>
      </div>
    </div>:
    <div className="text-center text-white mt-8 bg-primary/80 p-4 rounded-lg shadow-md w-full max-w-2xl ">
    <h2 className="text-2xl font-bold mb-4">No Programs Available</h2>
    We will be adding more programs soon.
</div>
    )
  );
};

export default ProgramDetails;