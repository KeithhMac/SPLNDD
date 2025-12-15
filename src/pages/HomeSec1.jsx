import React, { useEffect, useState } from "react";
import Img1 from "../Images/Home-Img1.png";
import Img2 from "../Images/Home-Img2.png";
import Img3 from "../Images/Home-Img3.png";
import Img4 from "../Images/Home-Img4.png";
import Img5 from "../Images/Home-Img5.png";
import Img6 from "../Images/Home-Img6.png";
import Img7 from "../Images/Home-Img7.png";
import Img8 from "../Images/Home-Img8.png";
import Img9 from "../Images/Home-Img9.png";
import Img10 from "../Images/Home-Img10.png";
import Img11 from "../Images/Home-Img11.png";

import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CustomerFeedbacks } from "@/components/CustomerFeeedbacks";
import api from "../api/axios";
import SlideFromDirectionSection from "@/Styles/SlideFromDirectionSection";

// Map default image keys to imported images
const defaultImageMap = {
  "default-1": Img1,
  "default-2": Img2,
  "default-3": Img3,
  "default-4": Img4,
  "default-5": Img5,
  "default-6": Img6,
  "default-7": Img7,
  "default-8": Img8,
  "default-9": Img9,
  "default-10": Img10,
  "default-11": Img11
};

const defaultBlocks = [
  {
    images: [Img1, Img2, Img3, Img4],
    heading: "",
    text: "",
  },
  {
    images: [Img5, Img6],
    heading: "Pullover Hoodies",
    text: "Made from soft 50% cotton / 50% polyester preshrunk fleece knit. It features a double-lined hood and a spacious front pocket.",
  },
  {
    images: [Img7, Img8, Img9],
    heading: "Oversized Hoodies are Goodies",
    text: "Crafted from premium fabrics, made to last, and perfect for every moment. Whether you're lounging, exploring, or simply unwinding, our cozy and stylish pieces make sure you feel at home wherever you go.",
  },
  {
    images: [Img10, Img11],
    heading: "Zipped Hoodies",
    text: "Made from soft 50% cotton / 50% polyester preshrunk fleece knit. It features a full-length zipper and a spacious front pocket.",
  },
];

