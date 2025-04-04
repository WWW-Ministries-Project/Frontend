import ProfilePic from "@/components/ProfilePicture";

interface ChildInfo {
  name?: string;
  src?: string;
  user_info?: {
    date_of_birth?: string; // Expecting format: "YYYY-MM-DD"
  };
  group?: string;
  day?: string;
}

interface ChildCardProps {
  child?: ChildInfo;
  onAddChild?: () => void;
}

const ChildCard = ({ child, onAddChild }: ChildCardProps) => {
  // Calculate age from date of birth
  const calculateAge = (birthDate: string | undefined): string => {
    if (!birthDate) return "N/A";
    
    try {
      const today = new Date();
      const birthDateObj = new Date(birthDate);
      
      // Check if date is valid
      if (isNaN(birthDateObj.getTime())) return "N/A";
      
      let age = today.getFullYear() - birthDateObj.getFullYear();
      const monthDiff = today.getMonth() - birthDateObj.getMonth();
      
      // Adjust age if birthday hasn't occurred yet this year
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
        age--;
      }
      
      return age.toString();
    } catch {
      return "N/A";
    }
  };

  // Empty state
  if (!child) {
    return (
        <div className="bg-white p-4 rounded-b-xl space-y-4">
          <div className="flex justify-between item-center">
            <div className="font-bold text-xl text-primary">Children</div>
          </div>
          
          {/* Empty state */}
          <div className="w-full rounded-lg p-6 bg-primary/5 text-center">
            <div className="text-gray-500 mb-2">
              No children
            </div>
            <p className="text-sm text-gray-400 mb-4">
              This member does not have any children
            </p>
            
          </div>
        </div>
      );
  }

  return (
    <div className="bg-white p-4 rounded-b-xl space-y-4">
        <div className="flex justify-between item-center">
          <div className="font-bold text-xl text-primary">Children</div>
        </div>
        <div className="bg-white rounded-lg overflow-hidden w-full p-4 border border-lightGray transition-shadow hover:shadow-sm">
        
        
        <div className="flex justify-between gap-4 items-start">
          {/* Profile picture */}
          <div>
            <ProfilePic
              className="w-16 h-16 outline outline-primary outline-1 text-primary bg-primary/10"
              src={child?.src}
              alt={child?.name ? `${child.name}'s profile` : "Child profile"}
              name={child?.name}
              id="childProfilePic"
            />
          </div>
  
          {/* Child info */}
          <div className="flex-1 min-w-0">
            <div className="text-primary font-medium truncate">
              {child?.name || "Unnamed Child"}
            </div>
            <div className="flex text-primary text-sm gap-x-2 mt-1">
              <p className="font-medium">Age:</p> 
              {calculateAge(child?.user_info?.date_of_birth)} years
            </div>
            {/* ... rest of your component ... */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildCard;