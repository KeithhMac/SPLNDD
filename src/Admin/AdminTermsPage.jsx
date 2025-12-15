import React, { useEffect, useState } from "react";
import api from "@/api/axios";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield, FileText, User, Lock, Truck, RotateCcw, CheckCircle, BookOpen, Calendar,
  Inbox, Heart, Globe, Gift, Bell, Camera, Cloud, Edit, Flag, Folder, Home, Info,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ICON_OPTIONS = [
  { label: "Shield", value: "Shield", icon: Shield },
  { label: "FileText", value: "FileText", icon: FileText },
  { label: "User", value: "User", icon: User },
  { label: "Lock", value: "Lock", icon: Lock },
  { label: "Truck", value: "Truck", icon: Truck },
  { label: "RotateCcw", value: "RotateCcw", icon: RotateCcw },
  { label: "CheckCircle", value: "CheckCircle", icon: CheckCircle },
  { label: "BookOpen", value: "BookOpen", icon: BookOpen },
  { label: "Calendar", value: "Calendar", icon: Calendar },
  { label: "Inbox", value: "Inbox", icon: Inbox },
  { label: "Heart", value: "Heart", icon: Heart },
  { label: "Globe", value: "Globe", icon: Globe },
  { label: "Gift", value: "Gift", icon: Gift },
  { label: "Bell", value: "Bell", icon: Bell },
  { label: "Camera", value: "Camera", icon: Camera },
  { label: "Cloud", value: "Cloud", icon: Cloud },
  { label: "Edit", value: "Edit", icon: Edit },
  { label: "Flag", value: "Flag", icon: Flag },
  { label: "Folder", value: "Folder", icon: Folder },
  { label: "Home", value: "Home", icon: Home },
  { label: "Info", value: "Info", icon: Info },
];

const DEFAULT_TERMS = {
  title: "Terms of Service",
  description: "Please read these terms carefully before using SPLND’s website and services.",
  sections: [
    {
      icon: "Shield",
      title: "Our Commitment",
      details:
        "At SPLND’D, we value honesty and transparency. These Terms of Service explain how our website operates and what you can expect from us. We are committed to providing a smooth and secure experience for all users.",
    },
    {
      icon: "FileText",
      title: "Acceptance of Terms",
      details:
        "By accessing or using our website, you agree to comply with and be bound by these Terms of Service. We encourage you to review these terms carefully before using our website.",
    },
    {
      icon: "User",
      title: "Use of Our Services",
      details:
        "You agree to use our services for lawful purposes only. Any misuse, fraudulent activity, or unauthorized resale of products is strictly prohibited. We reserve the right to suspend or terminate accounts that violate our terms or engage in fraudulent activities.",
    },
    {
      icon: "User",
      title: "User Accounts",
      details:
        "To make a purchase or access certain features, you may need to create an account. You can log in using your email, or by linking your Google or Facebook account. You are responsible for maintaining the confidentiality of your login details and ensuring that all account information is accurate and up to date.",
    },
    {
      icon: "Lock",
      title: "Personal Data",
      details:
        "By using our website, you agree to provide accurate and complete personal information necessary for order fulfillment. We collect, store, and use your personal data in accordance with our Privacy Policy, ensuring its protection and responsible handling.",
    },
    {
      icon: "FileText",
      title: "Orders and Payments",
      details:
        "All orders placed on our website are processed automatically by our system. Prices are listed in Philippine Peso (PHP) and may change without prior notice. We accept multiple payment methods, including credit and debit cards, as well as E-wallets. Payments must be completed for the order to be processed.",
    },
    {
      icon: "RotateCcw",
      title: "Cancellation Policy",
      details:
        "Once a payment is successfully completed, the order cannot be cancelled. Please ensure that all order details, including products, quantities, and shipping information, are correct before completing your purchase.",
    },
    {
      icon: "Truck",
      title: "Shipping and Delivery",
      details:
        "We strive to process and ship orders as quickly as possible. All orders are shipped via J&T Express or NinjaVan. Shipping fees will vary depending on your location and will be calculated at checkout.\n\nOnce your order has been shipped, you will receive tracking details via email notification. You may use these details to monitor your order status on the official courier tracking websites:\n- J&T Express: https://www.jtexpress.ph/track\n- NinjaVan: https://www.ninjavan.co/en-ph/tracking\n\nPlease note that we are not responsible for delays caused by the couriers. If you encounter any delivery issues, we recommend reaching out directly to the assigned courier for assistance.",
    },
    {
      icon: "CheckCircle",
      title: "Product Issues",
      details:
        "If you receive a missing, incorrect, damaged, or defective product, please contact us within 7 days of receiving your order. We will review the issue and provide a resolution, which may include a replacement or store credit. All returns must comply with our Return Policy.",
    },
    {
      icon: "RotateCcw",
      title: "Returns & Exchanges",
      details:
        "Returns: If your return request is approved, you will receive store credit in the form of a coupon equal to your order amount. You can use this coupon on your next purchase.\nExchanges: If your exchange request is approved, we will send you a replacement of the same item only.",
    },
    {
      icon: "User",
      title: "User Reviews",
      details:
        "We value your feedback. By submitting a review, you grant us permission to use, display, and share it across our website and promotional materials. Reviews containing inappropriate language are automatically censored by our system.",
    },
    {
      icon: "Shield",
      title: "Intellectual Property",
      details:
        "All content on this website, including text, images, logos, and designs, belongs to Splendid and may not be copied or used without permission. You may share our content publicly if it promotes Splendid, as long as it is not altered or used in a misleading way.",
    },
    {
      icon: "FileText",
      title: "Amendments to Terms",
      details:
        "We reserve the right to modify these Terms of Service at any time. Updated terms will be posted on this page and are effective immediately upon posting.",
    },
    {
      icon: "Info",
      title: "Contact",
      details:
        "Last updated: 9/20/2025\nIf you have any questions, contact us at splendidhoodies@gmail.com",
    },
  ],
};

