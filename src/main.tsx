import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
// import LandingPage from "./pages/LandingPage/LandingPage.jsx";
import { BrowserRouter } from "react-router-dom";
import { NotificationDeviceConnector } from "./features/notifications/NotificationDeviceConnector";
import { NotificationRealtimeConnector } from "./features/notifications/NotificationRealtimeConnector";
import { NotificationCard } from "./components/NotificationCard";
import { AuthWrapper } from "./context/AuthWrapper";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";
import "flag-icons/css/flag-icons.min.css";
import { RenderRoutes } from "./routes/RenderRoutes.jsx";

if (import.meta.env.PROD) {
  registerSW({
    immediate: true,
  });
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <ThemeProvider>
    {/* <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode> */}
    <BrowserRouter>
      {/* <RenderRoutes  /> */}
      <AuthWrapper>
        <>
          <NotificationDeviceConnector />
          <NotificationRealtimeConnector />
          <RenderRoutes />
          <NotificationCard />
        </>
      </AuthWrapper>
    </BrowserRouter>
  </ThemeProvider>
);
