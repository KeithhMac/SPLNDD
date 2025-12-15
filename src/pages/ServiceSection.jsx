import React, { useEffect, useState } from "react";
import ServiceImage from "../Images/service-icon.png";
import DeliveryImage from "../Images/delivery-icon.png";
import QualityImage from "../Images/quality-icon.png";
import { Link } from "react-router-dom";
import api from "../api/axios";

// Utility for fallback to default icon based on idx
const getDefaultIcon = idx => {
  if (idx % 3 === 0) return ServiceImage;
  if (idx % 3 === 1) return DeliveryImage;
  if (idx % 3 === 2) return QualityImage;
  return ServiceImage;
};

export const ServiceSection = () => {
  const defaultServices = [
    {
      img: ServiceImage,
      title: "Service",
      desc: "Our chatbot is here round the clock to answer your FAQs",
    },
    {
      img: DeliveryImage,
      title: "Delivery",
      desc: "Nationwide shipping is available..",
    },
    {
      img: QualityImage,
      title: "Quality",
      desc: "We ensure top-notch quality in every item we sell.",
    },
  ];

  const [services, setServices] = useState(defaultServices);

  useEffect(() => {
    let mounted = true;
    const fetchServices = async () => {
      try {
        const res = await api.get("/admin/cms/services");
        if (mounted && Array.isArray(res.data) && res.data.length) {
          setServices(
            res.data.map((item, i) => ({
              img: item.img || getDefaultIcon(i),
              title: item.title || defaultServices[i % 3].title,
              desc: item.desc || item.description || defaultServices[i % 3].desc,
            }))
          );
        }
      } catch (e) {
        // fallback to defaults; log for debug
        console.error("ServiceSection fetch error:", e);
      }
    };
    fetchServices();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Repeat for animation (same as original)
  const repeated = Array(100).fill(services).flat();

  // Defensive fallback for image error (if broken link or deleted image in cloud)
  const handleImgError = (e, idx) => {
    e.target.onerror = null;
    e.target.src = getDefaultIcon(idx);
  };

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-[65rem] overflow-hidden flex justify-center items-center">
        <div className="animate-service-scroll flex w-max">
          <section
            id="service-section"
            className="flex flex-nowrap gap-20 py-[3rem] sm:text-md text-sm"
          >
            {repeated.map((service, idx) => (
              <div
                key={idx}
                className="service-container w-[15rem] h-[7rem] flex flex-wrap justify-center items-center gap-2 text-center sm:mb-0 mb-4"
              >
                <div className="flex gap-2">
                  <img
                    src={service.img || getDefaultIcon(idx)}
                    className="service-section-images w-[3rem]"
                    alt=""
                    onError={e => handleImgError(e, idx)}
                  />
                  <strong className="flex self-center text-lg">
                    {service.title}
                  </strong>
                </div>
                <p className="service-p mt-[-0.5rem]">{service.desc}</p>
              </div>
            ))}
          </section>
        </div>

        {/* Inline animation style */}
        <style>{`
        @keyframes serviceScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .animate-service-scroll {
          animation: serviceScroll 1700s linear infinite;
        }
      `}</style>
      </div>
    </div>
  );
};