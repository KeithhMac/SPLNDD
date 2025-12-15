import React, { useState, useEffect } from "react";
import api from "../api/axios";
import "../Styles/IntroSection.css";
import IntroTextDefault from "../Images/BannerText.png";
import IntroImageDefault from "../Images/intro-image.png";
import IntroBGDefault from "../Images/intro-bg.png";
import ServiceImageDefault from "../Images/service-icon.png";
import DeliveryImageDefault from "../Images/delivery-icon.png";
import QualityImageDefault from "../Images/quality-icon.png";
import { NavLink } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
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
import { Skeleton } from "@/components/ui/skeleton";

// --------- Default Data ---------
const defaultServices = [
  {
    img: ServiceImageDefault,
    title: "Service",
    desc: "Our chatbot is here round the clock to answer your FAQs"
  },
  {
    img: DeliveryImageDefault,
    title: "Delivery",
    desc: "Nationwide shipping is available.."
  },
  {
    img: QualityImageDefault,
    title: "Quality",
    desc: "We ensure top-notch quality in every item we sell."
  },
];

// Default block content
const defaultBlocks = [
  { images: ["default-1", "default-2", "default-3", "default-4"], heading: "", text: "" },
  {
    images: ["default-5", "default-6"],
    heading: "Pullover Hoodies",
    text: "Made from soft 50% cotton / 50% polyester preshrunk fleece knit. It features a double-lined hood and a spacious front pocket.",
  },
  {
    images: ["default-7", "default-8", "default-9"],
    heading: "Oversized Hoodies are Goodies",
    text: "Crafted from premium fabrics, made to last, and perfect for every moment. Whether you're lounging, exploring, or simply unwinding, our cozy and stylish pieces make sure you feel at home wherever you go.",
  },
  {
    images: ["default-10", "default-11"],
    heading: "Zipped Hoodies",
    text: "Made from soft 50% cotton / 50% polyester preshrunk fleece knit. It features a full-length zipper and a spacious front pocket.",
  },
];

// Map of default image IDs to imported image assets
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

function getImageSource(img) {
  if (img instanceof File || img instanceof Blob) {
    return URL.createObjectURL(img);
  } else if (typeof img === "string") {
    if (img.startsWith("default-")) {
      // Still handle default images locally
      return defaultImageMap[img] || "";
    }
    // For everything else, just use the URL as is
    return img;
  }
  return ""; // Fallback
}

