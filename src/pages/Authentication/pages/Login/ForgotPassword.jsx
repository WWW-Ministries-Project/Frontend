import AuthenticationForm from "../../components/AuthenticationForm";
import Input from "../../../../components/Input";
import PropTypes from "prop-types";
import Button from "../../../../components/Button";
import OuterDiv from "../../components/OuterDiv";

const ForgotPassword = (props) => {
  return (
    <>
      <OuterDiv>
        <AuthenticationForm
          response={props.response}
          header={"Forgot Password"}
          text={"Enter your email, we'll send you a password reset link."}
          handleSubmit={props.handleSubmit}>
          <Input
            label="Email"
            type="email "
            id="mail"
            name="email"
            value={props.inputValue.email}
            isRequired={props.error.status && !props.inputValue.email}
            onChange={props.onChange}
            onBlur={props.onBlur}
            placeholder={"Enter Email Address"}
            inputClass={
              props.error.status
                ? " h-8 rounded-md px-4 mt-2 border-error"
                : " h-8 rounded-md px-4 mt-2"
            }
            className="my-4 !p-0"
          />
          <Button
          value={"Send password reset email"}
          onClick={props.handleSubmit}
          className={"w-full h-[38px] bg-primaryViolet my-8 text-white"}
        />
        <div className=" mx-auto">
          <div className="text-mainGray text-center">
            Return to login
          </div>
        </div>
        </AuthenticationForm>
        </OuterDiv>
    </>
  );
};

ForgotPassword.propTypes = {
  inputValue: PropTypes.object,
  error: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  handleSubmit: PropTypes.func.isRequired,
};

export default ForgotPassword;
