import PropTypes from 'prop-types';
import { decodeToken } from "@/utils";

export const WelcomeHeader = ({route ={}}) => {
      const decodedToken = decodeToken();
      const name = decodedToken?.name ?? "";
      
      

  return (
    <div className={`${route==="member"?"relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]":"rounded-xl "}`}>
    <div className={` bg-[url('https://res.cloudinary.com/akwaah/image/upload/v1740860331/background_oswjfy.jpg')] bg-no-repeat bg-right bg-cover py-6  mb-8 text-white relative overflow-hidden ${route==="member"?"px-[1rem] lg:px-[4rem] xl:px-[8rem]":"rounded-xl px-6"}`}>
      <div className="absolute inset-0 bg-black opacity-70 backdrop-blur-sm rounded-xl"></div>
      
      <div className="relative  ">
        <h1 className="text-lg sm:text-xl md:text-3xl font-bold mb-2">Welcome {name} 👋!</h1>
        <p className="text-blue-100 mb-6 text-sm md:text-base">Worldwide Word Ministries - Raising people to function like Christ Jesus</p>
        
        <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
          <p className="text-sm text-blue-100 mb-1">Theme for the Year 2025</p>
          <h2 className="text-lg md:text-xl font-semibold mb-1">&quot;Walking by Faith, Not by Sight&quot;</h2>
          <p className="text-sm text-blue-200">2 Corinthians 5:7</p>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 opacity-30">
        <div className="w-20 h-20 border border-white rounded-full"></div>
      </div>
      <div className="absolute bottom-4 right-20 opacity-20">
        <div className="w-12 h-12 border border-white rounded-full"></div>
      </div>
    </div>
    </div>
  );
};
WelcomeHeader.propTypes = {
  route: PropTypes.shape({
    name: PropTypes.string,
    params: PropTypes.object,
  }),
};