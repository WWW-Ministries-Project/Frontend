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
    return false;
  }