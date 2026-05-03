import { useUserStore } from "@/store/userStore";

export const WelcomeHeader = ({ showFull = false, theme }: { showFull?: boolean, theme?: any }) => {
  const name = useUserStore((state) => state.name);
  const themeImage = theme?.imageUrl || theme?.image;
  const defaultBanner =
    "https://res.cloudinary.com/akwaah/image/upload/v1740860331/background_oswjfy.jpg";

  return (
    <div
      className={`${
        showFull
          ? "relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]"
          : "rounded-xl "
      }`}
    >
      <div
        className={`bg-no-repeat bg-center bg-cover py-6 text-white relative overflow-hidden ${
          showFull ? "app-layout-container py-4" : "rounded-xl px-6"
        }`}
        style={{ backgroundImage: `url(${themeImage || defaultBanner})` }}
      >
        <div className="absolute inset-0 bg-black opacity-70 backdrop-blur-sm rounded-xl"></div>

        <div className="relative  ">
          <h1 className="text-lg sm:text-xl md:text-3xl font-bold mb-2">
            Welcome {name} 👋!
          </h1>
          <p className="text-blue-100 mb-6 text-sm md:text-base">
            Worldwide Word Ministries - Raising people to function like Christ
            Jesus
          </p>

          {theme && (
            <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-sm text-blue-100 mb-1">
                Theme for the Year {new Date().getFullYear()}
              </p>
              <h2 className="text-lg md:text-xl font-semibold mb-1">
                {/* &quot; */}
              {theme?.title ?? ""}
              {/* &quot; */}
            </h2>
            <p className="font-medium">{theme?.verse ?? ""}</p>
            <p className="text-sm text-blue-200 italic">{theme?.verseReference ?? ""}</p>
          </div>)}
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
