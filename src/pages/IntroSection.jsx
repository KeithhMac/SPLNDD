import React, { useEffect, useState } from "react";
import "../Styles/IntroSection.css";
import IntroTextDefault from "../Images/BannerText.png";
import IntroImageDefault from "../Images/intro-image.png";
import IntroBGDefault from "../Images/intro-bg.png";
import { NavLink } from "react-router-dom";
import api from "../api/axios";

export const IntroSection = () => {
  // Show defaults instantly
  const [introText, setIntroText] = useState(IntroTextDefault);
  const [introImage, setIntroImage] = useState(IntroImageDefault);
  const [introBG, setIntroBG] = useState(IntroBGDefault);

  useEffect(() => {
    let mounted = true;
    const fetchImages = async () => {
      try {
        const res = await api.get("/admin/cms/intro");
        if (mounted && res?.data) {
          if (res.data.intro_text_image) setIntroText(res.data.intro_text_image);
          if (res.data.intro_image) setIntroImage(res.data.intro_image);
          if (res.data.intro_bg) setIntroBG(res.data.intro_bg);
        }
      } catch (e) {
        // Log error but never affect UI
        console.error("IntroSection image fetch error:", e);
      }
    };
    fetchImages();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section
      id="intro-section"
      className="w-full min-h-[30rem] flex justify-center mt-[1rem]"
    >
      <div
        id="intro-bg"
        className="w-full rounded-[15px] flex flex-wrap items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: `url(${introBG})` }}
      >
        <div
          id="intro-LC"
          className="moveFromLeft max-w-[30.1rem] flex flex-col justify-center items-center mr-[-4rem]"
        >
          <img
            src={introText}
            id="intro-text"
            alt=""
            className="w-full h-auto mb-[1.5rem]"
            style={{
              maxWidth: "auto",
              maxHeight: "20rem",
              objectFit: "contain",
              width: "100%",
              height: "auto",
              display: "block"
            }}
          />
          <NavLink to="/special-offers">
            <button
              id="intro-btn"
              className="rounded-[10px] cursor-pointer px-[clamp(12px,2.5vw,20px)] py-[clamp(8px,1.5vw,12px)] text-[clamp(0.875rem,2vw,1rem)] hover:bg-[#e0b9a4] transition bg-[#f8e8db]"
            >
              Shop Now
            </button>
          </NavLink>
        </div>
        <img
          src={introImage}
          id="intro-image"
          alt=""
          className="moveFromRight min-w-[10px] max-w-[40rem]"
          style={{
            maxWidth: "40rem",
            maxHeight: "30rem",
            width: "100%",
            objectFit: "contain",
            display: "block"
          }}
        />
      </div>
    </section>
  );
};