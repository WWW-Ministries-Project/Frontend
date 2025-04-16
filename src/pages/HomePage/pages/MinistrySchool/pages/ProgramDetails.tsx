import { useState } from "react";

interface CohortInfo {
  id: string;
  name: string;
  startDate: string;
  duration: string;
  status: "Active" | "Upcoming" | "Past";
}

const ProgramDetails = () => {
  const [email, setEmail] = useState("");
  
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

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Continuing with email:", email);
    // In a real app, you would navigate to the next step or make an API call
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
    // <div className="bg-[url('https://res.cloudinary.com/akwaah/image/upload/v1740860331/background_oswjfy.jpg')] bg-no-repeat bg-right bg-cover">
    // <div className="relative h-screen bg-primary/60 overflow-hidden">
    //   <div className="flex items-center justify-center h-full">
      <div className="p-8 bg-white w-full max-w-xl rounded-lg border border-gray-200 shadow-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{programInfo.title}</h1>
          <p className="text-gray-600">{programInfo.description}</p>
        </div>

        {/* Available Cohorts */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Available Cohorts</h2>
          <div className="space-y-3">
            {programInfo.cohorts.map((cohort) => (
              <div 
                key={cohort.id} 
                className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{cohort.name}</h3>
                  <p className="text-sm text-gray-600">
                    Starts: {cohort.startDate} • Duration: {cohort.duration}
                  </p>
                </div>
                <div>
                  {getStatusBadge(cohort.status)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <hr className="my-6 border-gray-200" />

        {/* Application Form */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Start Your Application</h2>
          <p className="text-gray-600 mb-4">
            Please enter your email or phone number so we can check if you're already a member.
          </p>
          
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md   focus:border-primary outline-none transition-all"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-md transition-colors "
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    //   </div>
    //   </div>
    // </div>
  );
};

export default ProgramDetails;