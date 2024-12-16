import Button from "@/components/Button";
import ProfilePic from "@/components/ProfilePicture";
import ToggleSwitch from "@/components/ToggleInput";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";
import { useState } from "react";

const ViewUser = () => {
  const [isActive, setIsActive] = useState(true);
  const props = {
    name: "Jojo Abbiw",
    email: "abbiwjojo22@gmail.com",
    phone: "+233-248-651-322",
    position: "System admin",
    department: "IT department",
    photo: "https://via.placeholder.com/150",
}

  const toggleAccountStatus = () => {
    setIsActive((prev) => !prev);
  };

  const resetPassword = () => {
    alert("Password reset initiated!");
  };

  return (
    <PageOutline>
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6 space-y-4">
        <h2 className="text-2xl font-semibold ">User Account</h2>
        <div className="flex items-start justify-center space-x-24">
          <ProfilePic src={props.photo} alt="Profile" />
          {/* User Details */}
          <div className="">
            <div className="grid grid-cols-2 gap-y-4 gap-x-12">
              <span className="">Full name</span>
              <span className="font-semibold">{props.name}</span>

              <span className="">Email</span>
              <span className="font-semibold">{props.email}</span>

              <span className="">Phone number</span>
              <span className="font-semibold">{props.phone}</span>

              <span className="">Position</span>
              <span className="font-semibold">{props.position}</span>

              <span className="">Department</span>
              <span className="font-semibold">{props.department}</span>

              <span className="">Account status</span>
              <ToggleSwitch name="activate" label={`${isActive ? "Deactivate" : "Activate"}`} isChecked={isActive} onChange={toggleAccountStatus} />

              <span className="">Reset password?</span>
              <Button className={"primary"} value="Reset" onClick={resetPassword} />

              <span className="">
                Last password reset
              </span>
              <span className="font-semibold">{new Date().toDateString()}</span>
            </div>
          </div>
        </div>
        <HorizontalLine />
      </div>
    </PageOutline>
  );
};

export default ViewUser;
