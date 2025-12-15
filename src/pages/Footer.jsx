import React from "react";
// import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa";
import { NavLink } from "react-router-dom";
// import Logo from "../Images/splendid-logo-2.png";
import FooterLogo from "../Images/splndd-main-logo-new.png";
import Footerbg from "../Images/footer-bg.png";
import FbLogo from "../Images/fb-icon.png";
import IgLogo from "../Images/ig-icon.png";
import TiktokLogo from "../Images/tiktok-icon.png";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    // <footer className="bg-[#f7e7db] rounded-2xl text-black px-4 py-8 mt-[10rem]">

    // </footer>
    <div
      className="w-full h-auto relative bg-cover bg-top drop-shadow-lg"
      style={{ backgroundImage: `url(${Footerbg})` }}
    >
      <div className="mx-auto flex flex-col items-center space-y-6">
        {/* Logo and name */}
        <div className="flex flex-col items-center space-y-2 mt-10">
          <img src={FooterLogo} alt="SPLND Logo" className="w-30 h-auto" />
          {/* <span className="text-lg Font-telma-bold tracking-widest text-gray-700">
            SPLND’D CLOTHING
          </span> */}
        </div>

        {/* Navigation links */}
        <nav className="flex flex-wrap justify-center gap-5 text-sm">
          <NavLink
            to="/terms-of-service"
            className={({ isActive }) =>
              isActive
                ? "text-[#BC6C25]"
                : "text-black hover:text-[#BC6C25] transition"
            }
          >
            Terms of Service
          </NavLink>

          <NavLink
            to="/privacy-policy"
            className={({ isActive }) =>
              isActive
                ? "text-[#BC6C25]"
                : " text-black hover:text-[#BC6C25] transition"
            }
          >
            Privacy Policy
          </NavLink>

          <NavLink
            to="/about-us"
            className={({ isActive }) =>
              isActive
                ? "text-[#BC6C25]"
                : "text-black hover:text-[#BC6C25] transition"
            }
          >
            About Us
          </NavLink>
        </nav>

        {/* Social Icons */}
        <div className="flex space-x-5 text-xl mb-10">
          <a
            href="https://www.facebook.com/shop.splndd"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="hover:text-blue-600 transition-colors"
          >
            {/* <FaFacebookF /> */}
            <img src={FbLogo} alt="Facebook" className="w-6 h-6" />
          </a>
          <a
            href="https://www.instagram.com/shop.splndd/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="hover:text-pink-500 transition-colors"
          >
            {/* <FaInstagram /> */}
            <img src={IgLogo} alt="Instagram" className="w-6 h-6" />
          </a>
          <a
            href="https://www.tiktok.com/@splnd_d"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
            className="hover:text-black transition-colors"
          >
            {/* <FaTiktok /> */}
            <img src={TiktokLogo} alt="TikTok" className="w-6 h-6" />
          </a>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-orange-200" />

        {/* Copyright */}
        <p className="text-xs text-gray-600 text-center mb-5">
          © {currentYear} SPLND’D Clothing. All rights reserved.
        </p>
      </div>
    </div>
  );
};
