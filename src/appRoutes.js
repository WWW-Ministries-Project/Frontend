const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
    errorElement: <ErrorPage/>
  },
  {
    path: "/login",
    element: <LoginPage />,
    
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
    
  },  
  {
    path: "/reset-password",
    element: <ResetPassword />,
    
  },  
  {
    path: "/home",
    element: <HomePage />,
    children: [
      {
        path: "",
        element: <DashBoard />,
      },
      {
        path: "dashboard",
        element: <DashBoard />,
      },
      {
        path: "members",
        element: <Members />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "*",
        element: <UnderConstruction />,
      },
    ],
    errorElement: <ErrorPage/>
    
  },  
]);