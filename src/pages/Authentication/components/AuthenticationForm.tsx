import { ReactNode } from "react";
import ChurchLogo from "../../../components/ChurchLogo";
import Alert from "./Alerts";

interface AuthenticationFormProps {
  response?: {
    status?: number;
    [key: string]: unknown;
  };
  header: string;
  text: string;
  children: ReactNode;
  errorText?: string;
  onSubmit?: (e: React.FormEvent) => void;
}

const AuthenticationForm = (props: AuthenticationFormProps) => {
  return (
    <>
      <div className="md:w-2/3 max-w-[500px] mx-auto">
        <form onSubmit={props.onSubmit}>
          <div className="authForm pt-1 rounded-xl shadow-lg mx-auto bg-primary/50">
            <div className="bg-white/15 shadow-sm rounded-lg py-8 px-10">
              <div className="flex justify-center">
                <ChurchLogo className={'text-white mb-3'} />
              </div>
              <div className="flex justify-center font-bold text-white text-2xl gap-x-4">
                <div>{props.header}</div>
              </div>
              <div className="text-center text-white">{props.text}</div>
              <div className="gap-4">
                {props.response?.status && props.response.status >= 400 ? (
                  <Alert
                    className="text-left px-2 my-6 h-6"
                    text={props.errorText || "incorrect email or password please try again"}
                  />
                ) : null}

                {props.children}
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default AuthenticationForm;