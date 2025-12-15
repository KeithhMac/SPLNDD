import React, { useEffect, useState } from "react";
import {
    Shield, FileText, User, Lock, Truck, RotateCcw, CheckCircle, BookOpen, Calendar,
    Inbox, Heart, Globe, Gift, Bell, Camera, Cloud, Edit, Flag, Folder, Home, Info,
} from "lucide-react";
import api from "@/api/axios";

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
import { Skeleton } from "@/components/ui/skeleton";

import { socket } from "@/lib/socket";


export const TermsOfService = () => {
    const iconClass = "w-7 h-7 text-[#BC6C25] flex-shrink-0 mt-1";

    const [terms, setTerms] = useState(null);
    const [loading, setLoading] = useState(true);

    // Add artificial delay for skeleton
    const [showContent, setShowContent] = useState(false);


    // Fetch CMS terms content (JSON structure)
    useEffect(() => {
        const fetchTerms = async () => {
            try {
                const res = await api.get("/admin/terms-cms");
                setTerms(res.data);
            } catch (err) {
                console.error("Failed to fetch Terms:", err);
                setTerms({
                    title: "Terms of Service",
                    description:
                        "Please read these terms carefully before using Splendid’s website and services.",
                    sections: [
                        {
                            icon: "Info",
                            title: "Contact",
                            details: "If you have any questions, contact us at splendidhoodies@gmail.com",
                        },
                    ],
                });
            } finally {
                setLoading(false);
            }
        };
        fetchTerms();

        // ✅ Socket listener for real-time updates
        const handleUpdate = (latestTerms) => {
            console.log("🔔 terms-updated received", latestTerms);
            setTerms(latestTerms);
        };

        socket.on("terms-updated", handleUpdate);

        // Cleanup on unmount
        return () => {
            socket.off("terms-updated", handleUpdate);
        };


    }, []);

    // Show skeleton for at least 1 second, then content
    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => setShowContent(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [loading]);

    if (loading || !showContent) {
        // Custom className for gray colored skeletons (light and dark mode)
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


    if (!terms)
        return (
            <div className="flex justify-center items-center min-h-[40vh] text-gray-500">
                No terms content available.
            </div>
        );

    // Extract last updated date from Contact section if present
    let lastUpdatedString = "";
    if (terms.sections && Array.isArray(terms.sections)) {
        const contactSection = terms.sections.find(
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
        <div className="max-w-4xl mx-auto px-6 py-12 text-gray-800 mt-[5rem]">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{terms.title}</h1>
                <p className="text-gray-600">{terms.description}</p>
                {lastUpdatedString && (
                    <p className="text-xs text-gray-500 mt-2">
                        Last updated: {lastUpdatedString}
                    </p>
                )}
            </div>

            {/* Sections */}
            {(terms.sections || []).map((section, idx) => {
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