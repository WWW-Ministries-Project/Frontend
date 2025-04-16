import { useState } from "react";

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
  capacity: string;
  location: string;
  meetingLink?: string;
  format: "In-Person" | "Hybrid" | "Online";
  availability: "Available" | "Almost Full" | "Full";
}

const ProgramInformation = () => {
  // Mock data - in a real app this would come from props or API
  const userInfo: UserInfo = {
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "+1 555-123-4567",
    membershipType: "In-person Family"
  };

  const classOptions: ClassOption[] = [
    {
      id: "monday-evening",
      name: "Monday Evening Class",
      instructor: "Pastor James Wilson",
      schedule: "Mondays, 7:00 PM - 9:00 PM",
      capacity: "12/15",
      location: "Main Campus - Room 201",
      format: "In-Person",
      availability: "Almost Full"
    },
    {
      id: "wednesday-morning",
      name: "Wednesday Morning Class",
      instructor: "Elder Sarah Johnson",
      schedule: "Wednesdays, 10:00 AM - 12:00 PM",
      capacity: "8/15",
      location: "Main Campus - Fellowship Hall",
      meetingLink: "Available after enrollment",
      format: "Hybrid",
      availability: "Available"
    },
    {
      id: "weekend-online",
      name: "Online Weekend Class",
      instructor: "Dr. Michael Brown",
      schedule: "Saturdays, 9:00 AM - 11:00 AM",
      capacity: "20/20",
      location: "Online Platform",
      meetingLink: "Available after enrollment",
      format: "Online",
      availability: "Full"
    }
  ];

  const [selectedClass, setSelectedClass] = useState<string | null>("wednesday-morning");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Selected class:", selectedClass);
    // Handle form submission
  };

  const getAvailabilityBadge = (format: string, availability: string) => {
    let formatBadgeClass = "";
    let availabilityBadgeClass = "";
    
    // Format badge styling
    switch (format) {
      case "In-Person":
        formatBadgeClass = "bg-blue-100 text-blue-800";
        break;
      case "Hybrid":
        formatBadgeClass = "bg-teal-100 text-teal-800";
        break;
      case "Online":
        formatBadgeClass = "bg-purple-100 text-purple-800";
        break;
    }
    
    // Availability badge styling
    switch (availability) {
      case "Available":
        availabilityBadgeClass = "bg-green-100 text-green-800";
        break;
      case "Almost Full":
        availabilityBadgeClass = "bg-primary-100 text-primary-800";
        break;
      case "Full":
        availabilityBadgeClass = "bg-red-100 text-red-800";
        break;
    }
    
    return (
      <div className="flex space-x-2">
        <span className={`${formatBadgeClass} text-xs font-medium px-2.5 py-0.5 rounded-full`}>
          {format}
        </span>
        <span className={`${availabilityBadgeClass} text-xs font-medium px-2.5 py-0.5 rounded-full`}>
          {availability}
        </span>
      </div>
    );
  };

  return (
    
    // <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        
      <div className="bg-white rounded-lg shadow-md w-full max-w-3xl h-[80vh] mx-auto overflow-y-scroll  px-6 pb-6 md:px-8 md:pb-8">
        {/* Welcome Header */}
        <div className="text-center mb-6 sticky top-0 bg-white z-10 p-4  rounded-lg w-[calc(100%+px)] -mx-8 pt-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back, {userInfo.name}!</h1>
          <p className="text-gray-600">We found your membership information in our system.</p>
        </div>
        
        {/* Membership confirmation alert */}
        {/* <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">Member Found</h3>
            <p className="text-sm text-green-700">We found your membership information in our system.</p>
          </div>
        </div> */}
        
        {/* User Information */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{userInfo.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{userInfo.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{userInfo.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Membership Type</p>
              <p className="font-medium">{userInfo.membershipType}</p>
            </div>
          </div>
        </div>
        
        {/* Class Selection */}
        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Select a Class</h2>
            <div className="space-y-4">
              {classOptions.map((option) => (
                <div 
                  key={option.id}
                  className={`border ${
                    selectedClass === option.id 
                      ? 'border-primary  ' 
                      : option.availability === 'Full' 
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
                        onChange={() => option.availability !== 'Full' && setSelectedClass(option.id)}
                        disabled={option.availability === 'Full'}
                        className="h-4 w-4 text-primary border-gray-300 "
                      />
                    </div>
                    <div className="ml-3 flex-grow">
                      <div className="flex justify-between items-center mb-2">
                        <label 
                          htmlFor={option.id} 
                          className={`font-medium ${
                            option.availability === 'Full' ? 'text-gray-500' : 'text-gray-900'
                          } cursor-pointer`}
                        >
                          {option.name}
                        </label>
                        <div>
                          {getAvailabilityBadge(option.format, option.availability)}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="text-gray-500">Instructor:</span> {option.instructor}</p>
                        <p><span className="text-gray-500">Schedule:</span> {option.schedule}</p>
                        <p><span className="text-gray-500">Capacity:</span> {option.capacity}</p>
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
              ))}
            </div>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 "
            >
              Back
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary border border-transparent rounded-md text-white font-medium hover:bg-primary/70 "
              disabled={!selectedClass}
            >
              Submit Application
            </button>
          </div>
        </form>
      </div>
    // </div>
  );
};

export default ProgramInformation;