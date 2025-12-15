import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Menu, X, ShoppingCart, UserRound, UserRoundCheck, Eye, EyeOff } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { Input } from "./ui/input";
import ReCAPTCHA from "react-google-recaptcha";

import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { CustomerAuthContext } from "../context/CustomerAuthContext";
import api from "../api/axios.js";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChevronDown,
  TicketPercent,
  UserRoundPen,
  PackageSearch,
  Undo2,
} from "lucide-react";

import WomensBanner1 from "../Images/Home-Img3.png"
import WomensBanner2 from "../Images/Home-Img2.png"
import MensBanner1 from "../Images/Home-Img8.png"
import MensBanner2 from "../Images/Home-Img9.png"
import MobileBanner from "../Images/Home-Img11.png"

import SplnddLogo from "../Images/splndd-main-logo-new.png"


import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { ScrollArea } from "./ui/scroll-area";

export const Header = () => {
  const navigate = useNavigate();
  // const [otpVisible, setOtpVisible] = useState(false);
  const [openPopover, setOpenPopover] = useState(null);

  // reCAPTCHA v2 single widget (only on Sign In view)
  const recaptchaRef = useRef(null);
  // const [captchaToken, setCaptchaToken] = useState(null);

  // reCAPTCHA for Resend (appears under OTP view when user clicks Resend)
  const recaptchaResendRef = useRef(null);
  const [, setCaptchaResendToken] = useState(null);
  // const [showResendCaptcha, setShowResendCaptcha] = useState(false);

  // Input ref so we can autofocus when returning to sign-in
  // const emailInputRef = useRef(null);

  // Mobile menu states
  const [isWomenOpen, setIsWomenOpen] = useState(false);
  const [isMenOpen, setIsMenOpen] = useState(false);

  const handleToggle = (category) => {
    setOpenPopover((prev) => (prev === category ? null : category));
  };

  const [menuData, setMenuData] = useState([]);

  const {
    cart,
    cartLoaded,
    totalOrders,
    totalPrice,
    updateQuantity,
    removeFromCart,
  } = useCart();


  // Checkout loading state
  const [checkOutLoading, setCheckoutLoading] = useState(false);

  const handleCheckout = () => {
    if (!cartLoaded || cart.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    setCheckoutLoading(true);

    setTimeout(() => {
      navigate("/checkout");
      closeModals();
      setCheckoutLoading(false);
    }, 2000);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/customer/products/nav-menu");
        setMenuData(res.data);
      } catch (err) {
        console.error("Failed to fetch nav menu", err);
      }
    })();
  }, []);

  // UI Toggles
  const [isHamburgerOpen, setHamburgerOpen] = useState(false); // mobile menu
  const [isCustomerCartOpen, setIsCustomerCartOpen] = useState(false); // cart modal
  const [isCustomerAccountOpen, setIsCustomerAccountOpen] = useState(false); // email login modal
  const [isAuthAccountOpen, setIsAuthAccountOpen] = useState(false); // logged-in account modal

  // Auth state
  const { user, refreshAuth } = useContext(CustomerAuthContext);
  const isUserLoggedIn = Boolean(user);

  const didHandleSocialRef = useRef(false);

  useLayoutEffect(() => {
    if (didHandleSocialRef.current) return;

    const hasSocialLoginRef = window.location.search.includes("logged=true");
    if (!hasSocialLoginRef) return;

    didHandleSocialRef.current = true;

    // token fallback from hash: #t=JWT
    const hash = window.location.hash || "";
    const match = hash.match(/[#&]t=([^&]+)/);
    if (match && match[1]) {
      const token = decodeURIComponent(match[1]);
      localStorage.setItem("customer_token", token);
      document.cookie = `customer_acc=${token}; Path=/; Max-Age=604800; SameSite=None; Secure`;
    }

    // refresh once
    refreshAuth().then(() => {
      // clean URL (remove ?logged=true and #t=...)
      const cleanURL = window.location.origin + window.location.pathname;
      window.history.replaceState(null, "", cleanURL);
      toast.success("Logged in successfully!");
    });
  }, [refreshAuth]);

  // Email OTP login state
  // const [loginEmail, setLoginEmail] = useState(""); // email input
  // const [loginOtp, setLoginOtp] = useState(""); // OTP input
  // const [isLoginOtpSent, setIsLoginOtpSent] = useState(false); // Check if OTP has been sent
  // const [isLoginLoading, setIsLoginLoading] = useState(false); // Disable button while loading
  // const [loginError, setLoginError] = useState(""); // Error message for login issues

  // OTP resend state
  // const [resendCountdown, setResendCountdown] = useState(60);
  // const [resendAvailable, setResendAvailable] = useState(false);

  // Clear URL hash on mount
  useEffect(() => {
    if (window.location.hash && window.location.hash !== "#") {
      window.history.replaceState(null, "", window.location.href.split("#")[0]);
    }
  }, []);

  // Countdown timer for OTP resend
  // useEffect(() => {
  //   let timer;

  //   if (isLoginOtpSent && !resendAvailable) {
  //     timer = setInterval(() => {
  //       setResendCountdown((prev) => {
  //         if (prev <= 1) {
  //           clearInterval(timer);
  //           setResendAvailable(true);
  //           return 60;
  //         }
  //         return prev - 1;
  //       });
  //     }, 1000);
  //   }

  //   return () => clearInterval(timer);
  // }, [isLoginOtpSent, resendAvailable]);

  //Close all modals function
  const closeModals = () => {
    setIsCustomerCartOpen(false);
    setIsCustomerAccountOpen(false);
    setHamburgerOpen(false);
    setIsAuthAccountOpen(false);

    // reset both captchas when closing
    if (recaptchaRef.current) {
      try {
        recaptchaRef.current.reset();
      } catch (e) {
        console.warn("reCAPTCHA reset failed:", e);
      }
    }
    if (recaptchaResendRef.current) {
      try {
        recaptchaResendRef.current.reset();
      } catch (e) {
        console.warn("reCAPTCHA resend reset failed:", e);
      }
    }
    // setCaptchaToken(null);
    setCaptchaResendToken(null);
    // setShowResendCaptcha(false);
  };

  // Google Login Handler
  const handleGoogleLogin = async () => {
    try {
      // Redirect to backend route that starts Google OAuth
      window.location.href = `${import.meta.env.VITE_SERVER_URL}/customer/google`;
    } catch (err) {
      console.error("Google login error:", err);
      alert("Failed to start Google Sign-In");
    }
  };

  // ----------------------------
  // reCAPTCHA v2 integration (single widget on Sign In, dynamic on Resend)
  // ----------------------------
  // function handleCaptchaChange(token) {
  //   setCaptchaToken(token);
  //   setLoginError("");
  // }

  // function handleCaptchaResendChange(token) {
  //   setCaptchaResendToken(token);
  //   setLoginError("");

  //   // automatically send a new OTP when user solves the resend captcha
  //   if (resendAvailable && token) {
  //     handleResendOTP(token);
  //   }
  // }

  // Special handler for resend OTP with captcha token
  // const handleResendOTP = async (token) => {
  //   if (!token) {
  //     setLoginError("Please complete the CAPTCHA");
  //     return;
  //   }

  //   setIsLoginLoading(true);
  //   setLoginError("");

  //   try {
  //     const { data } = await api.post(`${import.meta.env.VITE_SERVER_URL}/customer/send-otp`, {
  //       email: loginEmail,
  //       recaptchaToken: token,
  //     });

  //     if (data?.success) {
  //       // On success, restart countdown
  //       setResendAvailable(false);
  //       setResendCountdown(60);
  //       setShowResendCaptcha(false);
  //       toast.success("New OTP sent to your email");
  //     } else {
  //       const msg = data?.message || "Failed to send OTP. Please try again.";
  //       setLoginError(msg);
  //       toast.error(msg);
  //     }
  //   } catch (err) {
  //     console.error("Error sending OTP:", err);
  //     const msg = err.response?.data?.message || "Failed to send OTP. Please try again.";
  //     setLoginError(msg);
  //     toast.error(msg);
  //   } finally {
  //     if (recaptchaResendRef.current) {
  //       try {
  //         recaptchaResendRef.current.reset();
  //       } catch (e) {
  //         console.warn("reCAPTCHA resend reset failed:", e);
  //       }
  //     }
  //     setCaptchaResendToken(null);
  //     setIsLoginLoading(false);
  //   }
  // };

  // Send initial OTP (requires valid recaptchaToken)
  // const sendOTP = async () => {
  //   if (!loginEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail)) {
  //     setLoginError("Please enter a valid email.");
  //     return;
  //   }

  //   if (!captchaToken) {
  //     setLoginError("Please complete the CAPTCHA.");
  //     return;
  //   }

  //   setIsLoginLoading(true);
  //   setLoginError("");

  //   try {
  //     const { data } = await api.post(`${import.meta.env.VITE_SERVER_URL}/customer/send-otp`, {
  //       email: loginEmail,
  //       recaptchaToken: captchaToken,
  //     });

  //     if (data?.success) {
  //       // On success, show OTP inputs and start countdown
  //       setIsLoginOtpSent(true);
  //       setResendAvailable(false);
  //       setResendCountdown(60);
  //       toast.success("OTP sent to your email");
  //     } else {
  //       const msg = data?.message || "Failed to send OTP. Please try again.";
  //       setLoginError(msg);
  //       toast.error(msg);
  //     }
  //   } catch (err) {
  //     console.error("Error sending OTP:", err);
  //     const msg = err.response?.data?.message || "Failed to send OTP. Please try again.";
  //     setLoginError(msg);
  //     toast.error(msg);
  //   } finally {
  //     // reset captcha after attempt
  //     if (recaptchaRef.current) {
  //       try {
  //         recaptchaRef.current.reset();
  //       } catch (e) {
  //         console.warn("reCAPTCHA reset failed:", e);
  //       }
  //     }
  //     setCaptchaToken(null);
  //     setIsLoginLoading(false);
  //   }
  // };

  // Verify OTP and Sign In
  // const verifyOTP = async () => {
  //   setIsLoginLoading(true);
  //   setLoginError("");

  //   try {
  //     const { data } = await api.post(
  //       `${import.meta.env.VITE_SERVER_URL}/customer/verify-otp`,
  //       { email: loginEmail, otp: loginOtp },
  //       { withCredentials: true } // try to receive HttpOnly cookie normally
  //     );

  //     if (data?.success) {
  //       // Save token for Bearer fallback (cookie may be blocked on some mobile browsers)
  //       if (data.token) {
  //         localStorage.setItem("customer_token", data.token);
  //         // still attempt to set a non-HttpOnly cookie (works on same-site)
  //         document.cookie = `customer_acc=${data.token}; Path=/; Max-Age=604800; SameSite=None; Secure`;
  //       }

  //       // Re-check auth (will send Bearer if present)
  //       await refreshAuth?.();

  //       // ✅ Close the login modal & reset fields
  //       setIsCustomerAccountOpen(false);
  //       setLoginOtp("");
  //       setLoginEmail("");
  //       setIsLoginOtpSent(false);
  //       setResendCountdown(60);
  //       setResendAvailable(false);

  //       toast.success("Logged in successfully!");
  //     } else {
  //       const msg = data?.message || "Failed to verify OTP. Try again.";
  //       setLoginError(msg);
  //       toast.error(msg);
  //     }
  //   } catch (err) {
  //     console.error("Error verifying OTP:", err);

  //     let msg;
  //     // Add handling for rate limit exceeded (status code 429)
  //     if (err.response?.status === 429) {
  //       msg = err.response.data?.message || "Too many attempts. Please try again after 15 minutes.";
  //     } else if (err.response?.status === 401) {
  //       msg = "Invalid OTP. Please try again.";
  //     } else if (err.response?.status === 410) {
  //       msg = "OTP expired. Please request a new one.";
  //     } else {
  //       msg = err.response?.data?.message || "Failed to verify OTP. Try again.";
  //     }

  //     setLoginError(msg);
  //     toast.error(msg);
  //   } finally {
  //     setIsLoginLoading(false);
  //   }
  // };

  // // When Resend is clicked: show the resend captcha under OTP
  // const handleShowResendCaptcha = () => {
  //   if (!resendAvailable) return;
  //   setShowResendCaptcha(true);
  // };

  // Logout handler
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await api.get("/customer/logout");

      if (res.data?.success) {
        toast.success("Logged out successfully!");
      }
    } catch (err) {
      console.error("Logout failed:", err);
      toast.error("Logout failed. Please try again.");
    } finally {
      localStorage.removeItem("customer_token");
      document.cookie = "customer_acc=; Path=/; Max-Age=0; SameSite=None; Secure";
      setLoggingOut(false);
      navigate(0);
    }
  };

  return (
    <div className="bg-[#F6E0D2]/75 backdrop-blur min-h-[4rem] w-[95%] rounded-full flex justify-around items-center sticky top-4 z-50 mb-[-3rem] p-5">
      <div className="flex items-center justify-between w-full  px-4">
        <div className="flex gap-2">
          {/* Mobile Hamburger Menu Toggle */}
          <div className="md:hidden flex items-center ">
            <button
              className="md:hidden text-black text-2xl relative w-8 h-8 cursor-pointer"
              onClick={() => {
                if (!isHamburgerOpen) {
                  closeModals();
                  setHamburgerOpen(true);
                } else {
                  setHamburgerOpen(false);
                }
              }}
            >
              <div
                className="flex justify-center items-center absolute inset-0 transition-transform duration-300 ease-in-out"
                style={{
                  transform: isHamburgerOpen ? "rotate(180deg)" : "rotate(0deg)",
                  opacity: isHamburgerOpen ? 0 : 1,
                }}
              >
                <Menu size={25} />
              </div>
              <div
                className="absolute inset-0 transition-transform duration-300 ease-in-out"
                style={{
                  transform: isHamburgerOpen ? "rotate(0deg)" : "rotate(-180deg)",
                  opacity: isHamburgerOpen ? 1 : 0,
                }}
              >
                <X size={32} className="text-[#BC6C25] hover:text-[#283618]" />
              </div>
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {isHamburgerOpen && (
            <div className="absolute w-full top-[5rem] left-1 bg-[#fffcf2] rounded-[1.3rem] border border-gray-300 shadow-lg p-4 md:hidden">
              <nav className="flex flex-col sm:flex-row  gap-3">

                <div className="flex flex-col w-[15rem] p-5 gap-2">


                  {/* Women Section */}
                  <div className="w-full">
                    <button
                      type="button"
                      onClick={() => setIsWomenOpen((prev) => !prev)}
                      className="flex items-center justify-between w-full cursor-pointer text-[1rem] text-black hover:text-[#BC6C25] transition-transform duration-300 ease-in-out hover:scale-105"
                    >
                      Women
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-300 ${isWomenOpen ? "rotate-180" : "rotate-0"
                          }`}
                      />
                    </button>

                    {isWomenOpen && (
                      <div className="ml-4 mt-2 flex flex-col gap-1">
                        {(() => {
                          const category = menuData.find((item) => item.category === "Women")

                          if (!category) {
                            // no category object at all
                            return <p className="text-sm text-gray-500 italic">Coming soon⭐</p>
                          }

                          if (!category.types || category.types.length === 0) {
                            // category exists but no types
                            return <p className="text-sm text-gray-500 italic">Coming soon⭐</p>
                          }

                          // types exist → map them
                          return category.types.map((type) => (
                            <NavLink
                              key={type.id}
                              to={`/women/${type.name.toLowerCase().replace(/\s+/g, "-")}`}
                              onClick={() => setHamburgerOpen(false)}
                              className={({ isActive }) =>
                                `text-[0.9rem] py-1 transition-transform duration-300 ease-in-out hover:scale-105 ${isActive ? "font-bold text-[#BC6C25]" : "text-black hover:text-[#BC6C25]"
                                }`
                              }
                            >
                              {type.name}
                            </NavLink>
                          ))
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Men Section */}
                  <div className="w-full">
                    <button
                      type="button"
                      onClick={() => setIsMenOpen((prev) => !prev)}
                      className="flex items-center justify-between w-full cursor-pointer text-[1rem] text-black hover:text-[#BC6C25] transition-transform duration-300 ease-in-out hover:scale-105"
                    >
                      Men
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-300 ${isMenOpen ? "rotate-180" : "rotate-0"
                          }`}
                      />
                    </button>

                    {isMenOpen && (
                      <div className="ml-4 mt-2 flex flex-col gap-1">
                        {(() => {
                          const category = menuData?.find?.((item) => item.category === "Men");

                          if (!category) {
                            // no "Men" category at all (e.g., backend paused or empty)
                            return <p className="text-sm text-gray-500 italic">Coming soon⭐</p>;
                          }

                          if (!category.types || category.types.length === 0) {
                            // category exists but has no types
                            return <p className="text-sm text-gray-500 italic">Coming soon⭐</p>;
                          }

                          // render types
                          return category.types.map((type) => (
                            <NavLink
                              key={type.id}
                              to={`/men/${type.name.toLowerCase().replace(/\s+/g, "-")}`}
                              onClick={() => setHamburgerOpen(false)}
                              className={({ isActive }) =>
                                `text-[0.9rem]  py-1 transition-transform duration-300 ease-in-out hover:scale-105 ${isActive ? "font-bold text-[#BC6C25]" : "text-black hover:text-[#BC6C25]"
                                }`
                              }
                            >
                              {type.name}
                            </NavLink>
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                  {/* New Arrivals */}
                  <NavLink
                    to="/new-arrivals"
                    onClick={() => setHamburgerOpen(false)}
                    className={({ isActive }) =>
                      `text-[1rem] transition-transform duration-300 ease-in-out hover:scale-105 ${isActive
                        ? "font-bold text-[#BC6C25]"
                        : "text-black hover:text-[#BC6C25]"
                      }`
                    }
                  >
                    New Arrivals
                  </NavLink>

                  {/* Special Offers */}
                  <NavLink
                    to="/special-offers"
                    onClick={() => setHamburgerOpen(false)}
                    className={({ isActive }) =>
                      `text-[1rem] transition-transform duration-300 ease-in-out hover:scale-105 ${isActive
                        ? "font-bold text-[#BC6C25]"
                        : "text-black hover:text-[#BC6C25]"
                      }`
                    }
                  >
                    Special Offers
                  </NavLink>
                </div>
                <div className="w-full "> <img src={MobileBanner} className="w-full object-cover rounded-lg" /> </div>

              </nav>
            </div>
          )}
          {/* Logo */}
          <div className="flex justify-center items-center md:static">
            <Link
              to="/"
              onClick={closeModals}
            // className="Font-telma-bold text-2xl font-bold"
            >
              {/* SPLND'D */}
              <img src={SplnddLogo} alt="SPLND Logo" className="w-20 h-auto" />
            </Link>
          </div>
        </div>
        {/* Main Navigation (desktop only) */}
        <nav className="hidden md:flex gap-[2rem] items-center relative text-sm">
          {/* WOMEN Popover */}
          <Popover
            open={openPopover === "Women"}
            onOpenChange={(open) => setOpenPopover(open ? "Women" : null)}
          >
            <PopoverTrigger
              className="flex items-center gap-1 hover:text-[#BC6C25] transition cursor-pointer"
              onClick={() => {
                handleToggle("Women");
                closeModals();
              }}
            >
              WOMEN'S
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${openPopover === "Women" ? "rotate-180" : "rotate-0"
                  }`}
              />
            </PopoverTrigger>

            <PopoverContent
              className="relative top-8 min-h-[15rem] w-[auto] rounded-lg shadow-lg hidden md:flex  gap-2 p-[1rem] border border-gray-300  bg-[#fffcf2] 
             data-[state=open]:animate-slideIn data-[state=closed]:animate-slideOut 
             transition-all duration-300 ease-in-out"
              align="start"
            >
              <div className="p-4 flex flex-col gap-2">
                {(() => {
                  const category = menuData.find((item) => item.category === "Women");

                  if (!category || !category.types || category.types.length === 0) {
                    return (
                      <p className="text-sm text-gray-500 italic">
                        No product  available
                      </p>
                    );
                  }

                  return category.types.map((type) => (
                    <NavLink
                      key={type.id}
                      to={`/women/${type.name.toLowerCase().replace(/\s+/g, "-")}`}
                      className="w-[6rem]"
                    >
                      <span className="text-[1.2rem] font-semibold">{type.name}</span>
                    </NavLink>
                  ));
                })()}
              </div>
              <div className="w-[30rem] h-[15rem] flex gap-3"> <img src={WomensBanner1} className="w-full object-cover rounded-lg" />
                <img src={WomensBanner2} className="w-full object-cover rounded-lg" />

              </div>

            </PopoverContent>
          </Popover>

          {/* MEN Popover */}
          <Popover
            open={openPopover === "Men"}
            onOpenChange={(open) => setOpenPopover(open ? "Men" : null)}
          >
            <PopoverTrigger
              className="flex items-center gap-3 cursor-pointer hover:text-[#BC6C25] transition"
              onClick={() => {
                handleToggle("Men");
                closeModals();
              }}
            >
              MEN'S
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${openPopover === "Men" ? "rotate-180" : "rotate-0"
                  }`}
              />
            </PopoverTrigger>

            <PopoverContent
              className="absolute top-8 min-h-[15rem] w-[auto] rounded-lg shadow-lg hidden md:flex gap-2 p-[1rem] border border-gray-300 bg-[#fffcf2] 
             data-[state=open]:animate-slideIn data-[state=closed]:animate-slideOut 
             transition-all duration-300 ease-in-out"
              align="start"
            >


              <div className="p-4 flex flex-col gap-2">
                {(() => {
                  const category = menuData.find((item) => item.category === "Men");

                  if (!category || !category.types || category.types.length === 0) {
                    return (
                      <p className="text-sm text-gray-500 italic">
                        Coming soon⭐
                      </p>
                    );
                  }

                  return category.types.map((type) => (
                    <NavLink
                      key={type.id}
                      to={`/men/${type.name.toLowerCase().replace(/\s+/g, "-")}`}
                      className="w-[6rem]"
                    >
                      <span className="text-[1.2rem] font-semibold">{type.name}</span>
                    </NavLink>
                  ));
                })()}
              </div>
              <div className="w-[30rem] h-[15rem]  flex gap-3"> <img src={MensBanner1} className="w-full object-cover rounded-lg" />
                <img src={MensBanner2} className="w-full object-cover rounded-lg" />
              </div>
            </PopoverContent>
          </Popover>
          {/* Static Links */}
          <NavLink
            to="/new-arrivals"
            onClick={closeModals}
            className="hover:text-[#BC6C25]"
          >
            NEW ARRIVALS
          </NavLink>
          <NavLink
            to="/special-offers"
            onClick={closeModals}
            className="hover:text-[#BC6C25]"
          >
            SPECIAL OFFERS
          </NavLink>
        </nav>

        {/* Right section: cart, user icon, hamburger*/}
        <div className=" flex flex-row gap-2 items-center ">
          {/* Cart Icon Toggle */}
          <div
            className="relative w-8 h-8 cursor-pointer"
            onClick={() => {
              if (!isCustomerCartOpen) {
                closeModals();
                setIsCustomerCartOpen(true);
              } else {
                setIsCustomerCartOpen(false);
              }
            }}
          >
            {/* Cart icon in and out */}
            <div
              className="flex justify-center items-center absolute inset-0 transition-transform duration-300 ease-in-out"
              style={{
                transform: isCustomerCartOpen
                  ? "rotate(180deg)"
                  : "rotate(0deg)",
                opacity: isCustomerCartOpen ? 0 : 1,
              }}
            >
              <ShoppingCart size={25} className=" hover:text-[#283618]" />
            </div>
            <div
              className="absolute inset-0 transition-transform duration-300 ease-in-out"
              style={{
                transform: isCustomerCartOpen
                  ? "rotate(0deg)"
                  : "rotate(-180deg)",
                opacity: isCustomerCartOpen ? 1 : 0,
              }}
            >
              <X size={32} className="text-[#BC6C25] hover:text-[#283618]" />
            </div>

            {/* ✅ Cart Badge */}
            {totalOrders !== 0 && (
              <div className="absolute -top-3 -right-1 rounded-full px-[6px] py-[2px] bg-red-700 text-white font-semibold text-center text-[10px] z-50">
                {totalOrders}
              </div>
            )}
          </div>

          {/* Account Toggle */}
          <div
            className="relative w-8 h-8 cursor-pointer"
            onClick={() => {
              closeModals();
              isUserLoggedIn
                ? setIsAuthAccountOpen(!isAuthAccountOpen)
                : setIsCustomerAccountOpen(!isCustomerAccountOpen);
            }}
          >
            {/* Icon swap: user or close (X) */}
            <div
              className="flex justify-center items-center absolute inset-0 transition duration-300"
              style={{
                transform:
                  (isUserLoggedIn && isAuthAccountOpen) ||
                    (!isUserLoggedIn && isCustomerAccountOpen)
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                opacity:
                  (isUserLoggedIn && isAuthAccountOpen) ||
                    (!isUserLoggedIn && isCustomerAccountOpen)
                    ? 0
                    : 1,
              }}
            >
              {isUserLoggedIn ? (
                <UserRoundCheck
                  size={25}
                  className="text-green-600 hover:text-green-800"
                />
              ) : (
                <UserRound size={25} className=" hover:text-[#283618]" />
              )}
            </div>
            <div
              className="absolute inset-0 transition duration-300"
              style={{
                transform:
                  (isUserLoggedIn && isAuthAccountOpen) ||
                    (!isUserLoggedIn && isCustomerAccountOpen)
                    ? "rotate(0deg)"
                    : "rotate(-180deg)",
                opacity:
                  (isUserLoggedIn && isAuthAccountOpen) ||
                    (!isUserLoggedIn && isCustomerAccountOpen)
                    ? 1
                    : 0,
              }}
            >
              <X size={32} className="text-[#BC6C25] hover:text-[#283618]" />
            </div>
          </div>
        </div>
      </div>

      {/* Cart Modal Content */}
      {isCustomerCartOpen && (
        <div className="absolute right-0 top-[4.5rem] bg-[#fffcf2] border border-gray-300 w-full sm:w-[21rem] shadow-lg  rounded-lg mt-2 z-50">
          <div className="flex flex-col p-2 gap-4">
            {/* Close */}
            <h3 className="flex items-center justify-between text-sm font-semibold text-[#283618]">
              Your Cart
            </h3>

            {/* Items */}
            <ScrollArea className="min-h-[5rem] max-h-[15rem] w-full p-3 flex flex-col gap-2">
              {!cartLoaded ? (
                <div className="flex justify-center items-center py-6">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#BC6C25]" />
                </div>
              ) : cart.length > 0 ? (
                cart.map((item) => {
                  // Build the link path just like in New Arrivals
                  const category = item.category?.toLowerCase() || "unknown";
                  const type = item.type?.toLowerCase().replace(/\s+/g, "-") || "unknown";
                  const slug = item.name?.toLowerCase().replace(/\s+/g, "-") || "product";
                  const linkPath = `/${category}/${type}/${slug}/${item.sku}`;


                  return (
                    <div
                      key={item.id}
                      className="min-h-[6rem] flex gap-2 items-center p-4 mb-2 rounded-lg bg-[#f7e8df]"
                    >
                      <NavLink
                        to={linkPath}
                        className="h-[4.5rem] w-[4.5rem] flex-shrink-0"
                        onClick={() => closeModals && closeModals()} // optional: closes cart modal on click
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-[4.5rem] w-[4.5rem] object-cover rounded-md transform transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-105 hover:shadow-md"
                          loading="lazy"
                        />
                      </NavLink>
                      <div className="flex flex-col gap-1 flex-1">
                        <div className="flex justify-between text-center">
                          <span className="text-xs leading-tight">
                            <NavLink
                              to={linkPath}
                              className="hover:underline text-xs leading-tight"
                              onClick={() => closeModals && closeModals()} // optional
                            >
                              {item.name}
                            </NavLink>
                            {item.option_values &&
                              Object.keys(item.option_values).length > 0 && (
                                <span className="text-xs text-gray-500 block">
                                  {Object.entries(item.option_values).map(
                                    ([key, value], idx, arr) => (
                                      <span key={key}>
                                        {value}
                                        {idx < arr.length - 1 && <span className="mx-1">·</span>}
                                      </span>
                                    )
                                  )}
                                </span>
                              )}
                          </span>
                          <p className="text-[10px]">
                            Total:{" "}
                            <span className="font-medium">
                              PHP {(item.quantity * Number(item.price || 0)).toLocaleString()}
                            </span>
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 justify-between">
                          <div className="flex items-center gap-2 text-[10px]">
                            <span>Qty:</span>
                            <button
                              className="h-6 w-6 flex items-center justify-center font-bold text-[#D5A58B] border bg-white rounded-lg cursor-pointer hover:border-[#D5A58B]"
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  Math.max(item.quantity - 1, 1)
                                )
                              }
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={item.productStock || 1}
                              value={item.quantity}
                              onChange={(e) => {
                                const v = Math.max(
                                  1,
                                  Math.min(
                                    parseInt(e.target.value || "1", 10),
                                    item.productStock || 1
                                  )
                                );
                                updateQuantity(item.id, v);
                              }}
                              className="bg-white w-8 h-6 text-center rounded border"
                            />
                            <button
                              className="h-6 w-6 flex items-center justify-center font-bold text-[#D5A58B] border bg-white rounded-lg cursor-pointer hover:border-[#D5A58B]"
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  Math.min(
                                    item.quantity + 1,
                                    item.productStock || item.quantity + 1
                                  )
                                )
                              }
                            >
                              +
                            </button>
                          </div>
                          <button
                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 text-[10px] rounded cursor-pointer"
                            onClick={() => removeFromCart(item.variant_id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 text-sm py-6">
                  Cart is empty
                </p>
              )}
            </ScrollArea>

            {/* Totals + Checkout */}
            <div className="-mt-2">
              <div className="w-full flex justify-between text-[12px]">
                <p>
                  Total Items:{" "}
                  <span className="font-medium">{totalOrders}</span>
                </p>
                <p>
                  Total:{" "}
                  <span className="font-semibold">
                    PHP {totalPrice.toLocaleString()}
                  </span>
                </p>
              </div>

              <button type="button" className="mt-2 w-full py-2 bg-[#D5A58B] text-white rounded-lg hover:bg-[#e0b9a4] transition cursor-pointer flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                onClick={handleCheckout}
                disabled={!cartLoaded || checkOutLoading} >
                {checkOutLoading ? (<> <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg"
                  fill="none" viewBox="0 0 24 24" >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg> Processing... </>) : ("Checkout")} </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Dropdown for Logged-in Users */}
      {isUserLoggedIn
        ? isAuthAccountOpen && (
          <div className="absolute right-0 top-[4.5rem] bg-[#fffcf2] border border-gray-300 h-auto w-full sm:w-[21rem] shadow-lg  rounded-lg mt-2 z-50">
            {/* Account Dropdown for Logged-in Users */}
            <div className="flex flex-col p-4 gap-4 items-center">
              <div className="w-full flex flex-col gap-2 items-center">
                <h2 className="text-lg font-semibold text-[#283618]">
                  Account Settings
                </h2>
                <div className="flex items-center gap-4">
                  {/* 🖼️ Profile Picture if available */}
                  {user?.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt="Profile"
                      className="w-14 h-14 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-14 h-14 flex items-center justify-center rounded-full bg-gray-300 text-white text-xl font-bold border">
                      {user?.email?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}

                  {/* ✉️ Email and Name */}
                  <div className="flex flex-col">
                    {/* 👤 Full Name (optional) */}

                    <p className="text-sm font-semibold text-[#283618]">
                      {user?.full_name ||
                        user?.name ||
                        (user?.email
                          ? user.email
                            .split("@")[0]
                            .replace(/[^a-zA-Z0-9]/g, " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase())
                          : "Customer")}
                    </p>

                    {/* ✉️ Email */}
                    <p className="text-sm text-gray-500">
                      {user?.email || "unknown"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-full border-t border-gray-200 pt-3">
                <div className="flex flex-col w-full gap-2">

                  <NavLink
                    to="/Save-Address"
                    onClick={() => {
                      if (!isAuthAccountOpen) {
                        closeModals();
                        setIsAuthAccountOpen(true);
                      } else {
                        setIsAuthAccountOpen(false);
                      }
                    }}
                    className="w-full flex items-center gap-3 hover:bg-[#f8ece6]/60 p-2 px-4 rounded-lg"
                  >
                    <UserRoundPen size={25} strokeWidth={1.5} />
                    Personal Information
                  </NavLink>

                  <NavLink
                    to="/Order-History"
                    onClick={() => {
                      if (!isAuthAccountOpen) {
                        closeModals();
                        setIsAuthAccountOpen(true);
                      } else {
                        setIsAuthAccountOpen(false);
                      }
                    }}
                    className="w-full flex items-center gap-3 hover:bg-[#f8ece6]/60 p-2 px-4 rounded"
                  >
                    <PackageSearch size={25} strokeWidth={1.5} />
                    My Orders
                  </NavLink>
                  <NavLink
                    to="/Vouchers"
                    onClick={() => {
                      if (!isAuthAccountOpen) {
                        closeModals();
                        setIsAuthAccountOpen(true);
                      } else {
                        setIsAuthAccountOpen(false);
                      }
                    }}
                    className="w-full flex items-center gap-3 hover:bg-[#f8ece6]/60 p-2 px-4 rounded"
                  >
                    <TicketPercent size={25} strokeWidth={1.5} />
                    Vouchers
                  </NavLink>
                </div>
              </div>

              {/* ✅ Logout button */}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition"
              >
                {loggingOut ? (
                  "Logging out..."
                ) : (
                  <div className="w-full hover:text-red-300 cursor-pointer">Log Out</div>
                )}

              </button>
            </div>
          </div>
        )
        : isCustomerAccountOpen && (
          <div className="absolute right-0 top-[4.5rem] bg-[#fffcf2] border border-[#e0b9a4]/40 h-auto w-full sm:w-[21rem] shadow-lg rounded-lg mt-2 z-50">
            {/* Login Modal for Non-authenticated Users */}
            <div className="flex flex-col p-4 gap-2 items-center">
              <h2 className="text-lg font-semibold text-[#283618]">
                Hey there! your'e almost in!
              </h2>
              {/* <p className="text-md text-gray-900 text-center">
                {isLoginOtpSent
                  ? "We emailed you a code"
                  : "Enter your email to sign in"}
              </p> */}

              {/* Email Input */}
              {/* {!isLoginOtpSent && (
                <Input
                  ref={emailInputRef}
                  type="email"
                  className="w-full border px-3 py-2 rounded-md text-base"
                  placeholder="Enter your email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  readOnly={false}
                />
              )} */}

              {/* Show captcha only on Sign In view (not when OTP inputs are displayed). */}
              {/* {!isLoginOtpSent && (
                <div className="mt-2 w-full flex justify-center">
                  <ReCAPTCHA sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY} onChange={handleCaptchaChange} ref={recaptchaRef} />
                </div>
              )} */}

              {/* OTP Inputs + Actions */}
              {/* {isLoginOtpSent && (
                <> */}
              {/* <div className="flex gap-2 justify-center w-full items-center"> */}
              {/* <div className="flex gap-2">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <input
                          key={index}
                          type={otpVisible ? "text" : "password"} // toggle visibility
                          maxLength="1"
                          id={`otp-input-${index}`}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-8 sm:w-10 h-12 text-center border border-gray-300 rounded-md text-xl focus:outline-none focus:ring-2 focus:ring-[#d3945e]/50"
                          value={loginOtp[index] || ""}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, "");
                            const otpArray = loginOtp.split("");
                            while (otpArray.length < 6) otpArray.push("");
                            otpArray[index] = value;
                            setLoginOtp(otpArray.join(""));
                            if (value && index < 5) {
                              const next = document.getElementById(`otp-input-${index + 1}`);
                              if (next) next.focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Backspace") {
                              const otpArray = loginOtp.split("");
                              while (otpArray.length < 6) otpArray.push("");
                              otpArray[index] = "";
                              setLoginOtp(otpArray.join(""));
                              if (index > 0) {
                                const prev = document.getElementById(`otp-input-${index - 1}`);
                                if (prev) prev.focus();
                              }
                            }
                          }}
                          aria-label={`OTP digit ${index + 1}`}
                        />
                      ))}
                    </div> */}

              {/* Show / Hide OTP toggle using Lucide icons */}
              {/* <button
                      type="button"
                      onClick={() => setOtpVisible((v) => !v)}
                      className="ml-2 p-1 rounded text-gray-600 hover:text-gray-800 focus:outline-none"
                      aria-pressed={otpVisible}
                      aria-label={otpVisible ? "Hide OTP" : "Show OTP"}
                    >
                      {otpVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button> */}
              {/* </div> */}

              {/* Resend OTP button with countdown — shows captcha below when clicked */}
              {/* <button
                    onClick={handleShowResendCaptcha}
                    disabled={!resendAvailable}
                    className="w-full text-start font-medium pl-3 text-xs text-[#BC6C25] disabled:opacity-50"
                  >
                    {resendAvailable ? (
                      <span className="hover:text-[#ca894f] cursor-pointer">Resend OTP</span>
                    ) : (
                      `Resend OTP in ${resendCountdown}s`
                    )}
                  </button> */}

              {/* When user clicks Resend and showResendCaptcha is true, show a captcha right below.
                    When captcha is solved the onChange handler will auto-call sendOTP with the solved token. */}
              {/* {showResendCaptcha && (
                    <div className="mt-2 w-full flex flex-col items-center">
                      <p className="text-xs text-gray-600 mb-2">Please complete the CAPTCHA to receive a new OTP</p>
                      <ReCAPTCHA
                        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                        onChange={handleCaptchaResendChange}
                        ref={recaptchaResendRef}
                      />
                    </div>
                  )} */}

              {/* <button
                    onClick={() => {
                      setIsLoginOtpSent(false);
                      setLoginOtp("");
                      setResendCountdown(60);
                      setResendAvailable(false);
                      if (recaptchaRef.current) {
                        try { recaptchaRef.current.reset(); } catch (e) { console.warn(e); }
                      }
                      if (recaptchaResendRef.current) {
                        try { recaptchaResendRef.current.reset(); } catch (e) { console.warn(e); }
                      }
                      setCaptchaToken(null);
                      setCaptchaResendToken(null);
                      setShowResendCaptcha(false);
                    }}
                    className="w-full py-2 bg-white hover:bg-[#fafafa] border border-gray-200 rounded-lg text-sm text-blue-500 hover:text-blue-600 mt-2 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Undo2 size={15} /> Back to email
                  </button> */}
              {/* </>
              )} */}
              {/* <button
                onClick={isLoginOtpSent ? verifyOTP : sendOTP}
                disabled={
                  isLoginLoading ||
                  (!isLoginOtpSent &&
                    (
                      !loginEmail ||
                      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail) ||
                      !captchaToken // require initial captcha before sending first OTP
                    )
                  ) ||
                  (isLoginOtpSent && loginOtp.length !== 6)
                }
                className="w-full bg-[#D5A58B] text-white transition rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {isLoginLoading
                  ? "Please wait..."
                  : isLoginOtpSent
                    ? "Verify OTP"
                    : "Sign In with Email"}
              </button> */}
              {/* {loginError && (
                <p className="text-red-500 text-xs">{loginError}</p>
              )} */}

              {/* Divider with text */}
              <div className="w-full flex items-center gap-4 my-4">
                <hr className="flex-grow border-t border-gray-300" />
                <span className="text-sm text-gray-600">
                  SIGN IN WITH
                </span>
                <hr className="flex-grow border-t border-gray-300" />
              </div>

              {/* Social login buttons */}
              <div className="w-full flex flex-col gap-2">
                {/* Google */}
                <button
                  onClick={handleGoogleLogin}
                  className="w-full bg-white text-[#5F6368] border border-gray-300 hover:bg-gray-100 transition rounded-md px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"
                >
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google logo"
                    className="w-5 h-5"
                  />
                  Continue with Google
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};