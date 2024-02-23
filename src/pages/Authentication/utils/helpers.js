import Cookies from "js-cookie";

export const validateEmail = (email) => {
    // Regular expression pattern for email validation
    const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    // Perform validation
    return emailPattern.test(email);
  };

export function validate(name,inputValue) {
    if (name == "email") {
      return validateEmail(inputValue.email);
    }
    if (name == "password") {
      return inputValue.password?.length > 0;
    }
    if (name == "password1") {
      return inputValue.password1?.length > 0;
    }
    if (name == "password2") {
      return inputValue.password2?.length > 0;
    }
    return false;
  }

// export const baseUrl='https://wwwministries.onrender.com';
export const baseUrl='http://51.20.9.33:8000';

export const logOut = () => {
  Cookies.remove("token");
}