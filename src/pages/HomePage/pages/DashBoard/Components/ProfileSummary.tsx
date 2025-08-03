import { decodeToken, firstLetters, formatDatefull } from "@/utils";

export const ProfileSummary = () => {
  const decodedToken = decodeToken();
  

  // Function to render profile picture or initials
  const renderProfileImage = () => {
    // Check if profile image exists in decodedToken
    if (decodedToken?.profile_img ) {
      const imageUrl = decodedToken.profile_img ;
      return (
        <img 
          src={imageUrl} 
          alt="Profile" 
          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
        />
      );
    } else {
      // Show initials if no profile image
      return (
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
          {firstLetters(decodedToken?.name)}
        </div>
      );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">My Profile Summary</h3>
      
      <div className="flex items-start gap-4 mb-6">
        {renderProfileImage()}
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800 text-lg">{decodedToken?.name || "Name not available"}</h4>
          <p className="text-gray-600 text-sm mb-1">{decodedToken?.email || "Email not available"}</p>
          {decodedToken?.phone && <p className="text-gray-600 text-sm">{decodedToken.phone}</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Member Since</p>
          <p className="text-sm text-gray-800">{formatDatefull(decodedToken?.member_since)  || "-"}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Member Type</p>
          <p className="text-sm text-gray-800">{decodedToken?.membership_type || "-"}</p>
        </div>
      </div>
      
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-500 mb-3">Ministries & Department</p>
        <div className="flex flex-wrap gap-2">
          {decodedToken?.department && Array.isArray(decodedToken.department) && decodedToken.department.length > 0 ? (
            decodedToken.department.map((department, index) => (
              <span key={index} className="px-3 py-1 bg-primary text-white text-xs rounded-full">
                {department}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-500 italic">No departments assigned</span>
          )}
        </div>
      </div>
    </div>
  );
};