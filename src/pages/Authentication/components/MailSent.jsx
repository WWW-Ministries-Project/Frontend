import NotificationCard from "./NotificationCard";
import OuterDiv from "./OuterDiv";

const MailSent = () => {
  return (
    <>
      <OuterDiv>
        <div className="authForm mx-auto">
          <NotificationCard
            header="Email sent!"
            text="We have sent a password to reset your email. Check your spam
                folder if you can't find it."
            bottomText="Return to Login"
            src={"/assets/authentication/messageIcon.svg"}
          />
        </div>
      </OuterDiv>
    </>
  );
};

export default MailSent;
