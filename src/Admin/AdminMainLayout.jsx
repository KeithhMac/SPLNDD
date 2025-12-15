import React, { useState, useEffect, useRef, useContext } from "react";
import { NavLink, useMatch, Outlet, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

import {
  Home,
  UserRoundPen,
  PackageSearch,
  ChevronDown,
  ChevronUp,
  LogOut,
  ShoppingBasket,
  CreativeCommons,
  Flag,
  TicketPercent,
  Maximize2,
  Minimize2
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

import { useCanAccess } from "@/hooks/useCanAccess";
import { toast } from "sonner";
import api from "@/api/axios";


import { ScrollArea } from "@/components/ui/scroll-area";
import { AdminAuthContext } from "@/context/AdminAuthContext";

export const AdminMainLayout = () => {
  const { admin, refreshAuth } = useContext(AdminAuthContext);

  // Add skeleton loading state
  const [loading, setLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);

  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [couponsOpen, setCouponsOpen] = useState(false);

  const canAccessDashboard = useCanAccess("dashboard");
  const canAccessProducts = useCanAccess("products");
  const canAccessOrders = useCanAccess("orders");
  const canAccessAdmins = useCanAccess("admins");
  const canAccessContents = useCanAccess("contents");
  const canAccessReports = useCanAccess("reports");
  const canAccessCoupons = useCanAccess("coupons");

  // Compute strict audit log access for the button
  const canAccessAuditLog = canAccessReports && admin?.role === "super-admin";



  // Simulate an initial loading effect
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 400); // simulate permission fetch, etc.
    return () => clearTimeout(timer);
  }, []);

  // Skeleton delay: 2s after loading finishes
  useEffect(() => {
    if (loading) setShowSkeleton(true);
    else {
      const timer = setTimeout(() => setShowSkeleton(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Detect mobile screen
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 520px)");
    setIsMobile(mediaQuery.matches);
    const handler = (e) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const isSidebarOpen = !collapsed || (!isMobile && hovered);

  // Active route matches
  const isDashboard = useMatch({ path: "/Admin", end: true });
  const isProducts = useMatch("/Admin/Products/*");
  const isOrders = useMatch("/Admin/Orders/*");
  // const isOrders = useMatch({ path: "/Admin/Orders", end: true });
  const isEmployee = useMatch({ path: "/Admin/Employee", end: true });

  const isContents = useMatch("/Admin/Contents/*");
  const isReports = useMatch("/Admin/Reports/*");
  const isCoupons = useMatch("/Admin/Coupons/*");

  const hoverTimeout = useRef(null);

  const handleMouseEnter = () => {
    if (!collapsed || isMobile) return;
    hoverTimeout.current = setTimeout(() => setHovered(true), 100); // 0.1s delay
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeout.current);
    setHovered(false);
  };

  // Decide which icon to show
  const Icon = (() => {
    if (hovered) {
      return collapsed ? Maximize2 : Minimize2; // flip on hover
    }
    return collapsed ? Minimize2 : Maximize2; // normal state
  })();

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const res = await api.post("/owner/logout"); // backend returns {redirect}

      // clear local context right away
      await refreshAuth();

      const redirectUrl = res.data?.redirect || "/admins-auth-splnd";
      toast.success("Logged out successfully");
      navigate(redirectUrl);
    } catch (err) {
      console.error("Logout error:", err);
      toast.error(err.response?.data?.message || "Error logging out");
      navigate("/admins-auth-splnd"); // fallback
    }
  };



  // --- SKELETON UI ---
  if (loading || showSkeleton) {
    return (
      <div className="flex min-h-screen w-full bg-[#f5f5f4] pt-3 pr-3 pb-3 ">
        {/* Sidebar Skeleton */}
        <div>
          <aside
            className={`sticky top-1 h-[calc(100vh-0.5rem)] transition-all duration-300 pt-6 w-[6rem] md:w-[16rem]`}
          >
            <div className="flex flex-col h-full items-center px-1 ">
              {/* Logo and Collapse Toggle */}
              <div className="flex items-center justify-center w-full mb-6 mt-[2rem] gap-[1rem]">
                <Skeleton className="h-8 w-16 bg-gray-300" />
                <Skeleton className="h-8 w-8 rounded-full bg-gray-200" />
              </div>
              {/* Nav Skeleton */}
              <div className="w-full h-[32rem] p-3 flex flex-col gap-4 mt-[3rem]">
                {[...Array(7)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full bg-gray-200 rounded-md" />
                ))}
              </div>
              {/* Logout Skeleton */}
              <Skeleton className="mt-auto mb-[3rem] h-10 w-full bg-gray-100 rounded-md" />
            </div>
          </aside>
        </div>
        {/* Main content area Skeleton */}
        <main className="flex-1 w-full h-auto rounded-lg p-4 bg-[#e6ece9] border-black overflow-auto">
          {/* Dashboard Title */}
          <Skeleton className="h-8 w-48 mb-6 bg-gray-200" />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-md p-6 flex flex-col gap-2 min-h-[140px] border border-gray-200"
              >
                <Skeleton className="h-6 w-2/5 mb-2 bg-gray-100" />
                <Skeleton className="h-9 w-1/3 mb-2 bg-gray-200" />
                <Skeleton className="h-4 w-3/4 mb-1 bg-gray-100" />
                <div className="flex justify-end">
                  <Skeleton className="h-6 w-6 rounded-full bg-gray-100" />
                </div>
              </div>
            ))}
          </div>

          {/* Sales Overview Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-6 w-40 bg-gray-200" />
              <Skeleton className="h-8 w-32 rounded-md bg-gray-100" />
            </div>
            <Skeleton className="h-60 w-full rounded-md bg-gray-100" />
          </div>
        </main>
      </div>
    );
  }


  return (
    <div className="flex min-h-screen w-full bg-[#f5f5f4]">
      {/* Sidebar */}
      <TooltipProvider>
        <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <aside
            className={`sticky top-1 h-[calc(100vh-0.5rem)] transition-all duration-300 
    ${isSidebarOpen
                ? "w-[16rem]"
                : "w-[3rem] sm:w-[5rem]"}     
  `}
          >
            <div className="flex flex-col h-full  items-center px-1 ">
              {/* Logo and Collapse Toggle */}
              <div className="flex items-center justify-center w-full mb-6 mt-[2rem] gap-[1rem]">
                {isSidebarOpen && (
                  <h1 className="text-xl font-bold">SPLND'D</h1>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCollapsed(!collapsed)}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  className="text-black hover:bg-transparent hover:text-black focus-visible:ring-0"
                >
                  <Icon size={25} />
                </Button>
              </div>

              {/* Navigation */}
              <ScrollArea className="w-full h-[32rem] p-3 overflow-hidden">
                <nav className="flex flex-col gap-2 w-full">
                  {canAccessDashboard && (
                    <>
                      {/* Dashboard */}

                      <Tooltip>
                        <TooltipTrigger asChild className="flex">
                          <NavLink
                            to="/Admin"
                            className={`flex items-center gap-2 py-2 rounded-md transition-all duration-300 ease-in-out w-full
    ${isDashboard ? "bg-[#E1E7E4] font-medium text-black" : "text-black hover:bg-[#E1E7E4]"}
    ${isSidebarOpen ? "justify-start px-3" : "justify-center px-0"}
  `}
                          >
                            <Home
                              className={`sm:w-[25px] sm:h-[25px] ${isSidebarOpen ? "w-[25px] h-[25px]" : "w-[15px] h-[15px]"
                                }`}
                            />
                            {isSidebarOpen && (
                              <div className="flex justify-between items-center w-full">
                                <span
                                  className={`transition-all duration-500 whitespace-nowrap overflow-hidden ${isSidebarOpen ? "opacity-100 max-w-[160px]" : "opacity-0 max-w-0"
                                    }`}
                                >
                                  Dashboard
                                </span>
                              </div>
                            )}
                          </NavLink>


                        </TooltipTrigger>
                        {collapsed && !hovered && (
                          <TooltipContent side="right">
                            Dashboard
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </>
                  )}

                  {canAccessProducts && (
                    <>
                      {/* Products */}
                      <Tooltip>
                        <TooltipTrigger asChild className="flex">
                          <button
                            onClick={() => setProductsOpen((prev) => !prev)}
                            className={`flex items-center gap-2 py-2 rounded-md transition-all w-full
    ${isProducts ? "bg-[#E1E7E4] font-medium text-black" : "text-black hover:bg-[#E1E7E4]"}
    ${isSidebarOpen ? "justify-between px-3" : "justify-center px-0"}
  `}
                          >
                            <div className="flex items-center gap-2">
                              <ShoppingBasket
                                className={`sm:w-[25px] sm:h-[25px] ${isSidebarOpen ? "w-[25px] h-[25px]" : "w-[15px] h-[15px]"
                                  }`}
                              />
                              {isSidebarOpen && (
                                <span
                                  className={`transition-all duration-500 whitespace-nowrap overflow-hidden cursor-pointer ${isSidebarOpen ? "opacity-100 max-w-[160px]" : "opacity-0 max-w-0"
                                    }`}
                                >
                                  Manage Products
                                </span>
                              )}
                            </div>
                            {isSidebarOpen &&
                              (productsOpen ? (
                                <ChevronDown size={16} className="opacity-50" />
                              ) : (
                                <ChevronUp size={16} className="opacity-50" />
                              ))}
                          </button>

                        </TooltipTrigger>
                        {collapsed && !hovered && (
                          <TooltipContent side="right">
                            Manage Products
                          </TooltipContent>
                        )}
                      </Tooltip>

                      {/* Products submenu */}
                      {isSidebarOpen && productsOpen && (
                        <div className="flex flex-col gap-1 pl-6 mt-1">
                          <NavLink
                            to="/Admin/Products"
                            end
                            className={({ isActive }) =>
                              `px-2 py-1 rounded-md transition-colors w-full ${isActive
                                ? "bg-[#E1E7E4] font-medium text-black"
                                : "text-black hover:bg-[#E1E7E4]"
                              }`
                            }
                          >
                            Create Product
                          </NavLink>
                          <NavLink
                            to="/Admin/Products/View-Products"
                            className={({ isActive }) =>
                              `px-2 py-1 rounded-md transition-colors w-full ${isActive
                                ? "bg-[#E1E7E4] font-medium text-black"
                                : "text-black hover:bg-[#E1E7E4]"
                              }`
                            }
                          >
                            View Products
                          </NavLink>
                        </div>
                      )}
                    </>
                  )}

                  {canAccessOrders && (
                    <>
                      {/* Order */}
                      <Tooltip>
                        <TooltipTrigger asChild className="flex">
                          <button
                            onClick={() => setOrdersOpen((prev) => !prev)}
                            className={`flex items-center gap-2 py-2 rounded-md transition-all w-full
    ${isOrders ? "bg-[#E1E7E4] font-medium text-black" : "text-black hover:bg-[#E1E7E4]"}
    ${isSidebarOpen ? "justify-between px-3" : "justify-center px-0"}
  `}
                          >
                            <div className="flex items-center gap-2">
                              <PackageSearch
                                className={`sm:w-[25px] sm:h-[25px] ${isSidebarOpen ? "w-[25px] h-[25px]" : "w-[15px] h-[15px]"
                                  }`}
                              />
                              {isSidebarOpen && (
                                <div
                                  className={`transition-all duration-500 whitespace-nowrap overflow-hidden cursor-pointer ${isSidebarOpen ? "opacity-100 max-w-[160px]" : "opacity-0 max-w-0"
                                    }`}
                                >
                                  Manage Orders
                                </div>
                              )}
                            </div>

                            {isSidebarOpen &&
                              (ordersOpen ? (
                                <ChevronDown size={16} className="opacity-50" />
                              ) : (
                                <ChevronUp size={16} className="opacity-50" />
                              ))}
                          </button>

                        </TooltipTrigger>
                        {collapsed && !hovered && (
                          <TooltipContent side="right">
                            Manage Orders
                          </TooltipContent>
                        )}
                      </Tooltip>

                      {/* Orders submenu */}
                      {isSidebarOpen && ordersOpen && (
                        <div className="flex flex-col gap-1 pl-6 mt-1">
                          <NavLink
                            to="/Admin/Orders"
                            end
                            className={({ isActive }) =>
                              `px-2 py-1 rounded-md transition-colors w-full ${isActive
                                ? "bg-[#E1E7E4] font-medium text-black"
                                : "text-black hover:bg-[#E1E7E4]"
                              }`
                            }
                          >
                            View Orders
                          </NavLink>
                          <NavLink
                            to="/Admin/Orders/History"
                            className={({ isActive }) =>
                              `px-2 py-1 rounded-md transition-colors w-full ${isActive
                                ? "bg-[#E1E7E4] font-medium text-black"
                                : "text-black hover:bg-[#E1E7E4]"
                              }`
                            }
                          >
                            Order History
                          </NavLink>
                          <NavLink
                            to="/Admin/Orders/Exchange"
                            className={({ isActive }) =>
                              `px-2 py-1 rounded-md transition-colors w-full ${isActive
                                ? "bg-[#E1E7E4] font-medium text-black"
                                : "text-black hover:bg-[#E1E7E4]"
                              }`
                            }
                          >
                            Order Exchange
                          </NavLink>
                        </div>
                      )}
                    </>
                  )}

                  {canAccessAdmins && (
                    <>
                      {/* Employee */}
                      <Tooltip>
                        <TooltipTrigger asChild className="flex">
                          <NavLink
                            to="/Admin/Employee"
                            end
                            className={`flex items-center gap-2 py-2 rounded-md transition-all w-full
    ${isEmployee ? "bg-[#E1E7E4] font-medium text-black" : "text-black hover:bg-[#E1E7E4]"}
    ${isSidebarOpen ? "justify-start px-3" : "justify-center px-0"}
  `}
                          >
                            <UserRoundPen
                              className={`sm:w-[25px] sm:h-[25px] ${isSidebarOpen ? "w-[25px] h-[25px]" : "w-[15px] h-[15px]"
                                }`}
                            />
                            {isSidebarOpen && (
                              <div className="flex justify-between items-center w-full">
                                <span
                                  className={`transition-all duration-500 whitespace-nowrap overflow-hidden ${isSidebarOpen ? "opacity-100 max-w-[160px]" : "opacity-0 max-w-0"
                                    }`}
                                >
                                  Manage Admins
                                </span>
                              </div>
                            )}
                          </NavLink>


                        </TooltipTrigger>
                        {collapsed && !hovered && (
                          <TooltipContent side="right">
                            Manage Admins
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </>
                  )}

                  {canAccessContents && (
                    <>
                      {/* Content  */}
                      <Tooltip>
                        <TooltipTrigger asChild className="flex">
                          <button
                            onClick={() => setContentOpen((prev) => !prev)}
                            className={`flex items-center gap-2 py-2 rounded-md transition-all w-full
    ${isContents ? "bg-[#E1E7E4] font-medium text-black" : "text-black hover:bg-[#E1E7E4]"}
    ${isSidebarOpen ? "justify-between px-3" : "justify-center px-0"}
  `}
                          >
                            <div className="flex items-center gap-2">
                              <CreativeCommons
                                className={`sm:w-[25px] sm:h-[25px] ${isSidebarOpen ? "w-[25px] h-[25px]" : "w-[15px] h-[15px]"
                                  }`}
                              />
                              {isSidebarOpen && (
                                <span
                                  className={`transition-all duration-500 whitespace-nowrap overflow-hidden cursor-pointer ${isSidebarOpen ? "opacity-100 max-w-[160px]" : "opacity-0 max-w-0"
                                    }`}
                                >
                                  Manage Content
                                </span>
                              )}
                            </div>

                            {isSidebarOpen &&
                              (contentOpen ? (
                                <ChevronDown size={16} className="opacity-50" />
                              ) : (
                                <ChevronUp size={16} className="opacity-50" />
                              ))}
                          </button>

                        </TooltipTrigger>
                        {collapsed && !hovered && (
                          <TooltipContent side="right">
                            Manage Content
                          </TooltipContent>
                        )}
                      </Tooltip>

                      {/* Content submenu */}
                      {isSidebarOpen && contentOpen && (
                        <div className="flex flex-col gap-1 pl-6 mt-1">
                          <NavLink
                            to="/Admin/Contents"
                            end
                            className={({ isActive }) =>
                              `px-2 py-1 rounded-md transition-colors w-full ${isActive
                                ? "bg-[#E1E7E4] font-medium text-black"
                                : "text-black hover:bg-[#E1E7E4]"
                              }`
                            }
                          >
                            Home Page Content
                          </NavLink>
                          <NavLink
                            to="/Admin/Contents/About"
                            className={({ isActive }) =>
                              `px-2 py-1 rounded-md transition-colors w-full ${isActive
                                ? "bg-[#E1E7E4] font-medium text-black"
                                : "text-black hover:bg-[#E1E7E4]"
                              }`
                            }
                          >
                            About Page Content
                          </NavLink>
                          <NavLink
                            to="/Admin/Contents/Privacy"
                            end
                            className={({ isActive }) =>
                              `px-2 py-1 rounded-md transition-colors w-full ${isActive
                                ? "bg-[#E1E7E4] font-medium text-black"
                                : "text-black hover:bg-[#E1E7E4]"
                              }`
                            }
                          >
                            Privacy Page Content
                          </NavLink>
                          <NavLink
                            to="/Admin/Contents/Terms-and-Conditions"
                            className={({ isActive }) =>
                              `px-2 py-1 rounded-md transition-colors w-full ${isActive
                                ? "bg-[#E1E7E4] font-medium text-black"
                                : "text-black hover:bg-[#E1E7E4]"
                              }`
                            }
                          >
                            Term & Cond. Content
                          </NavLink>
                          <NavLink
                            to="/Admin/Contents/Chatbot"
                            className={({ isActive }) =>
                              `px-2 py-1 rounded-md transition-colors w-full ${isActive
                                ? "bg-[#E1E7E4] font-medium text-black"
                                : "text-black hover:bg-[#E1E7E4]"
                              }`
                            }
                          >
                            Chatbot Content
                          </NavLink>
                        </div>
                      )}
                    </>
                  )}

                  {canAccessReports && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild className="flex">
                          <button
                            onClick={() => setReportsOpen((prev) => !prev)}
                            className={`flex items-center gap-2 py-2 rounded-md transition-all w-full
    ${isReports ? "bg-[#E1E7E4] font-medium text-black" : "text-black hover:bg-[#E1E7E4]"}
    ${isSidebarOpen ? "justify-between px-3" : "justify-center px-0"}
  `}
                          >
                            <div className="flex items-center gap-2">
                              <Flag
                                className={`sm:w-[25px] sm:h-[25px] ${isSidebarOpen ? "w-[25px] h-[25px]" : "w-[15px] h-[15px]"
                                  }`}
                              />
                              {isSidebarOpen && (
                                <span
                                  className={`transition-all duration-500 whitespace-nowrap overflow-hidden cursor-pointer ${isSidebarOpen ? "opacity-100 max-w-[160px]" : "opacity-0 max-w-0"
                                    }`}
                                >
                                  Data Reports
                                </span>
                              )}
                            </div>

                            {isSidebarOpen &&
                              (reportsOpen ? (
                                <ChevronDown size={16} className="opacity-50" />
                              ) : (
                                <ChevronUp size={16} className="opacity-50" />
                              ))}
                          </button>

                        </TooltipTrigger>
                        {collapsed && !hovered && (
                          <TooltipContent side="right">
                            Manage Reports
                          </TooltipContent>
                        )}
                      </Tooltip>

                      {/* Content submenu */}
                      {isSidebarOpen && reportsOpen && (
                        <div className="flex flex-col gap-1 pl-6 mt-1">
                          <NavLink
                            to="/Admin/Reports"
                            end
                            className={({ isActive }) =>
                              `px-2 py-1 rounded-md transition-colors w-full ${isActive
                                ? "bg-[#E1E7E4] font-medium text-black"
                                : "text-black hover:bg-[#E1E7E4]"
                              }`
                            }
                          >
                            Sales Reports
                          </NavLink>
                          <NavLink
                            to="/Admin/Reports/Transactions"
                            className={({ isActive }) =>
                              `px-2 py-1 rounded-md transition-colors w-full ${isActive
                                ? "bg-[#E1E7E4] font-medium text-black"
                                : "text-black hover:bg-[#E1E7E4]"
                              }`
                            }
                          >
                            Trasaction Reports
                          </NavLink>

                          {canAccessAuditLog && (
                            <NavLink
                              to="/Admin/Reports/Audit-Log"
                              className={({ isActive }) =>
                                `px-2 py-1 rounded-md transition-colors w-full ${isActive
                                  ? "bg-[#E1E7E4] font-medium text-black"
                                  : "text-black hover:bg-[#E1E7E4]"
                                }`
                              }
                            >
                              Audit Log Reports
                            </NavLink>
                          )}

                        </div>
                      )}
                    </>
                  )}

                  {canAccessCoupons && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild className="flex">
                          <button
                            onClick={() => setCouponsOpen((prev) => !prev)}
                            className={`flex items-center gap-2 py-2 rounded-md transition-all w-full
    ${isCoupons ? "bg-[#E1E7E4] font-medium text-black" : "text-black hover:bg-[#E1E7E4]"}
    ${isSidebarOpen ? "justify-between px-3" : "justify-center px-0"}
  `}
                          >
                            <div className="flex items-center gap-2">
                              <TicketPercent
                                className={`sm:w-[25px] sm:h-[25px] ${isSidebarOpen ? "w-[25px] h-[25px]" : "w-[15px] h-[15px]"
                                  }`}
                              />
                              {isSidebarOpen && (
                                <span
                                  className={`transition-all duration-500 whitespace-nowrap overflow-hidden cursor-pointer ${isSidebarOpen ? "opacity-100 max-w-[160px]" : "opacity-0 max-w-0"
                                    }`}
                                >
                                  Coupons
                                </span>
                              )}
                            </div>

                            {isSidebarOpen &&
                              (couponsOpen ? (
                                <ChevronDown size={16} className="opacity-50" />
                              ) : (
                                <ChevronUp size={16} className="opacity-50" />
                              ))}
                          </button>

                        </TooltipTrigger>
                        {collapsed && !hovered && (
                          <TooltipContent side="right">
                            Manage Reports
                          </TooltipContent>
                        )}
                      </Tooltip>

                      {/* Content submenu */}
                      {isSidebarOpen && couponsOpen && (
                        <div className="flex flex-col gap-1 pl-6 mt-1">
                          <NavLink
                            to="/Admin/Coupons"
                            end
                            className={({ isActive }) =>
                              `px-2 py-1 rounded-md transition-colors w-full ${isActive
                                ? "bg-[#E1E7E4] font-medium text-black"
                                : "text-black hover:bg-[#E1E7E4]"
                              }`
                            }
                          >
                            Create Coupons
                          </NavLink>
                        </div>
                      )}
                    </>
                  )}
                </nav>
              </ScrollArea>

              {/* Logout */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className={`mt-5 mb-[3rem] flex items-center gap-2 text-red-500 w-full cursor-pointer
    ${isSidebarOpen ? "justify-start px-3" : "justify-center px-0"}
  `}
                  >
                    <LogOut
                      className={`sm:w-[25px] sm:h-[25px] ${isSidebarOpen ? "w-[25px] h-[25px]" : "w-[15px] h-[15px]"
                        }`}
                    />
                    {isSidebarOpen && <span>Logout</span>}
                  </Button>
                </TooltipTrigger>
                {collapsed && !hovered && (
                  <TooltipContent side="right">Logout</TooltipContent>
                )}
              </Tooltip>
            </div>
          </aside>
        </div>
      </TooltipProvider>

      {/* Main content area */}
      <main className="flex-1 w-full h-auto rounded-lg p-4 m-5 ml-0 bg-[#E1E7E4] border-black overflow-auto shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] ">
        <Outlet />
      </main>
    </div>
  );
};
