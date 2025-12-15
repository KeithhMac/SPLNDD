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

const DEFAULT_PRIVACY = {
  title: "Privacy Policy",
  description: "At SPLND’D Clothing, your privacy is our priority. This policy explains how we collect, use, and protect your information.",
  sections: [
    {
      icon: "Shield",
      title: "Information We Collect",
      details:
        "We collect information you provide during account creation, purchases, and interactions with our website. This may include your name, email, shipping address, and transaction details.",
    },
    {
      icon: "FileText",
      title: "Use of Personal Data",
      details:
        "Your data is used to process orders, enhance our services, personalize your shopping experience, and keep you informed about promotions or updates. We do not sell or share your information with third parties, except for essential service providers that support our operations, such as Maya Payment Gateway for secure transactions, J&T Express, and Ninja Van for shipping and delivery.",
    },
    {
      icon: "User",
      title: "Personal Information",
      details:
        "You have the right to access, update, or delete your personal information. Requests for changes can be made through your account settings.",
    },
    {
      icon: "Cloud",
      title: "Website Cookies",
      details:
        "We use cookies to enhance user experience, track website performance, and improve our services. You can manage cookie preferences through your browser settings.",
    },
    {
      icon: "Lock",
      title: "Security Services",
      details:
        "We use security measures to protect your personal data from unauthorized access, misuse, or breaches. However, no system is completely secure. For your safety, your One-Time Password (OTP) is for you only — never share it with anyone.",
    },
    {
      icon: "Info",
      title: "Contact",
      details:
        "Last updated: 9/20/2025\nFor questions, contact us at splendidhoodies@gmail.com",
    },
  ],
};
import { Skeleton } from "@/components/ui/skeleton";

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
          /Last updated:.*\nFor questions/,
          `Last updated: ${updatedDateStr}\nFor questions`
        ),
      }
      : section
  );
}

export const AdminPrivacyPage = () => {
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(DEFAULT_PRIVACY);
  const [lastUpdated, setLastUpdated] = useState(getNowDateString());
  const [savingAll, setSavingAll] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState({});

  useEffect(() => {
    async function fetchPrivacy() {
      setLoading(true);
      try {
        const res = await api.get("/admin/privacy-cms");
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
            ...DEFAULT_PRIVACY,
            sections: updateContactSectionDate(DEFAULT_PRIVACY.sections, backendDate),
          });
        }
      } catch (e) {
        console.error("Error fetching Privacy Policy:", e);
        setEdit({
          ...DEFAULT_PRIVACY,
          sections: updateContactSectionDate(DEFAULT_PRIVACY.sections, lastUpdated),
        });
        toast.error("Failed to fetch Privacy Policy page. Showing default.");
      } finally {
        setLoading(false);
      }
    }
    fetchPrivacy();
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
      await api.post("/admin/privacy-cms", { data: toSave });
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
      await api.post("/admin/privacy-cms", { data: toSave });
      updateDateAndSet(toSave, dateStr);
      toast.success("All changes saved!");
    } catch (e) {
      console.error("Error saving changes:", e);
      toast.error("Failed to save changes.");
    } finally {
      setSavingAll(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await api.post("/admin/privacy-cms/restore");
      const dateStr = getNowDateString();
      updateDateAndSet(DEFAULT_PRIVACY, dateStr);
      toast.success("Restored to default!");
    } catch (e) {
      console.error("Error restoring default:", e);
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
          Admin Privacy Policy
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