import React, { useEffect, useState } from "react";
import {
    Shield, FileText, User, Lock, Truck, RotateCcw, CheckCircle, BookOpen, Calendar,
    Inbox, Heart, Globe, Gift, Bell, Camera, Cloud, Edit, Flag, Folder, Home, Info,
} from "lucide-react";
import api from "@/api/axios";
import { socket } from "@/lib/socket";
import { Skeleton } from "@/components/ui/skeleton";

// Map icon values to Lucide icon components
const ICON_MAP = {
    "Shield": Shield,
    "FileText": FileText,
    "User": User,
    "Lock": Lock,
    "Truck": Truck,
    "RotateCcw": RotateCcw,
    "CheckCircle": CheckCircle,
    "BookOpen": BookOpen,
    "Calendar": Calendar,
    "Inbox": Inbox,
    "Heart": Heart,
    "Globe": Globe,
    "Gift": Gift,
    "Bell": Bell,
    "Camera": Camera,
    "Cloud": Cloud,
    "Edit": Edit,
    "Flag": Flag,
    "Folder": Folder,
    "Home": Home,
    "Info": Info,
};

export const PrivacyPolicy = () => {
    const iconClass = "w-7 h-7 text-[#BC6C25] flex-shrink-0 mt-1";
    const [privacy, setPrivacy] = useState(null);
    const [loading, setLoading] = useState(true);

    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        const fetchPrivacy = async () => {
            try {
                const res = await api.get("/admin/privacy-cms");
                setPrivacy(res.data);
            } catch (err) {
                console.error("Failed to fetch Privacy Policy:", err);
                setPrivacy({
                    title: "Privacy Policy",
                    description:
                        "At SPLND’D Clothing, your privacy is our priority. This policy explains how we collect, use, and protect your information.",
                    sections: [
                        {
                            icon: "Info",
                            title: "Contact",
                            details: "For questions, contact us at splendidhoodies@gmail.com",
                        },
                    ],
                });
            } finally {
                setLoading(false);
            }
        };
        fetchPrivacy();


        // Add Socket.IO listener for realtime updates
        const handleUpdate = (latestPrivacy) => {
            console.log("🔔 privacy-updated received", latestPrivacy);
            setPrivacy(latestPrivacy);
        };
        socket.on("privacy-updated", handleUpdate);

        return () => {
            socket.off("privacy-updated", handleUpdate);
        };

    }, []);

    // Show skeleton for at least 1 second before displaying content
    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => setShowContent(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [loading]);


    if (loading || !showContent) {
        // Gray skeleton for both light and dark mode
        const skeletonClass = "bg-gray-300 dark:bg-gray-700";
        return (
            <div className="max-w-4xl mx-auto px-6 py-12 text-gray-800 mt-[5rem]">
                <div className="text-center mb-10">
                    <Skeleton className={`h-10 w-2/3 mx-auto mb-4 ${skeletonClass}`} />
                    <Skeleton className={`h-4 w-1/2 mx-auto mb-2 ${skeletonClass}`} />
                    <Skeleton className={`h-3 w-1/6 mx-auto ${skeletonClass}`} />
                </div>
                {[...Array(3)].map((_, idx) => (
                    <div className="flex items-start gap-3 mb-8" key={idx}>
                        <Skeleton className={`w-7 h-7 rounded mt-1 ${skeletonClass}`} />
                        <div className="flex-1">
                            <Skeleton className={`h-5 w-1/3 mb-2 ${skeletonClass}`} />
                            <Skeleton className={`h-3 w-full mb-1 ${skeletonClass}`} />
                            <Skeleton className={`h-3 w-5/6 ${skeletonClass}`} />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!privacy)
        return (
            <div className="flex justify-center items-center min-h-[40vh] text-gray-500">
                No privacy policy content available.
            </div>
        );

    // Extract last updated date from Contact section if present
    let lastUpdatedString = "";
    if (privacy.sections && Array.isArray(privacy.sections)) {
        const contactSection = privacy.sections.find(
            (section) =>
                section.icon === "Info" &&
                section.title &&
                section.title.toLowerCase().includes("contact")
        );
        if (contactSection && contactSection.details) {
            const match = contactSection.details.match(/Last updated:\s*([0-9/]+)/i);
            if (match && match[1]) {
                lastUpdatedString = match[1];
            }
        }
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-12 text-gray-800 mt-[5.1rem]">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{privacy.title}</h1>
                <p className="text-gray-600">{privacy.description}</p>
                {lastUpdatedString && (
                    <p className="text-xs text-gray-500 mt-2">
                        Last updated: {lastUpdatedString}
                    </p>
                )}
            </div>

            {/* Sections */}
            {(privacy.sections || []).map((section, idx) => {
                const Icon = ICON_MAP[section.icon] || FileText; // fallback icon
                return (
                    <div className="flex items-start gap-3 mb-8" key={idx}>
                        <Icon className={iconClass} />
                        <div>
                            <h2 className="text-xl font-semibold mb-2">
                                {section.title}
                            </h2>
                            <p className="text-gray-700 whitespace-pre-line">
                                {section.details}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};