export const HomeSec1 = () => {
  const [blocks, setBlocks] = useState(defaultBlocks);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper: get image with fallback to default
  const getBlockImage = (blockIdx, imgIdx) => {
    const img = blocks[blockIdx]?.images?.[imgIdx];

    if (!img) return defaultBlocks[blockIdx].images[imgIdx];

    // Handle different image types
    if (typeof img === "string") {
      // If it's a default-X key, map to imported image
      if (img.startsWith("default-") && defaultImageMap[img]) {
        return defaultImageMap[img];
      }
      // Otherwise it's a URL from the backend (already full URL now)
      return img;
    }

    // If it's already an imported image object
    return img;
  };

  // Fetch CMS data for blocks on mount
  useEffect(() => {
    (async () => {
      try {
        // Try new API structure: block1, block2, block3, block4
        const fetchedBlocks = [];
        for (let i = 1; i <= 4; i++) {
          const res = await api.get(`/admin/cms/home-main-section/block${i}`);
          const def = defaultBlocks[i - 1];

          fetchedBlocks.push({
            images:
              res.data?.images && Array.isArray(res.data.images) && res.data.images.length
                ? res.data.images
                : def.images,
            heading: res.data?.heading ?? def.heading,
            text: res.data?.text ?? def.text,
          });
        }
        setBlocks(fetchedBlocks);
      } catch (e) {
        console.error("HomeSec1 fetch error:", e);
        setBlocks(defaultBlocks);
      }
    })();
  }, []);

  // Feedbacks logic
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/customer/feedback/feedback/all");
        if (res.data?.success && Array.isArray(res.data.feedbacks)) {
          const mapped = res.data.feedbacks.map((f) => ({
            id: f.id,
            // Backend already normalizes display_name (e.g., to "Anonymous" when needed)
            name: f.display_name,
            is_anonymous: !!f.is_anonymous,
            date: new Date(f.created_at).toLocaleDateString("en-US", {
              month: "2-digit",
              day: "2-digit",
              year: "2-digit",
            }),
            rating: Number(f.rating) || 0,
            text: f.message || "",
            image_urls: Array.isArray(f.image_urls) ? f.image_urls : [],
          }));
          setFeedbacks(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch feedbacks:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --- Use `blocks` array below for UI instead of hardcoded images/text ---
  return (
    <section className=" py-8 space-y-8 ">
      {/* First row */}
      <SlideFromDirectionSection direction="left" distance={100} >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((idx) => (
            <img
              key={idx}
              src={getBlockImage(0, idx)}
              alt={`Image ${idx + 1}`}
              className="w-full h-[25rem] md:h-[35rem] object-cover"
            />
          ))}
        </div>
      </SlideFromDirectionSection>

      {/* Second row */}
      <SlideFromDirectionSection direction="right" distance={100}>
        <div className="relative grid grid-cols-1 md:grid-cols-2">
          {[0, 1].map((idx) => (
            <img
              key={idx}
              src={getBlockImage(1, idx)}
              alt={`Image ${5 + idx}`}
              className={`w-full h-[35.1rem] md:h-[45rem] ${idx === 0 ? "md:rounded-bl-lg md:rounded-tl-lg" : "md:rounded-br-lg md:rounded-tr-lg"} object-cover`}
            />
          ))}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4 bg-black/40">
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">{blocks[1].heading}</h2>
            <p className="max-w-xl mb-4 text-sm md:text-base">
              {blocks[1].text.split(/(\*\*|__)(.*?)\1/).map((part, i) =>
                i % 4 === 2 ? (
                  <span key={i} className="text-yellow-400 font-semibold">{part}</span>
                ) : (
                  part
                )
              )}
            </p>
            <NavLink to="/women/hoodies" className="bg-white text-black px-4 py-2 rounded-md font-medium hover:bg-gray-200">
              Shop Now
            </NavLink>
          </div>
        </div>
      </SlideFromDirectionSection>

      {/* Third row */}
      <SlideFromDirectionSection direction="left" distance={100}>
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className=" flex flex-col gap-[4rem] justify-center items-center">
            <div className="flex flex-col gap-7 my-20">
              <h2 className="font-semibold text-2xl lg:text-3xl text-center lg:text-start">{blocks[2].heading}</h2>
              <p className="text-justify lg:text-start max-w-sm lg:max-w-md">{blocks[2].text}</p>
              <NavLink to="/new-arrivals" className="flex justify-center lg:justify-start">
                <Button className="bg-[#d6a58b] hover:bg-[#dbaf98] cursor-pointer">View Products</Button>
              </NavLink>
            </div>
          </div>
          {[0, 1, 2].map((idx) => (
            <img
              key={idx}
              src={getBlockImage(2, idx)}
              alt={`Image ${7 + idx}`}
              className="w-full h-[35rem] md:h-[45rem] object-cover"
            />
          ))}
        </div>
      </SlideFromDirectionSection>

      {/* Fourth row */}
      <SlideFromDirectionSection direction="right" distance={100}>
        <div className="relative grid grid-cols-1 md:grid-cols-2">
          {[0, 1].map((idx) => (
            <img
              key={idx}
              src={getBlockImage(3, idx)}
              alt={`Image ${10 + idx}`}
              className="w-full h-[35rem] md:h-[45rem] object-cover"
            />
          ))}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4 bg-black/40">
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">{blocks[3].heading}</h2>
            <p className="max-w-xl mb-4 text-sm md:text-base">
              {blocks[3].text}
            </p>
            <NavLink to="/women/hoodies" className="bg-white text-black px-4 py-2 rounded-md font-medium hover:bg-gray-200">
              Shop Now
            </NavLink>
          </div>
        </div>
      </SlideFromDirectionSection>

      {/* Feedback Section */}
      <SlideFromDirectionSection direction="left" distance={100}>
        <section className="h-auto flex justify-center mt-[4rem]">
          {loading ? (
            <p className="text-gray-500">Loading feedbacks…</p>
          ) : (
            <CustomerFeedbacks feedbacks={feedbacks} />
          )}
        </section>
      </SlideFromDirectionSection>
    </section>
  );
};