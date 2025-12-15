import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./index.css";
import { App } from "./App";
import { Home } from "./pages/Home";
import { Error } from "./components/Error";
import { CustomerAuthProvider } from "./context/CustomerAuthProvider";
import { AdminAuthProvider } from "./context/AdminAuthProvider.jsx";
import { AdminAuth } from "./Admin/AdminAuth";
import { AdminsAuth } from "./Admin/AdminsAuth";

import { ProtectedAdminRoute } from "./routes/ProtectedAdminRoute.jsx";

// Admin Components
import { AdminMainLayout } from "./Admin/AdminMainLayout.jsx";
import { AdminHome } from "./Admin/AdminHome.jsx";
import { AdminProduct } from "./Admin/AdminProduct.jsx";
import { AdminCreateProduct } from "./Admin/AdminCreateProduct";
import { AdminAllProduct } from "./Admin/AdminAllProduct.jsx";
import { AdminOrders } from "./Admin/AdminOrders.jsx";
import { AdminEmployee } from "./Admin/AdminEmployee";
import { AdminViewOrder } from "./Admin/AdminViewOrder";
import { AdminOrderHistory } from "./Admin/AdminOrderHistory";
import { WomenCategory } from "./pages/WomenCategory";
import { MenCategory } from "./pages/MenCategory";
import { ProductDetail } from "./pages/ProductDetail";
import { CheckoutPage } from "./Customer/CheckoutPage";
import { ProtectedCartRoute } from "./routes/ProtectedCartRoute";
import { AdminContent } from "./Admin/AdminContent";
import { AdminHomeCMS } from "./Admin/AdminHomeCMS";
import { AdminAboutPage } from "./Admin/AdminAboutPage";
import { AdminPrivacyPage } from "./Admin/AdminPrivacyPage";
import { AdminTermsPage } from "./Admin/AdminTermsPage";
import { AdminChatbotPage } from "./Admin/AdminChatbotPage";

import { AdminSales } from "./Admin/AdminSales";
import { SalesReports } from "./Admin/SalesReports";
import { TransactionReports } from "./Admin/TransactionReports";
import { AuditLog } from "./Admin/AuditLog";

import { AdminCoupons } from "./Admin/AdminCoupons";
import { CreateCoupons } from "./Admin/CreateCoupons";

import { Toaster } from "sonner"; // ✅ import here

import { CartProvider } from "./context/CartProvider";
import { ProtectedCustomerRoute } from "./routes/ProtectedCustomerRoute";

import { SuccessPage } from "./Customer/SuccessPage";
import { CancelledPage } from "./Customer/CancelledPage";
import { FailedPage } from "./Customer/FailedPage";

import { OrderHistory } from "./Customer/OrderHistory";
import { Vouchers } from "./Customer/Vouchers";
import { SaveAddress } from "./Customer/SaveAddress";

import { NewArrivalsTag } from "./pages/NewArrivalsTag";
import { SpecialOffersTag } from "./pages/SpecialOffersTag";


import { TermsOfService } from "./pages/TermsOfService";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { AboutUs } from "./pages/AboutUs";

