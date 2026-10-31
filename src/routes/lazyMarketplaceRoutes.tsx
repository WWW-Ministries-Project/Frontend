import { lazy } from "react";

// Marketplace screens are code-split to keep the main bundle under the
// PWA precache limit (workbox.maximumFileSizeToCacheInBytes).
export const MarketPlace = lazy(() =>
  import("@/pages/HomePage/pages/MarketPlace/MarketPlace").then((m) => ({
    default: m.MarketPlace,
  })),
);
export const AddProduct = lazy(() =>
  import("@/pages/HomePage/pages/MarketPlace/pages/AddProduct").then((m) => ({
    default: m.AddProduct,
  })),
);
export const MarketDetails = lazy(() =>
  import("@/pages/HomePage/pages/MarketPlace/pages/MarketDetail").then((m) => ({
    default: m.MarketDetails,
  })),
);
export const Market = lazy(() => import("@/pages/MembersPage/Pages/Market"));
export const ProductDetailsPage = lazy(() =>
  import("@/pages/MembersPage/Pages/ProductDetailsPage").then((m) => ({
    default: m.ProductDetailsPage,
  })),
);
export const CheckOutPage = lazy(() =>
  import("@/pages/MembersPage/Pages/CheckOutPage").then((m) => ({
    default: m.CheckOutPage,
  })),
);
export const ProductsPage = lazy(
  () => import("@/pages/MembersPage/Pages/ProductsPage"),
);
export const MyOrders = lazy(() =>
  import("@/pages/MembersPage/Pages/MyOrders").then((m) => ({
    default: m.MyOrders,
  })),
);
export const OrderDetailsPage = lazy(() =>
  import("@/pages/MembersPage/Pages/OrderDetailsPage").then((m) => ({
    default: m.OrderDetailsPage,
  })),
);
export const VerifyPayment = lazy(
  () => import("@/pages/MembersPage/Pages/VerifyPayment"),
);
export const MarketplaceAnalytics = lazy(
  () => import("@/pages/HomePage/pages/MarketPlace/pages/MarketplaceAnalytics"),
);
export const MarketplaceOverview = lazy(() =>
  import("@/pages/HomePage/pages/MarketPlace/pages/MarketplaceOverview").then(
    (m) => ({ default: m.MarketplaceOverview }),
  ),
);
export const AllProducts = lazy(() =>
  import("@/pages/HomePage/pages/MarketPlace/pages/AllProducts").then((m) => ({
    default: m.AllProducts,
  })),
);
export const AllOrders = lazy(() =>
  import("@/pages/HomePage/pages/MarketPlace/pages/AllOrders").then((m) => ({
    default: m.AllOrders,
  })),
);
export const AdminOrderDetail = lazy(() =>
  import("@/pages/HomePage/pages/MarketPlace/pages/AdminOrderDetail").then(
    (m) => ({ default: m.AdminOrderDetail }),
  ),
);
