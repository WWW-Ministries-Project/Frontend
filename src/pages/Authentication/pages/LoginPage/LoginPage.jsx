// import axios from "axios";
import { relativePath } from "@/utils";
import PropTypes from "prop-types";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios, { pictureInstance } from "../../../../axiosInstance";
import { Button } from "../../../../components";
import Input from "../../../../components/Input";
import InputPassword from "../../../../components/Password";
import { useAuth } from "../../../../context/AuthWrapper";
import { decodeToken, setToken } from "../../../../utils/helperFunctions";
import AuthenticationForm from "../../components/AuthenticationForm";
import OuterDiv from "../../components/OuterDiv";
import { baseUrl, validate } from "../../utils/helpers";

function LoginPage() {
  const [loginValues, setLoginValues] = useState({});
  const [response, setResponse] = useState({});
  const [error, setError] = useState({});
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const navigate = useNavigate();
  function handleSubmit() {

    // console.log("login");
    setLoading(true);
    // if (error.email){

    // }
    (async () => {
      try {
        const endpoint = baseUrl + "user/login";
        const response = await axios.post(endpoint, loginValues);
        setLoading(false);
        const token = response.data.token;
        login(decodeToken(token));
        // Set the Authorization header for future requests
        setToken(token);
        // axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        pictureInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        if (response.status === 200) navigate(relativePath.home.members.mainNew);
      } catch (error) {
        console.log(error, "error");
        setResponse(error.response);
        setLoading(false);
      }
    })();
  }

  function handleBlur(e) {
    const name = e.target.name;
    const isValid = validate(name, loginValues);
    setError((prev) => ({ ...prev, [name]: !isValid }));
    if (!isValid) e.target.setCustomValidity("Invalid format");
    // console.log(e.target, "tag");
    // console.log(error, "err", validate(name, loginValues));
  }

  function handleInputChange(e) {
    setResponse({});
    const name = e.target.name;
    setLoginValues((prev) => ({ ...prev, [name]: e.target.value }));
    // to remove error msg
    if (error[name]) {
      if (validate(name, loginValues)) {
        setError((prev) => ({ ...prev, [name]: false }));
        e.target.setCustomValidity("");
      }
    }
  }
  return (
    <div className="bg-[url('https://res.cloudinary.com/akwaah/image/upload/v1740860331/background_oswjfy.jpg')] bg-no-repeat bg-right bg-cover">
      <div className="bg-primary/60  backdrop-blur-sm">
        <OuterDiv>
          <AuthenticationForm
            response={response}
            header={"Administrator Login"}
            // text={"Login to your account to continue."}
            buttonValue={"Login"}>
            {/* <div className="gap-4"> */}

            <Input
              label="Email Address"
              type="email "
              id="mail"
              name="email"
              value={loginValues.email}
              isRequired={error?.status && !loginValues.email}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder={"Enter email address"}
              labelClassName={"text-white"}
              inputClass={
                error.status
                  ? "  rounded-md px-4 mt-2 border-error"
                  : "  rounded-md px-4 mt-2 "
              }
              className="my-4 !p-0 "
            />
            <InputPassword
              label="Password"
              id="password"
              name="password"
              value={loginValues.password}
              isRequired={error.status && !loginValues.password}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder={"Enter password"}
              labelClassName={"text-white"}
              inputClass={
                error.status
                  ? " rounded-md px-4 mt-2 border-error"
                  : "  rounded-md px-4 mt-2"
              }
              className=" !p-0"
            />
            <Button
            variant="secondary"
              value={"Login"}
              loading={loading}
              disabled={loading}
              onClick={handleSubmit}
              className={"w-full  border border-white my-8 text-white"}
            />
            <div className="text-lightGray text-sm">
              <div className=" flex flex-col justify-center text-center space-y-1">
                <p>Forgot password?</p>
                <Link to="/forgot-password" className="text-primary">
                  <p className="font-bold text-white hover:underline">
                    Reset Password
                  </p>
                </Link>
              </div>
              
            </div>

            {/* </div> */}
          </AuthenticationForm>
        </OuterDiv>
      </div>
    </div>
  );
}

LoginPage.propTypes = {
  error: PropTypes.object,
};

export default LoginPage;
