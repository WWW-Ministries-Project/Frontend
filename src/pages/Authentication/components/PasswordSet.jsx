import NotificationCard from "./NotificationCard";
import OuterDiv from "./OuterDiv";

const PasswordSet = () => {
  return (
    <OuterDiv>
      <NotificationCard
        header="Password Updated"
        text="Your new password has been set successfully. You can now log in with your new password."
        src="/assets/authentication/successIcon.svg"
        imageAlt="Password reset successful icon"
        bottomText="Return to login"
        link="/login"
      />
    </OuterDiv>
  );
};

export default PasswordSet;
