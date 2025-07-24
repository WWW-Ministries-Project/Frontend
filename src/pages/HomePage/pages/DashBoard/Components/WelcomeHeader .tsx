import { decodeToken } from "@/utils";

export const WelcomeHeader = () => {
      const decodedToken = decodeToken();
      const name = decodedToken?.name ?? "";

  return (
    <div className=" bg-[url('https://res.cloudinary.com/akwaah/image/upload/v1740860331/background_oswjfy.jpg')] bg-no-repeat bg-right bg-cover rounded-xl p-8 mb-8 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-60 backdrop-blur-sm rounded-xl"></div>
      
      <div className="relative z-10">
        <h1 className="text-3xl font-bold mb-2">Welcome {name} 👋!</h1>
        <p className="text-blue-100 mb-6">Worldwide Word Ministries - Raising people to function like Christ Jesus</p>
        
        <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
          <p className="text-sm text-blue-100 mb-1">Theme for the Year 2025</p>
          <h2 className="text-xl font-semibold mb-1">&quot;Walking by Faith, Not by Sight&quot;</h2>
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
  );
};