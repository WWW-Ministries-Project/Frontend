import {ReactNode} from "react";

const BackgroundWrapper = ({ children }: { children: ReactNode }): JSX.Element => {
  return <div className="min-h-screen bg-[url('https://res.cloudinary.com/akwaah/image/upload/v1740860331/background_oswjfy.jpg')] bg-no-repeat bg-right bg-cover">
      <div className="bg-primary/80 backdrop-blur-sm">
      {children}
      </div>;
      </div>
};

export default BackgroundWrapper;