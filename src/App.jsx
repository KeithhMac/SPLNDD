import { Outlet } from "react-router-dom";
import { Header } from "./components/Header";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Footer } from "./pages/Footer";
import { ChatBot } from "./components/ChatBot";

export const App = () => {
  function ScrollToTop() {
    const location = useLocation();

    useEffect(() => {
      const excludedRoutes = [
        "/Collections-Splendid",
        "/Collections-Splendid/New-Arrivals",
        "/Collections-Splendid/Top-Choice",
      ];

      const shouldScroll = !excludedRoutes.some((route) =>
        location.pathname.startsWith(route)
      );

      if (shouldScroll) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, [location.pathname]);

    return null;
  }
  return (
    <>
      <ScrollToTop />

      <div
        className="bg-[#fffcf2]
      min-h-[auto] w-[100%] flex flex-col items-center p-4"
      >
        <Header />

        <div className="min-h-screen w-full">
          <Outlet />
        </div>

        <ChatBot />
      </div>
      <div className="w-full">
        <Footer />
      </div>
    </>
  );
};