// BlockResetButton component
function BlockResetButton({ blockIdx, onReset, saving }) {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-red-600 border-red-300 hover:bg-red-100 transition"
          disabled={saving}
        >
          Reset
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset block {blockIdx + 1} to default?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove all content/images for this block and restore defaults. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="secondary">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={async () => {
                setOpen(false);
                await onReset();
              }}
              disabled={saving}
            >
              Yes, Reset
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export const AdminHomeCMS = () => {
  // ------------ INTRO SECTION ------------
  const [introData, setIntroData] = useState({
    intro_text_image: null,
    intro_image: null,
    intro_bg: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // ------------ SERVICE SECTION (EDIT) ------------
  const [services, setServices] = useState([]);
  const [serviceLoading, setServiceLoading] = useState(true);
  const [editIdx, setEditIdx] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editService, setEditService] = useState({ img: "", title: "", desc: "" });
  const [serviceSaving, setServiceSaving] = useState(false);
  const [showServicesResetDialog, setShowServicesResetDialog] = useState(false);

  // ------------ MAIN SECTION BLOCKS ------------
  const [blocks, setBlocks] = useState(defaultBlocks);

  // Add this function near your other utility functions
  function getStorageKeyFromUrl(url) {
    if (!url || typeof url !== 'string') return url;
    if (!url.startsWith('http')) return url; // Already a key

    // Extract just the filename part after the bucket name
    const BUCKET = "splnd-d-assets"; // Your bucket name
    const parts = url.split(`/${BUCKET}/`);
    return parts.length > 1 ? parts[1] : url;
  }


  // --------- Helpers for images ---------
  const getServiceDefaultImg = idx => {
    if (idx % 3 === 0) return ServiceImageDefault;
    if (idx % 3 === 1) return DeliveryImageDefault;
    if (idx % 3 === 2) return QualityImageDefault;
    return ServiceImageDefault;
  };
  const getServiceImgPreview = (img, idx) =>
    img
      ? typeof img === "string"
        ? img
        : img instanceof File || img instanceof Blob
          ? URL.createObjectURL(img)
          : ""
      : getServiceDefaultImg(idx);

  // --------- Data Fetching ----------
  const fetchIntro = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/cms/intro");
      setIntroData({
        intro_text_image: res.data?.intro_text_image || null,
        intro_image: res.data?.intro_image || null,
        intro_bg: res.data?.intro_bg || null,
      });
    } catch (e) {
      console.error("Intro fetch error:", e);
      toast.error("Failed to load intro data.");
      setIntroData({
        intro_text_image: null,
        intro_image: null,
        intro_bg: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    setServiceLoading(true);
    try {
      const res = await api.get("/admin/cms/services");
      if (Array.isArray(res.data) && res.data.length) {
        setServices(res.data.map((service, i) => ({
          ...service,
          img: service.img || getServiceDefaultImg(i),
        })));
      } else {
        setServices(defaultServices);
      }
    } catch (e) {
      console.error("Service fetch error:", e);
      setServices(defaultServices);
      toast.error("Failed to load services.");
    } finally {
      setServiceLoading(false);
    }
  };

  // --------- Fetch blocks from API ----------
  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const allBlocks = [];
      // For block 1
      const res1 = await api.get("/admin/cms/home-main-section/block1");
      allBlocks.push({
        images: Array.isArray(res1.data.images) && res1.data.images.length
          ? res1.data.images
          : defaultBlocks[0].images,
        heading: "", text: "",
      });
      // For blocks 2-4
      for (let i = 2; i <= 4; i++) {
        const res = await api.get(`/admin/cms/home-main-section/block${i}`);
        allBlocks.push({
          images: Array.isArray(res.data.images) && res.data.images.length
            ? res.data.images
            : defaultBlocks[i - 1].images,
          heading: res.data.heading || defaultBlocks[i - 1].heading,
          text: res.data.text || defaultBlocks[i - 1].text,
        });
      }
      setBlocks(allBlocks);
    } catch (e) {
      console.error("Failed to fetch main section blocks:", e);
      setBlocks(defaultBlocks);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntro();
    fetchServices();
    fetchBlocks();
    // eslint-disable-next-line
  }, []);

  const [showSkeleton, setShowSkeleton] = useState(true);

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

  // --- Skeleton loading UI ---
  if (loading || showSkeleton) {
    return (
      <section className="max-w-[1400px] p-5">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Skeleton className="h-8 w-56 sm:w-64 bg-gray-400" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-8">
          {/* Left side: Live preview skeleton */}
          <div className="xl:col-span-3 order-2 xl:order-1">
            <div className="bg-white shadow-sm border-0 rounded-lg">
              <div className="border-b bg-gray-50 rounded-t-lg p-3 sm:p-4">
                <Skeleton className="h-5 sm:h-6 w-32 sm:w-44 bg-gray-100" />
              </div>
              <div className="p-2 sm:p-4">
                <div className="space-y-4 sm:space-y-6">
                  {/* Intro section skeleton */}
                  <div className="w-full rounded-lg bg-gray-50 h-32 sm:h-48 flex flex-col sm:flex-row items-center justify-center p-2 sm:p-4">
                    <div className="w-full sm:w-1/2 flex flex-col items-center mb-3 sm:mb-0">
                      <Skeleton className="h-10 sm:h-16 w-40 sm:w-48 mb-3 bg-gray-200" />
                      <Skeleton className="h-8 w-24 bg-gray-200 rounded" />
                    </div>
                    <Skeleton className="h-16 sm:h-32 w-32 sm:w-40 rounded bg-gray-200" />
                  </div>

                  {/* Service section skeleton */}
                  <div className="w-full rounded-lg bg-gray-50 h-24 flex items-center justify-center p-2 sm:p-4">
                    <div className="flex gap-4 sm:gap-8">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <Skeleton className="h-8 w-8 rounded-full bg-gray-200 mb-2" />
                          <Skeleton className="h-3 w-16 bg-gray-200" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Main blocks skeleton */}
                  <div className="space-y-4">
                    {/* Block 1 */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                      {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-36 sm:h-48 w-full bg-gray-100 rounded" />
                      ))}
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side: Editors skeleton */}
          <div className="xl:col-span-2 order-1 xl:order-2 flex flex-col gap-4 sm:gap-8">
            {/* Tabs skeleton */}
            <Skeleton className="h-10 w-full rounded bg-gray-100" />

            {/* Editors skeleton */}
            <div className="p-3 sm:p-4 bg-white rounded-lg shadow flex flex-col gap-4 sm:gap-6">
              <div className="flex flex-col gap-1 sm:gap-2">
                <Skeleton className="h-5 sm:h-6 w-28 sm:w-36 bg-gray-200 mb-1" />
                <Skeleton className="h-3 sm:h-4 w-36 sm:w-48 bg-gray-100" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-2 sm:mb-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex flex-col gap-2">
                    <Skeleton className="h-3 sm:h-4 w-20 sm:w-24 bg-gray-100" />
                    <Skeleton className="h-24 sm:h-32 w-full rounded bg-gray-100" />
                    <Skeleton className="h-8 sm:h-10 w-full rounded bg-gray-100" />
                  </div>
                ))}
              </div>

              <div className="flex gap-2 sm:gap-3">
                <Skeleton className="h-8 sm:h-10 w-24 sm:w-28 rounded bg-gray-200" />
                <Skeleton className="h-8 sm:h-10 w-24 sm:w-28 rounded bg-gray-100" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // --------- Intro Section Handlers ---------
  const getPreview = (val, fallback) =>
    val
      ? typeof val === "string"
        ? val
        : val instanceof File || val instanceof Blob
          ? URL.createObjectURL(val)
          : fallback
      : fallback;

  const handleIntroImageChange = (key, file) => {
    setIntroData(data => ({ ...data, [key]: file }));
  };

  const handleIntroSave = async () => {
    setSaving(true);
    try {
      const form = new FormData();
      ["intro_text_image", "intro_image", "intro_bg"].forEach(key => {
        if (introData[key]) form.append(key, introData[key]);
      });
      await api.post("/admin/cms/intro", form);
      toast.success("Saved changes!");
      fetchIntro();
    } catch (e) {
      console.error("Failed to save changes:", e);
      toast.error("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleIntroReset = async () => {
    setSaving(true);
    try {
      await api.post("/admin/cms/intro/reset");
      toast.success("Images reset to default!");
      fetchIntro();
    } catch (e) {
      console.error("Failed to reset images:", e);
      toast.error("Failed to reset images.");
    } finally {
      setSaving(false);
      setShowResetDialog(false);
    }
  };

  // --------- Services Section Handlers ---------
  const openEditDialog = idx => {
    setEditIdx(idx);
    setEditService({
      img: services[idx].img,
      title: services[idx].title,
      desc: services[idx].desc || services[idx].description || "",
    });
    setEditDialogOpen(true);
  };

  const handleServiceEditChange = (key, val) => {
    setEditService(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const handleServiceImageChange = (file) => {
    setEditService(prev => ({
      ...prev,
      img: file
    }));
  };

  const handleEditServiceSave = async () => {
    setServiceSaving(true);
    try {
      const form = new FormData();
      if (editService.img && typeof editService.img !== "string") form.append("img", editService.img);
      form.append("title", editService.title);
      form.append("desc", editService.desc);

      const editId = services[editIdx]?._id || services[editIdx]?.id || editIdx + 1;

      await api.patch(`/admin/cms/services/${editId}`, form);
      toast.success("Service updated!");
      setEditDialogOpen(false);
      setEditIdx(null);
      setEditService({ img: "", title: "", desc: "" });
      fetchServices();
    } catch (e) {
      console.error("Failed to save service:", e);
      toast.error("Failed to save service.");
    } finally {
      setServiceSaving(false);
    }
  };

  const handleEditServiceCancel = () => {
    setEditDialogOpen(false);
    setEditIdx(null);
    setEditService({ img: "", title: "", desc: "" });
  };

  const handleServicesReset = async () => {
    setServiceSaving(true);
    try {
      await api.post("/admin/cms/services/reset");
      toast.success("Service section reset to defaults!");
      fetchServices();
    } catch (e) {
      console.error("Failed to reset service section:", e);
      toast.error("Failed to reset service section.");
    } finally {
      setServiceSaving(false);
      setShowServicesResetDialog(false);
    }
  };

  // ------------ Block Section (Main Section) Handlers ------------
  const handleMainImageChange = (blockIdx, imgIdx, file) => {
    setBlocks(prevBlocks => {
      const updated = prevBlocks.map((block, i) => {
        if (i !== blockIdx) return block;
        const newImages = [...block.images];
        newImages[imgIdx] = file;
        return {
          ...block,
          images: newImages
        };
      });
      return updated;
    });
  };

  const handleMainBlockFieldChange = (blockIdx, key, value) => {
    setBlocks(blocks => {
      const updated = [...blocks];
      updated[blockIdx] = { ...updated[blockIdx], [key]: value };
      return updated;
    });
  };

  // --- Save Logic: handleMainBlockSave ---
  const handleMainBlockSave = async (blockIdx) => {
    setSaving(true);
    try {
      const form = new FormData();
      const block = blocks[blockIdx];
      const expectedLen = defaultBlocks[blockIdx].images.length;

      let imagesKeep = [];
      let filesToUpload = [];

      for (let i = 0; i < expectedLen; i++) {
        const img = block.images[i];
        if (img instanceof File || img instanceof Blob) {
          imagesKeep.push(""); // Mark for replacement
          filesToUpload.push({ slot: i, file: img });
        } else if (typeof img === "string" && img) {
          // Convert any full URLs to storage keys before sending back to server
          imagesKeep.push(getStorageKeyFromUrl(img));
        } else {
          // Get the default for this slot
          const defaultKey = blockIdx === 0
            ? `default-${i + 1}`
            : blockIdx === 1
              ? `default-${i + 5}`
              : blockIdx === 2
                ? `default-${i + 7}`
                : `default-${i + 10}`;
          imagesKeep.push(defaultKey);
        }
      }

      // Upload files in the correct slot order
      filesToUpload.sort((a, b) => a.slot - b.slot);
      filesToUpload.forEach(({ file }) => {
        form.append("images", file);
      });

      // Add form data
      form.append("images_keep", JSON.stringify(imagesKeep));
      if (blockIdx !== 0) {
        form.append("heading", block.heading);
        form.append("text", block.text);
      }

      // Send to server
      await api.patch(`/admin/cms/home-main-section/block${blockIdx + 1}`, form);
      toast.success(`Block ${blockIdx + 1} saved successfully!`);
      await fetchBlocks();
    } catch (e) {
      console.error(`Failed to save block ${blockIdx + 1}:`, e);
      toast.error("Failed to save CMS main section block.");
    } finally {
      setSaving(false);
    }
  };

  // Individual block reset
  const handleMainBlockReset = async (blockIdx) => {
    setSaving(true);
    try {
      await api.post(`/admin/cms/home-main-section/block${blockIdx + 1}/reset`);
      toast.success(`Block ${blockIdx + 1} reset to default!`);
      await fetchBlocks();
    } catch (e) {
      console.error(`Failed to reset block ${blockIdx + 1}:`, e);
      toast.error(`Failed to reset block ${blockIdx + 1}.`);
    } finally {
      setSaving(false);
    }
  };

  // Render the intro section
  const renderIntroSection = () => (
    <div
      id="intro-bg"
      className="w-[20rem] md:w-[41rem] rounded-lg flex flex-wrap items-center justify-center bg-cover bg-center transition mb-8"
      style={{
        backgroundImage: `url('${getPreview(introData.intro_bg, IntroBGDefault)}')`,
        minHeight: "18rem",
      }}
    >
      <div
        id="intro-LC"
        className="moveFromLeft max-w-[30rem] flex flex-col justify-center items-center mr-0 md:mr-[2rem] w-full md:w-auto"
      >
        <img
          src={getPreview(introData.intro_text_image, IntroTextDefault)}
          id="intro-text"
          alt="Intro Text"
          className="w-full h-auto mb-[1.5rem] max-w-full"
          style={{
            maxHeight: 140,
            objectFit: "contain",
            borderRadius: 8,
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
          }}
        />
        <button
          id="intro-btn"
          className="rounded-lg px-6 py-2 text-sm hover:bg-[#e0b9a4] transition bg-[#f8e8db] font-semibold shadow"
        >
          Shop Now
        </button>
      </div>
      <img
        src={getPreview(introData.intro_image, IntroImageDefault)}
        id="intro-image"
        alt="Intro"
        className="moveFromRight min-w-[10px] max-w-[35rem] max-h-[400px] w-full md:w-auto rounded shadow"
        style={{
          objectFit: "contain",
        }}
      />
    </div>
  );

  // Render service section
  const renderServiceSection = () => (
    <div className="w-[20rem] md:w-[41rem] overflow-hidden flex justify-center items-center mb-8 py-4 bg-gray-50 rounded-lg">
      <div className="animate-service-scroll flex w-max">
        <section
          id="service-section"
          className="flex flex-nowrap gap-20 py-[1.5rem] sm:text-md text-sm"
        >
          {Array(20).fill(services).flat().map((service, idx) => (
            <div
              key={idx}
              className="service-container w-[15rem] h-[5rem] flex flex-wrap justify-center items-center gap-2 text-center"
            >
              <div className="flex gap-2">
                <img
                  src={getServiceImgPreview(service.img, idx)}
                  className="service-section-images w-[2.5rem]"
                  alt=""
                  onError={e => { e.target.src = getServiceDefaultImg(idx); }}
                />
                <strong className="flex self-center text-lg">
                  {service.title}
                </strong>
              </div>
              <p className="service-p text-sm mt-[-0.5rem]">{service.desc || service.description}</p>
            </div>
          ))}
        </section>
      </div>
      <style>{`
        @keyframes serviceScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-service-scroll {
          animation: serviceScroll 60s linear infinite;
        }
      `}</style>
    </div>
  );

  // Render main content blocks - FIXED to match exactly the original HomeSec1 layout
  const renderMainBlocks = () => (
    <div className="space-y-8">
      {/* Block 1 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {blocks[0].images.map((img, index) => {
          const imgSrc = getImageSource(img);
          return (
            imgSrc && (
              <img
                key={index}
                src={imgSrc}
                alt={`Image ${index + 1}`}
                className="w-full h-[35rem] md:h-[30rem] rounded-md object-cover"
              />
            )
          );
        })}
      </div>

      {/* Block 2 */}
      <div className="relative grid grid-cols-1 md:grid-cols-2">
        {[0, 1].map(idx => {
          const img = blocks[1].images[idx];
          const imgSrc = getImageSource(img);
          return (
            imgSrc && (
              <img
                key={idx}
                src={imgSrc}
                alt={`Image ${5 + idx}`}
                className={
                  idx === 0
                    ? "w-full h-[35rem] md:h-[45rem] md:rounded-bl-lg md:rounded-tl-lg object-cover"
                    : "w-full h-[35rem] md:h-[45rem] md:rounded-br-lg md:rounded-tr-lg object-cover"
                }
              />
            )
          );
        })}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4 bg-black/40">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">{blocks[1].heading}</h2>
          <p className="max-w-xl mb-4 text-sm md:text-base">{blocks[1].text}</p>
          <Button className="bg-white text-black px-4 py-2 rounded-md font-medium hover:bg-gray-200">
            Shop Now
          </Button>
        </div>
      </div>

      {/* Block 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="p-[4rem] flex flex-col gap-[2rem] justify-center items-center">
          <h2 className="font-semibold text-[1.5rem]">{blocks[2].heading}</h2>
          <p>{blocks[2].text}</p>
          <Button className="cursor-pointer">
            View Products
          </Button>
        </div>
        <div>
          {blocks[2].images.map((img, idx) => {
            const imgSrc = getImageSource(img);
            return (
              imgSrc && (
                <img
                  key={idx}
                  src={imgSrc}
                  alt={`Image ${idx + 7}`}
                  className="w-full h-[35rem] md:h-[45rem] object-cover"
                />
              )
            );
          })}
        </div>
      </div>

      {/* Block 4 */}
      <div className="relative grid grid-cols-1 md:grid-cols-2">
        {[0, 1].map(idx => {
          const img = blocks[3].images[idx];
          const imgSrc = getImageSource(img);
          return (
            imgSrc && (
              <img
                key={idx}
                src={imgSrc}
                alt={`Image ${10 + idx}`}
                className="w-full h-[35rem] md:h-[45rem] object-cover"
              />
            )
          );
        })}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4 bg-black/40">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">{blocks[3].heading}</h2>
          <p className="max-w-xl mb-4 text-sm md:text-base">{blocks[3].text}</p>
          <Button className="bg-white text-black px-4 py-2 rounded-md font-medium hover:bg-gray-200">
            Shop Now
          </Button>
        </div>
      </div>
    </div>
  );

  // Render the intro section editor
  const renderIntroEditor = () => (
    <Card>
      <CardHeader>
        <CardTitle>Intro Section Editor</CardTitle>
        <CardDescription>Update the banner and main images</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-6"
          onSubmit={e => {
            e.preventDefault();
            handleIntroSave();
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-3">
              <label className="font-medium text-sm">Banner Text Image</label>
              <div className="bg-gray-50 p-3 rounded-lg mb-2">
                <img
                  src={getPreview(introData.intro_text_image, IntroTextDefault)}
                  alt="Banner Preview"
                  className="w-full h-auto object-contain max-h-24 mx-auto"
                />
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (!file.type.startsWith("image/")) {
                    toast.error("Only image files are allowed.");
                    e.target.value = ""; // reset file input so user can reselect
                    return;
                  }
                  handleIntroImageChange("intro_text_image", file);
                }}
                className="text-sm"
              />
              <span className="text-xs text-gray-500">Transparent PNG recommended</span>
            </div>

            <div className="flex flex-col gap-3">
              <label className="font-medium text-sm">Main Photo</label>
              <div className="bg-gray-50 p-3 rounded-lg mb-2">
                <img
                  src={getPreview(introData.intro_image, IntroImageDefault)}
                  alt="Main Photo Preview"
                  className="w-full h-auto object-contain max-h-24 mx-auto"
                />
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (!file.type.startsWith("image/")) {
                    toast.error("Only image files are allowed.");
                    e.target.value = ""; // reset file input so user can reselect
                    return;
                  }
                  handleIntroImageChange("intro_image", file);
                }}
                className="text-sm"
              />
              <span className="text-xs text-gray-500">Square/portrait ratio recommended</span>
            </div>

            <div className="flex flex-col gap-3">
              <label className="font-medium text-sm">Background Image</label>
              <div
                className="bg-gray-50 p-3 rounded-lg mb-2 h-24"
                style={{
                  backgroundImage: `url('${getPreview(introData.intro_bg, IntroBGDefault)}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              ></div>
              <Input
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (!file.type.startsWith("image/")) {
                    toast.error("Only image files are allowed.");
                    e.target.value = ""; // reset file input
                    return;
                  }
                  handleIntroImageChange("intro_text_image", file);
                }}
                className="text-sm"
              />
              <span className="text-xs text-gray-500">Subtle, large image recommended</span>
            </div>
          </div>

          <div className="flex gap-3 mt-3">
            <Button
              type="submit"
              disabled={saving}
              className="px-6"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>

            <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  className="text-red-600 border-red-300 hover:bg-red-100"
                >
                  Reset to Default
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset all images to default?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove your uploaded images and restore the original site defaults. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel asChild>
                    <Button variant="secondary">Cancel</Button>
                  </AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button
                      variant="destructive"
                      onClick={handleIntroReset}
                      disabled={saving}
                    >
                      Yes, Reset
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  // Render services editor
  const renderServicesEditor = () => (
    <Card>
      <CardHeader>
        <CardTitle>Services Section Editor</CardTitle>
        <CardDescription>Update the scrolling service items</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {services.map((service, idx) => (
            <div key={idx} className="bg-white border rounded-lg p-4 flex flex-col items-center">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={getServiceImgPreview(service.img, idx)}
                  alt=""
                  className="w-10 h-10 object-contain"
                  onError={e => { e.target.src = getServiceDefaultImg(idx); }}
                />
                <h3 className="font-medium">{service.title}</h3>
              </div>
              <p className="text-sm text-center mb-4">{service.desc || service.description}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openEditDialog(idx)}
                disabled={serviceSaving}
                className="mt-auto"
              >
                Edit
              </Button>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <AlertDialog open={showServicesResetDialog} onOpenChange={setShowServicesResetDialog}>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={serviceSaving}
                className="text-red-600 border-red-300 hover:bg-red-100"
              >
                Reset All to Default
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset all service items to default?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all changes and restore the default service section (icons & text). This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button variant="secondary">Cancel</Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button
                    variant="destructive"
                    onClick={handleServicesReset}
                    disabled={serviceSaving}
                  >
                    Yes, Reset All
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Service Edit Dialog */}
        <AlertDialog open={editDialogOpen} onOpenChange={open => { if (!open) handleEditServiceCancel(); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Service</AlertDialogTitle>
              <AlertDialogDescription>
                Update the service icon, title, or description.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleEditServiceSave();
              }}
              className="flex flex-col gap-3"
            >
              <div className="flex gap-4 items-center">
                <div>
                  <img
                    src={getServiceImgPreview(editService.img, editIdx)}
                    alt="preview"
                    className="w-16 h-16 object-contain mb-2 bg-gray-50 p-2 rounded-md"
                    onError={e => { e.target.src = getServiceDefaultImg(editIdx); }}
                  />
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!file.type.startsWith("image/")) {
                        toast.error("Only image files are allowed.");
                        e.target.value = ""; // reset file input so user can reselect
                        return;
                      }
                      handleServiceImageChange(file);
                    }}
                    className="text-sm w-full"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium block mb-1">Title</label>
                  <Input
                    type="text"
                    placeholder="Title"
                    value={editService.title}
                    onChange={e => handleServiceEditChange("title", e.target.value)}
                    required
                    className="mb-3"
                  />
                  <label className="text-sm font-medium block mb-1">Description</label>
                  <Textarea
                    placeholder="Description"
                    value={editService.desc}
                    onChange={e => handleServiceEditChange("desc", e.target.value)}
                    required
                    className="resize-none"
                    rows={2}
                  />
                </div>
              </div>
              <AlertDialogFooter className="mt-4">
                <AlertDialogCancel asChild>
                  <Button type="button" variant="secondary" onClick={handleEditServiceCancel}>Cancel</Button>
                </AlertDialogCancel>
                <Button type="submit" disabled={serviceSaving}>
                  {serviceSaving ? "Saving..." : "Save Changes"}
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );

  // Render block editor
  const renderBlocksEditor = () => (
    <Tabs defaultValue="block1" className="w-full">
      <TabsList className="mb-4 w-full grid grid-cols-4">
        <TabsTrigger value="block1">Block 1</TabsTrigger>
        <TabsTrigger value="block2">Block 2</TabsTrigger>
        <TabsTrigger value="block3">Block 3</TabsTrigger>
        <TabsTrigger value="block4">Block 4</TabsTrigger>
      </TabsList>

      {blocks.map((block, blockIdx) => (
        <TabsContent key={blockIdx} value={`block${blockIdx + 1}`} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit Block {blockIdx + 1}</CardTitle>
              <CardDescription>Update images {blockIdx !== 0 ? "and content" : ""}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {block.images.map((img, imgIdx) => {
                  const imgSrc = getImageSource(img);
                  return (
                    <div key={imgIdx} className="flex flex-col items-center">
                      <div className="bg-gray-50 rounded-lg p-2 w-full mb-2" style={{ height: '120px' }}>
                        {imgSrc && (
                          <img
                            src={imgSrc}
                            alt=""
                            className="w-full h-full object-contain rounded"
                          />
                        )}
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (!file.type.startsWith("image/")) {
                            toast.error("Only image files are allowed.");
                            e.target.value = ""; // reset file input so user can reselect
                            return;
                          }
                          handleMainImageChange(blockIdx, imgIdx, file);
                        }}
                        className="text-xs w-full"
                      />
                      <span className="text-xs text-gray-500 mt-1">
                        Image {imgIdx + 1}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Block 1: images only, no heading/text */}
              {blockIdx !== 0 && (
                <div className="space-y-3 mt-6">
                  <div>
                    <label className="text-sm font-medium block mb-1">Heading</label>
                    <Input
                      placeholder="Block Heading"
                      value={block.heading}
                      onChange={e => handleMainBlockFieldChange(blockIdx, "heading", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Description</label>
                    <Textarea
                      placeholder="Block Body Text"
                      value={block.text}
                      onChange={e => handleMainBlockFieldChange(blockIdx, "text", e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  onClick={() => handleMainBlockSave(blockIdx)}
                  disabled={saving}
                  className="px-6"
                >
                  {saving ? "Saving..." : "Save Block"}
                </Button>
                <BlockResetButton
                  blockIdx={blockIdx}
                  onReset={() => handleMainBlockReset(blockIdx)}
                  saving={saving}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );

  if (loading || serviceLoading)
    return (
      <div className="flex items-center justify-center h-40">
        <span className="text-lg text-gray-500">Loading...</span>
      </div>
    );

  return (
    <section className="max-w-[1400px] mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Home Page Content Manager</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Left side: Live preview */}
        <div className="xl:col-span-3 order-2 xl:order-1">
          <Card className="bg-white shadow-sm border-0 sticky top-4">
            <CardHeader className="border-b bg-gray-50 rounded-t-lg">
              <CardTitle className="text-lg">Live Homepage Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ScrollArea className="h-[800px] rounded-md pr-4">
                <div className="p-2">
                  {renderIntroSection()}
                  {renderServiceSection()}
                  {renderMainBlocks()}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right side: Editors */}
        <div className="xl:col-span-2 order-1 xl:order-2">
          <Tabs defaultValue="intro" className="w-full">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="intro">Intro</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="blocks">Blocks</TabsTrigger>
            </TabsList>

            <TabsContent value="intro">
              {renderIntroEditor()}
            </TabsContent>

            <TabsContent value="services">
              {renderServicesEditor()}
            </TabsContent>

            <TabsContent value="blocks">
              {renderBlocksEditor()}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};