function getNowDateString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${yyyy}`;
}

// Replace the "Last updated: ..." line in the Info/Contact section
function updateContactSectionDate(sections, updatedDateStr) {
  return sections.map((section) =>
    section.icon === "Info" && section.title === "Contact"
      ? {
        ...section,
        details: section.details.replace(
          /Last updated:.*\nIf you have any questions/,
          `Last updated: ${updatedDateStr}\nIf you have any questions`
        ),
      }
      : section
  );
}

export const AdminTermsPage = () => {
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(DEFAULT_TERMS);
  const [lastUpdated, setLastUpdated] = useState(getNowDateString());
  // Button loading states
  const [savingAll, setSavingAll] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState({});

  useEffect(() => {
    async function fetchTerms() {
      setLoading(true);
      try {
        const res = await api.get("/admin/terms-cms");
        let backendDate = getNowDateString();
        if (res.data && res.data.updated_at) {
          const dt = new Date(res.data.updated_at);
          backendDate = `${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getDate()).padStart(2, "0")}/${dt.getFullYear()}`;
        }
        setLastUpdated(backendDate);

        if (res.data && res.data.sections) {
          setEdit({
            ...res.data,
            sections: updateContactSectionDate(res.data.sections, backendDate),
          });
        } else {
          setEdit({
            ...DEFAULT_TERMS,
            sections: updateContactSectionDate(DEFAULT_TERMS.sections, backendDate),
          });
        }
      } catch (e) {
        console.error("❌ Failed to fetch terms page content:", e);
        setEdit({
          ...DEFAULT_TERMS,
          sections: updateContactSectionDate(DEFAULT_TERMS.sections, lastUpdated),
        });
        toast.error("Failed to fetch Terms page. Showing default.");
      } finally {
        setLoading(false);
      }
    }
    fetchTerms();
    // eslint-disable-next-line
  }, []);

  const updateDateAndSet = (newEdit, dateString) => {
    setEdit({
      ...newEdit,
      sections: updateContactSectionDate(newEdit.sections, dateString),
    });
    setLastUpdated(dateString);
  };

  const handleSectionChange = (idx, field, value) => {
    setEdit((prev) => {
      const nextSections = prev.sections.map((s, i) =>
        i === idx ? { ...s, [field]: value } : s
      );
      return { ...prev, sections: nextSections };
    });
  };

  // Only Delete per section, and auto-save after delete
  const handleDeleteSection = async (idx) => {
    setDeleting((prev) => ({ ...prev, [idx]: true }));
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const updatedSections = edit.sections.filter((_, i) => i !== idx);
      const dateStr = getNowDateString();
      const toSave = {
        ...edit,
        sections: updateContactSectionDate(updatedSections, dateStr),
      };
      setEdit(toSave);
      await api.post("/admin/terms-cms", { data: toSave });
      setLastUpdated(dateStr);
      toast.success("Section deleted!");
    } catch {
      toast.error("Failed to delete section.");
    } finally {
      setDeleting((prev) => ({ ...prev, [idx]: false }));
    }
  };

  const handleAddSection = async () => {
    setAdding(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setEdit((prev) => ({
        ...prev,
        sections: [
          ...prev.sections,
          { icon: "FileText", title: "", details: "" },
        ],
      }));
      toast.success("Section added!");
    } catch {
      toast.error("Failed to add section.");
    } finally {
      setAdding(false);
    }
  };

  const handleSaveAll = async () => {
    setSavingAll(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const dateStr = getNowDateString();
      const cleanedSections = edit.sections.filter(
        (s) => s.title.trim() || s.details.trim()
      );
      const toSave = {
        ...edit,
        sections: updateContactSectionDate(cleanedSections, dateStr),
      };
      await api.post("/admin/terms-cms", { data: toSave });
      updateDateAndSet(toSave, dateStr);
      toast.success("All changes saved!");
    } catch (e) {
      console.error("❌ Failed to save terms page content:", e);
      toast.error("Failed to save changes.");
    } finally {
      setSavingAll(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await api.post("/admin/terms-cms/restore");
      const dateStr = getNowDateString();
      updateDateAndSet(DEFAULT_TERMS, dateStr);
      toast.success("Restored to default!");
    } catch (e) {
      console.error("❌ Failed to restore default terms page content:", e);
      toast.error("Failed to restore default content.");
    } finally {
      setRestoring(false);
    }
  };

  const [showSkeleton, setShowSkeleton] = useState(true);

  // Simulate an initial loading effect
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 400);
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
      <div className="container mx-auto px-2 py-10">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <Skeleton className="h-10 w-72 bg-gray-400" />
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Edit Form Skeleton */}
          <div className="flex-1 min-w-0 w-full max-w-full overflow-hidden">
            <div className="p-6 bg-white rounded-lg shadow-md flex flex-col gap-5">
              <Skeleton className="h-7 w-40 bg-gray-200 mb-2" />
              <div className="mb-6">
                <Skeleton className="h-4 w-32 bg-gray-100 mb-2" />
                <Skeleton className="h-10 w-full rounded bg-gray-100 mb-2" />
                <Skeleton className="h-4 w-32 bg-gray-100 mb-2" />

              </div>
              <Skeleton className="h-6 w-36 bg-gray-100 mb-4" />
              <div className="h-[20rem] p-3 space-y-5">
                {[...Array(1)].map((_, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg border p-4 flex flex-col md:flex-row gap-4 items-start">
                    <Skeleton className="h-10 w-40 bg-gray-100 mb-2" />
                    <div className="flex-1 flex flex-col gap-2 w-full">
                      <Skeleton className="h-10 w-full bg-gray-100 mb-2" />
                      <Skeleton className="h-16 w-full bg-gray-100" />
                    </div>
                    <div className="flex gap-2 items-end mt-2 md:mt-0">
                      <Skeleton className="h-8 w-20 rounded bg-gray-100" />
                    </div>
                  </div>
                ))}

              </div>

            </div>
          </div>
          {/* Right: Live Preview Skeleton */}
          <div className="flex-1 min-w-0 w-full max-w-full">
            <div className="p-6 bg-white rounded-lg shadow-md flex flex-col gap-5">
              <Skeleton className="h-7 w-40 bg-gray-200 mb-2" />
              <div className="h-[70vh] p-4 space-y-7">
                <Skeleton className="h-14 w-full bg-gray-100 mb-6" />
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <Skeleton className="h-7 w-7 rounded bg-gray-100" />
                    <div className="flex-1">
                      <Skeleton className="h-6 w-32 bg-gray-100 mb-3" />
                      <Skeleton className="h-12 w-full bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="container mx-auto px-2 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-[2rem] sm:text-[2.5rem] font-bold text-center sm:text-left w-full sm:w-auto">
          Admin Terms of Service
        </h1>
        <span className="text-gray-500 text-sm text-center sm:text-right w-full sm:w-auto">
          Last updated: {lastUpdated ? lastUpdated : "—"}
        </span>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Edit Form */}
        <Card className="flex-1 min-w-0 w-full max-w-full overflow-hidden">
          <CardHeader>
            <CardTitle className="text-[1.125rem] text-gray-700 font-semibold">
              Edit Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Page Title/Description */}
            <div className="mb-6">
              <label className="block font-semibold mb-1">Page Title</label>
              <Input
                value={edit.title}
                onChange={(e) =>
                  setEdit((prev) => ({ ...prev, title: e.target.value }))
                }
                className="mb-2"
              />
              <label className="block font-semibold mb-1">Page Description</label>
              <Textarea
                rows={2}
                value={edit.description}
                onChange={(e) =>
                  setEdit((prev) => ({ ...prev, description: e.target.value }))
                }
                className="mb-2"
              />
            </div>
            {/* ScrollArea for sections */}
            <ScrollArea className="h-[20rem] p-3">
              <div className="space-y-6">
                {edit.sections.map((section, idx) => {
                  const IconComponent =
                    ICON_OPTIONS.find((i) => i.value === section.icon)?.icon || FileText;
                  return (
                    <div
                      key={idx}
                      className="bg-gray-50 rounded-lg border p-4 flex flex-col md:flex-row gap-4 items-start relative"
                    >
                      <div className="flex flex-col gap-5">
                        <div className="flex items-center gap-2 min-w-[160px]">
                          <Select
                            value={section.icon}
                            onValueChange={(value) =>
                              handleSectionChange(idx, "icon", value)
                            }
                            disabled={deleting[idx]}
                          >
                            <SelectTrigger className="w-[8rem]">
                              <SelectValue>
                                <span className="flex items-center gap-2">
                                  <IconComponent className="w-5 h-5 text-[#BC6C25]" />
                                  {section.icon}
                                </span>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {ICON_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  <span className="flex items-center gap-2">
                                    <opt.icon className="w-5 h-5 text-[#BC6C25]" />
                                    {opt.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1 flex flex-col gap-2 w-full">
                          <Input
                            placeholder="Section Title"
                            value={section.title}
                            onChange={(e) =>
                              handleSectionChange(idx, "title", e.target.value)
                            }
                            disabled={deleting[idx]}
                          />
                          <Textarea
                            placeholder="Section Details"
                            rows={3}
                            value={section.details}
                            onChange={(e) =>
                              handleSectionChange(idx, "details", e.target.value)
                            }
                            disabled={deleting[idx]}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end mt-2 md:mt-0 md:sticky md:top-2 self-start z-10">
                        {edit.sections.length > 1 && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-20 flex items-center justify-center"
                            onClick={() => handleDeleteSection(idx)}
                            disabled={deleting[idx]}
                          >
                            {deleting[idx] ? (
                              <Loader2 className="animate-spin w-4 h-4 mr-2" />
                            ) : null}
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-center pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddSection}
                    disabled={adding}
                    className="flex items-center justify-center"
                  >
                    {adding ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                    + Add New Content
                  </Button>
                </div>
              </div>
            </ScrollArea>
            {/* Save and Restore buttons OUTSIDE of ScrollArea */}
            <div className="flex flex-col sm:flex-row gap-2 pt-4 w-full flex-wrap">
              <Button
                type="button"
                className="bg-[#BC6C25] text-white hover:bg-[#a85a1c] w-full sm:w-auto flex items-center justify-center"
                onClick={handleSaveAll}
                disabled={savingAll || restoring}
              >
                {savingAll ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                Save All
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto flex items-center justify-center"
                onClick={handleRestore}
                disabled={restoring || savingAll}
              >
                {restoring ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                Restore Default
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* Right: Live Preview */}
        <Card className="flex-1 min-w-0 w-full max-w-full">
          <CardHeader>
            <CardTitle className="text-[1.125rem] text-gray-700 font-semibold">
              Live Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[70vh] p-4">
              <div className="mb-[1.5rem] text-center">
                <h1 className="text-[2rem] sm:text-[2.5rem] font-bold mb-[1rem] break-words">
                  {edit.title}
                </h1>
                <p className="text-gray-600 text-[0.875rem] sm:text-[1rem] max-w-[40rem] mx-auto break-words">
                  {edit.description}
                </p>
              </div>
              <div className="space-y-8">
                {edit.sections
                  .filter((s) => s.title || s.details)
                  .map((section, idx) => {
                    const IconComponent =
                      ICON_OPTIONS.find((i) => i.value === section.icon)?.icon || FileText;
                    return (
                      <div key={idx} className="flex gap-3 items-start">
                        <IconComponent className="w-7 h-7 text-[#BC6C25] flex-shrink-0 mt-1" />
                        <div>
                          <h2 className="text-xl font-semibold mb-2">{section.title}</h2>
                          <p className="text-gray-700 whitespace-pre-line">
                            {section.details}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};