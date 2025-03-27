import Badge from "@/components/Badge";
import Button from "@/components/Button";
import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import ellipse from "@/assets/ellipse.svg";

interface ClassItem {
  id: string;
  name: string;
  format: string;
  instructor: string;
  schedule: string;
  classFormat: string;
  enrolled: number;
  capacity: number;
  location?: string;
  meetingLink?: string;
}

const ClassCard = ({ classItem }: { classItem: ClassItem }) => {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<number | null>(null);

  // Function to toggle the menu
  const toggleMenu = (id: number) => {
    if (isMenuOpen === id) {
      setIsMenuOpen(null); // Close the menu if it's already open
    } else {
      setIsMenuOpen(id); // Open the menu for the clicked item
    }
  };

  // Close menu if clicked outside the menu or button
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(null); // Close the menu if clicked outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside); // Cleanup the event listener
    };
  }, []);

  // Badge for displaying capacity status
  const getCapacityBadge = (enrolled: number, capacity: number): JSX.Element => {
    const percentage = (enrolled / capacity) * 100;
    if (percentage >= 100) {
      return (
        <Badge className="bg-red-50 text-xs text-red-700 border-lightGray">
          Full
        </Badge>
      );
    } else if (percentage >= 75) {
      return (
        <Badge className="bg-amber-50 text-xs text-amber-700 border-lightGray">
          Almost Full
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-green/50 text-xs text-green-700 border-lightGray">
          Available
        </Badge>
      );
    }
  };

  return (
    <div
      key={classItem.id}
      className="border border-lightGray shadow-sm rounded-lg p-4 space-y-2 flex flex-col justify-between"
    >
      <div className="space-y-2 flex-grow">
        <div className="flex justify-between items-center">
          <div className="font-semibold text-lg">{classItem.name}</div>
          <Badge className="text-xs bg-primary text-white">{classItem.classFormat}</Badge>
        </div>

        <div className="flex justify-between items-center">
          <div>Instructor</div>
          <div className="font-medium">{classItem.instructor}</div>
        </div>

        <div className="flex justify-between items-center">
          <div>Schedule</div>
          <div className="font-medium">{classItem.schedule}</div>
        </div>

        <div className="flex justify-between items-center">
          <div>Capacity</div>
          <div className="font-medium flex items-center gap-2">
            <div>{classItem.enrolled}/{classItem.capacity}</div>
            {getCapacityBadge(classItem.enrolled, classItem.capacity)}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>Location</div>
          <div className="font-medium">{classItem.location || "N/A"}</div>
        </div>

        {classItem.meetingLink && (
          <div className="flex justify-between items-center">
            <div>Meeting link</div>
            <div className="font-medium">{classItem.meetingLink}</div>
          </div>
        )}
      </div>

      <hr className="text-lightGray" />

      <div className="flex justify-between items-center mt-4">
        <div>
          <Button
            value="Manage class"
            className={"px-2 py-2 bg-primary text-white"}
            onClick={() => navigate(`class?${classItem.id}`)}
          />
        </div>

        <div className="relative">
          <button
            ref={buttonRef} // Reference to the button
            className="text-primary"
            onClick={() => toggleMenu(Number(classItem.id))} // Pass cohort.id as a number
          >
            <img src={ellipse} alt="options" className="cursor-pointer" />
          </button>

          {isMenuOpen === Number(classItem.id) && (
            <div
              ref={menuRef} // Reference to the menu container
              className="absolute right-0 mt-2 w-48 bg-white border border-lightGray rounded-lg shadow-lg"
            >
              <ul className="py-1">
                <li
                  className="px-4 py-2 hover:bg-lightGray cursor-pointer"
                  onClick={() => console.log("Edit Class", classItem)} // Add appropriate edit logic here
                >
                  Edit Class
                </li>

                <hr className="text-lightGray/10" />
                <li
                  onClick={onDelete} // Pass the delete logic here
                  className="px-4 py-2 cursor-pointer text-red-600 hover:bg-red-50"
                >
                  Delete Class
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassCard;
