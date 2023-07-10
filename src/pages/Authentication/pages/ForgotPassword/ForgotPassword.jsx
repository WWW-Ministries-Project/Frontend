import axios from "axios";
import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../../../components/Button";
import Input from "../../../../components/Input";
import AuthenticationForm from "../../components/AuthenticationForm";
import NotificationCard from "../../components/NotificationCard";
import OuterDiv from "../../components/OuterDiv";
import { baseUrl, validate } from "../../utils/helpers";

const ForgotPassword = () => {
  const [emailValue, setEmailValue] = useState({});
  const [response, setResponse] = useState({});
  const [error, setError] = useState({});
  function handleSubmit(e) {
    e.preventDefault();
    (async () => {
      try {
        const endpoint = baseUrl + "/user/forgot-password";
        const response = await axios.post(endpoint, emailValue);
        console.log(response, "res");
        setResponse(response);
      } catch (error) {
        console.log(error, "error");
      }
    })();
  }
  function handleBlur(e) {
    const name = e.target.name;
    const isValid = validate(name, emailValue);
    setError((prev) => ({ ...prev, [name]: !isValid }));
    !isValid && e.target.setCustomValidity("Invalid format");
    // console.log(e.target, "tag");
    // console.log(error, "err", validate(name, emailValue));
  }
  function handleInputChange(e) {
    setResponse({});
    const name = e.target.name;
    setEmailValue((prev) => ({ ...prev, [name]: e.target.value }));
    // to remove error msg
    if (error[name]) {
      if (validate(name, emailValue)) {
        setError((prev) => ({ ...prev, [name]: false }));
        e.target.setCustomValidity("");
      }
    }
  }
  return (
    <>
      <OuterDiv>
        {response.status == 200 ? (
          <div className="authForm mx-auto">
            <NotificationCard
              header="Email sent!"
              text="We have sent a password to reset your email. Check your spam
              folder if you can't find it."
              bottomText="Return to Login"
              src={"/assets/authentication/messageIcon.svg"}
              link={"/login"}
            />
          </div>
        ) : (
          <AuthenticationForm
            response={response}
            header={"Forgot Password"}
            text={"Enter your email, we'll send you a password reset link."}
            handleSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email "
              id="mail"
              name="email"
              value={emailValue.email}
              isRequired={error.status && !emailValue.email}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder={"Enter Email Address"}
              inputClass={
                error.status
                  ? " h-8 rounded-md px-4 mt-2 border-error"
                  : " h-8 rounded-md px-4 mt-2"
              }
              className="my-4 !p-0"
            />
            <Button
              value={"Send password reset email"}
              onClick={handleSubmit}
              className={"w-full h-[38px] bg-primaryViolet my-8 text-white"}
            />
            <div className=" mx-auto">
              <div className="text-mainGray text-center">
                <Link to="/login">Return to login</Link>
              </div>
            </div>
          </AuthenticationForm>
        )}
      </OuterDiv>
    </>
  );
};

export default ForgotPassword;