import { AdminOrderExchange } from "./Admin/AdminOrderExchange";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <Error />,
    children: [
      { index: true, element: <Home /> },
      { path: "terms-of-service", element: <TermsOfService /> },
      { path: "privacy-policy", element: <PrivacyPolicy /> },
      { path: "about-us", element: <AboutUs /> },
      { path: "women/:type", element: <WomenCategory /> },
      { path: "men/:type", element: <MenCategory /> },
      { path: "new-arrivals", element: <NewArrivalsTag /> },
      { path: "special-offers", element: <SpecialOffersTag /> },
      {
        path: ":category/:type/:productName/:sku",
        element: <ProductDetail />,
      },
      {
        path: "checkout",
        element: (
          <ProtectedCustomerRoute>
            <ProtectedCartRoute>
              <CheckoutPage />
            </ProtectedCartRoute>
          </ProtectedCustomerRoute>
        ),
      },
      {
        path: "checkout/success",
        element: (
          <ProtectedCustomerRoute>
            <SuccessPage />
          </ProtectedCustomerRoute>
        ),
      },
      {
        path: "checkout/cancelled",
        element: (
          <ProtectedCustomerRoute>
            <CancelledPage />
          </ProtectedCustomerRoute>
        ),
      },
      {
        path: "checkout/failure",
        element: (
          <ProtectedCustomerRoute>
            <FailedPage />
          </ProtectedCustomerRoute>
        ),
      },
      {
        path: "Save-Address",
        element: (
          <ProtectedCustomerRoute>
            <SaveAddress />
          </ProtectedCustomerRoute>
        ),
      },

      {
        path: "Order-History",
        element: (
          <ProtectedCustomerRoute>
            <OrderHistory />
          </ProtectedCustomerRoute>
        ),
      },
      {
        path: "Vouchers",
        element: (
          <ProtectedCustomerRoute>
            <Vouchers />
          </ProtectedCustomerRoute>
        ),
      },
    ],
  },
  {
    path: "admin-auth-splnd",
    element: <AdminAuth />,
    errorElement: <Error />,
  },
  {
    path: "admins-auth-splnd",
    element: <AdminsAuth />,
    errorElement: <Error />,
  },
  {
    path: "Admin",
    element: (
      <ProtectedAdminRoute requiredModules={["dashboard"]}>
        <AdminMainLayout />
      </ProtectedAdminRoute>
    ),
    errorElement: <Error />,
    children: [
      {
        index: true,
        element: (
          <ProtectedAdminRoute requiredModules={["dashboard"]}>
            <AdminHome />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "Products",
        element: (
          <ProtectedAdminRoute requiredModules={["products"]}>
            <AdminProduct />
          </ProtectedAdminRoute>
        ),
        children: [
          {
            index: true,
            element: (
              <ProtectedAdminRoute requiredModules={["products"]}>
                <AdminCreateProduct />
              </ProtectedAdminRoute>
            ),
          },
          {
            path: "View-Products",
            element: (
              <ProtectedAdminRoute requiredModules={["products"]}>
                <AdminAllProduct />
              </ProtectedAdminRoute>
            ),
          },
        ],
      },

      {
        path: "Orders",
        element: (
          <ProtectedAdminRoute requiredModules={["orders"]}>
            <AdminOrders />
          </ProtectedAdminRoute>
        ),
        children: [
          {
            index: true,
            element: (
              <ProtectedAdminRoute requiredModules={["orders"]}>
                <AdminViewOrder />
              </ProtectedAdminRoute>
            ),
          },
          {
            path: "History",
            element: (
              <ProtectedAdminRoute requiredModules={["orders"]}>
                <AdminOrderHistory />
              </ProtectedAdminRoute>
            ),
          },
          {
            path: "Exchange",
            element: (
              <ProtectedAdminRoute requiredModules={["orders"]}>
                <AdminOrderExchange />
              </ProtectedAdminRoute>
            ),
          },
        ],
      },

      {
        path: "Employee",
        element: (
          <ProtectedAdminRoute requiredModules={["admins"]}>
            <AdminEmployee />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "Contents",
        element: (
          <ProtectedAdminRoute requiredModules={["contents"]}>
            <AdminContent />
          </ProtectedAdminRoute>
        ),
        children: [
          {
            index: true,
            element: (
              <ProtectedAdminRoute requiredModules={["contents"]}>
                <AdminHomeCMS />
              </ProtectedAdminRoute>
            ),
          },
          {
            path: "About",
            element: (
              <ProtectedAdminRoute requiredModules={["contents"]}>
                <AdminAboutPage />
              </ProtectedAdminRoute>
            ),
          },
          {
            path: "Privacy",
            element: (
              <ProtectedAdminRoute requiredModules={["contents"]}>
                <AdminPrivacyPage />
              </ProtectedAdminRoute>
            ),
          },
          {
            path: "Terms-and-Conditions",
            element: (
              <ProtectedAdminRoute requiredModules={["contents"]}>
                <AdminTermsPage />
              </ProtectedAdminRoute>
            ),
          },
          {
            path: "Chatbot",
            element: (
              <ProtectedAdminRoute requiredModules={["contents"]}>
                <AdminChatbotPage />
              </ProtectedAdminRoute>
            ),
          },
        ],
      },
      {
        path: "Reports",
        element: (
          <ProtectedAdminRoute requiredModules={["reports"]}>
            <AdminSales />
          </ProtectedAdminRoute>
        ),
        children: [
          {
            index: true,
            element: (
              <ProtectedAdminRoute requiredModules={["reports"]}>
                <SalesReports />
              </ProtectedAdminRoute>
            ),
          },
          {
            path: "Transactions",
            element: (
              <ProtectedAdminRoute requiredModules={["reports"]}>
                <TransactionReports />
              </ProtectedAdminRoute>
            ),
          },
          {
            path: "Audit-Log",
            element: (
              <ProtectedAdminRoute requiredModules={["reports"]} requireSuperAdmin={true}>
                <AuditLog />
              </ProtectedAdminRoute>
            ),
          }
        ],
      },
      {
        path: "Coupons",
        element: (
          <ProtectedAdminRoute requiredModules={["coupons"]}>
            <AdminCoupons />
          </ProtectedAdminRoute>
        ),
        children: [
          {
            index: true,
            element: (
              <ProtectedAdminRoute requiredModules={["coupons"]}>
                <CreateCoupons />
              </ProtectedAdminRoute>
            ),
          },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <CustomerAuthProvider>
      <AdminAuthProvider>
        <CartProvider>
          <RouterProvider router={router} />
          <Toaster richColors position="top-center" />
        </CartProvider>
      </AdminAuthProvider>
    </CustomerAuthProvider>
  </StrictMode>
);
