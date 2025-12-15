import React, { useEffect, useState } from "react";
import api from "@/api/axios";
import { toast } from "sonner";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Shield, FileText, User, Lock, Truck, RotateCcw, CheckCircle, BookOpen, Calendar,
  Inbox, Heart, Globe, Gift, Bell, Camera, Cloud, Edit, Flag, Folder, Home, Info,
} from "lucide-react";

// 20 Lucide icon options for About page sections
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

const ICON_MAP = Object.fromEntries(ICON_OPTIONS.map(opt => [opt.value, opt.icon]));

const DEFAULT_ABOUT = {
  title: "About SPLND",
  description:
    "SPLND is more than just clothing — it’s a lifestyle. We create modern, timeless pieces designed for everyday comfort, self-expression, and confidence.",
  sections: [
    {
      icon: "Shield",
      title: "What SPLND Stands For",
      details: 'SPLND means <span class="font-medium">“Same Person Living New Dreams.”</span> It’s a philosophy that reminds us we can grow and evolve while staying true to who we are.',
    },
    {
      icon: "FileText",
      title: "Our Mission",
      details: "To design versatile clothing that blends comfort and quality with modern aesthetics. Whether casual essentials or statement pieces, our goal is to empower individuals to express themselves.",
    },
    {
      icon: "Heart",
      title: "Crafted with Purpose",
      details: "Every garment is made with care — using premium fabrics, sustainable practices where possible, and attention to detail.",
    },
    {
      icon: "Truck",
      title: "Global Reach",
      details: "No matter where you are, SPLND delivers worldwide.",
    },
    {
      icon: "Users",
      title: "A Community of Dreamers",
      details: "SPLND is more than a brand — it’s a community of dreamers, doers, and believers.",
    },
    {
      icon: "Info",
      title: "",
      details: 'Thank you for being part of the SPLND journey.<br />Follow us on <a href="https://www.instagram.com/shop.splndd/" target="_blank" rel="noopener noreferrer" class="text-[#BC6C25] font-medium underline hover:text-[#a85a1c]">Instagram</a> for the latest drops and updates.',
    },
  ],
};
import { Skeleton } from "@/components/ui/skeleton";

export const AdminAboutPage = () => {
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(DEFAULT_ABOUT);
  const [about, setAbout] = useState(DEFAULT_ABOUT);
  const [savingAll, setSavingAll] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState({});

  useEffect(() => {
    const fetchAbout = async () => {
      setLoading(true);
      try {
        const res = await api.get("/admin/about-cms");
        if (res.data && res.data.sections) {
          setAbout(res.data);
          setEdit(res.data);
        } else {
          setAbout(DEFAULT_ABOUT);
          setEdit(DEFAULT_ABOUT);
        }
      } catch (e) {
        console.error("Failed to fetch About page content:", e);
        setAbout(DEFAULT_ABOUT);
        setEdit(DEFAULT_ABOUT);
        toast.error("Failed to fetch About page content. Showing default.");
      } finally {
        setLoading(false);
      }
    };
    fetchAbout();
  }, []);

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
      const toSave = { ...edit, sections: updatedSections };
      setEdit(toSave);
      await api.post("/admin/about-cms", { data: toSave });
      setAbout(toSave);
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
          {
            icon: ICON_OPTIONS[0].value,
            title: "",
            details: "",
          },
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
      const cleanedSections = edit.sections.filter(
        (s) => s.title.trim() || s.details.trim()
      );
      const toSave = {
        ...edit,
        sections: cleanedSections,
      };
      await api.post("/admin/about-cms", { data: toSave });
      setEdit(toSave);
      setAbout(toSave);
      toast.success("All changes saved!");
    } catch (e) {
      console.error("Failed to save changes:", e);
      toast.error("Failed to save changes.");
    } finally {
      setSavingAll(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await api.post("/admin/about-cms/restore");
      setEdit(DEFAULT_ABOUT);
      setAbout(DEFAULT_ABOUT);
      toast.success("Restored to default!");
    } catch (e) {
      console.error("Failed to restore default content:", e);
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


  if (!about || !edit)
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-gray-500">
        No content found.
      </div>
    );

  return (
    <div className="container mx-auto px-2 py-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-[2rem] sm:text-[2.5rem] font-bold text-center sm:text-left w-full sm:w-auto">
          Admin About Page
        </h1>
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
                  const IconComponent = ICON_MAP[section.icon] || FileText;
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
                            placeholder="Section Details (HTML allowed)"
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
                {(edit.sections || []).map((section, idx) => {
                  const IconComponent = ICON_MAP[section.icon] || FileText;
                  return (
                    <div key={idx} className="flex gap-3 items-start">
                      <IconComponent className="w-7 h-7 text-[#BC6C25] flex-shrink-0 mt-1" />
                      <div>
                        <h2 className="text-xl font-semibold mb-2">
                          {section.title}
                        </h2>
                        <div
                          className="text-gray-700 whitespace-pre-line"
                          dangerouslySetInnerHTML={{ __html: section.details }}
                        />
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