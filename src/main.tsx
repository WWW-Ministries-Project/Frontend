import ReactDOM from "react-dom/client";
// import LandingPage from "./pages/LandingPage/LandingPage.jsx";
import { BrowserRouter } from "react-router-dom";
import { NotificationCard } from "./components/NotificationCard";
import { ScrollbarVisibilityManager } from "./components/ScrollbarVisibilityManager";
import { AuthWrapper } from "./context/AuthWrapper";
import "./index.css";
import { RenderRoutes } from "./routes/RenderRoutes.jsx";




ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  // <React.StrictMode>
  //   <RouterProvider router={router} />
  // </React.StrictMode>
  <BrowserRouter>
    {/* <RenderRoutes  /> */}
    <AuthWrapper>
      <>
        <ScrollbarVisibilityManager />
        <RenderRoutes />
        <NotificationCard />
      </>
    </AuthWrapper>
  </BrowserRouter>
);
