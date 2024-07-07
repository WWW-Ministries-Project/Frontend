import underConstruction from "/src/assets/underconstruction.svg";

const UnderConstruction = () => {
  return (
    <div className="h-full w-full bg-inherit flex items-center justify-center  ">
      <div className="max-w-md p-8  rounded-md">
        <h1 className="text-3xl font-bold mb-4">Under Construction</h1>
        <p className="text-gray-700 mb-6">We are currently working on this page. Please check back later!</p>
        <img src={underConstruction} alt="Under Construction" className="mx-auto mb-6 w-[50%]" />
        <p className="text-gray-600 text-sm">Thank you for your patience.</p>
      </div>
    </div>
  );
};

export default UnderConstruction;
