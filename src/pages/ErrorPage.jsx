import { useRouteError } from "react-router-dom";

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  return (
    <main id="error-page" className="h-screen">
      <div className="flex  justify-center flex-col items-center h-full">
        <h1 className="text-center ">Oops!</h1>
        <h2>{error.status} status code</h2>
        <p>Sorry, an unexpected error has occurred.</p>
        <p>
          <i>{error.statusText || error.message}</i>
        </p>
      </div>
    </main>
  );
}
