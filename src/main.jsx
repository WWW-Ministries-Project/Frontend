import ReactDOM from "react-dom/client";
// import LandingPage from "./pages/LandingPage/LandingPage.jsx";
import { BrowserRouter } from "react-router-dom";
import { AuthWrapper } from "./auth/AuthWrapper.jsx";
import "./index.css";
import { RenderRoutes } from "./routes/RenderRoutes.jsx";



// const router = createBrowserRouter([
//   // {
//   //   path: "/",
//   //   element: <LandingPage />,
//   //   errorElement: <ErrorPage/>
//   // },
//   {
//     path: "/",
//     element: <LoginPage />,
//     errorElement: <ErrorPage/>
//   },
//   {
//     path: "/login",
//     element: <LoginPage />,
    
//   },
//   {
//     path: "/forgot-password",
//     element: <ForgotPassword />,
    
//   },  
//   {
//     path: "/reset-password",
//     element: <ResetPassword />,
    
//   },  
//   {
//     path: "/home",
//     element: <HomePage />,
//     children: [
//       {
//         path: "",
//         element: <DashBoard />,
//       },
//       {
//         path: "dashboard",
//         element: <DashBoard />,
//       },
//       {
//         path: "members",
//         element: <Members />,
//       },
//       {
//         path: "settings",
//         element: <Settings />,
//       },
//       {
//         path: "Assets management",
//         element: <AssetManagement />,
//       },
//       {
//         path: "*",
//         element: <UnderConstruction />,
//       },
//     ]
    
//   },  
// ]);


ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
  //   <RouterProvider router={router} />
  // </React.StrictMode>
  <BrowserRouter>
    {/* <RenderRoutes  /> */}
    <AuthWrapper>
      <RenderRoutes />
    </AuthWrapper>
  </BrowserRouter>
);
