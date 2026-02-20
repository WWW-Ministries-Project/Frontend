import { FormEvent, ReactNode, useId } from "react";
import ChurchLogo from "../../../components/ChurchLogo";
import Alert from "./Alerts";

interface IProps {
  response?: {
    status?: number;
    data?: unknown;
  };
  header: string;
  text: string;
  children: ReactNode;
  errorText?: string;
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
}

const AuthenticationForm = (props: IProps) => {
  const headingId = useId();
  const descriptionId = useId();
  const hasResponseError = Boolean(props.response?.status && props.response.status >= 400);

  return (
    <section className="mx-auto w-full max-w-lg">
      <form
        onSubmit={props.onSubmit}
        noValidate
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
      >
        <div className="overflow-hidden rounded-2xl border border-lightGray bg-white shadow-[0_20px_45px_-30px_rgba(8,13,45,0.6)]">
          <header className="border-b border-lightGray bg-primary px-6 py-5 text-white">
            <div className="mb-3 flex justify-center">
              <ChurchLogo />
            </div>
            <h1 id={headingId} className="text-center text-2xl font-semibold">
              {props.header}
            </h1>
            <p id={descriptionId} className="mt-1 text-center text-sm text-white/90">
              {props.text}
            </p>
          </header>

          <div className="space-y-4 px-6 py-6">
            {hasResponseError ? (
              <Alert
                className="w-full text-left"
                text={props.errorText || "Incorrect email or password. Please try again."}
              />
            ) : null}

            {props.children}
          </div>
        </div>
      </form>
    </section>
  );
};

export default AuthenticationForm;
