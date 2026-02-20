import NotificationCard from "./NotificationCard";
import OuterDiv from "./OuterDiv";

const MailSent = () => {
  return (
    <OuterDiv>
      <NotificationCard
        header="Email sent"
        text="A password reset link has been sent to your email address. Check your spam folder if you cannot find it."
        bottomText="Return to login"
        src="/assets/authentication/messageIcon.svg"
        imageAlt="Mail sent icon"
        link="/login"
      />
    </OuterDiv>
  );
};

export default MailSent;
