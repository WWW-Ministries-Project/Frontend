import NotificationCard from "./NotificationCard";
import OuterDiv from "./OuterDiv";

const PasswordSet = () => {
  return (
    <>
      <OuterDiv>
        <div className="pt-1 authForm rounded-lg mx-auto bg-wwmBlue">
           <NotificationCard className={"bg-white"}
          header="New Password Set"
          text="Your new password has been set successfully. Proceed to login with your new password"
          src={"/assets/authentication/successIcon.svg"}
        /> 
        </div>
        
      </OuterDiv>
    </>
  );
};

export default PasswordSet;
