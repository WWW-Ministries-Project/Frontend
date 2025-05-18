import loader from "@/assets/images/main_loader.gif";
import { useLoaderStore } from "@/pages/HomePage/store/globalComponentsStore";

export const LoaderComponent = () => {
  const { loading } = useLoaderStore();
  return (
    <div
      className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 ${
        loading ? "block" : "hidden"
      }`}
    >
      <img src={loader} alt="loader" />
    </div>
  );
};
