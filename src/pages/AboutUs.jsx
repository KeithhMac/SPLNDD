import React, { useEffect, useState } from "react";
import {
    Shield, FileText, User, Lock, Truck, RotateCcw, CheckCircle, BookOpen, Calendar,
    Inbox, Heart, Globe, Gift, Bell, Camera, Cloud, Edit, Flag, Folder, Home, Info,
} from "lucide-react";
import api from "@/api/axios";
import { socket } from "@/lib/socket";
import { Skeleton } from "@/components/ui/skeleton";

// 20 Lucide icon options
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

export const AboutUs = () => {
    const iconClass = "w-7 h-7 text-[#BC6C25] flex-shrink-0 mt-1";
    const [about, setAbout] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showContent, setShowContent] = useState(false);


    useEffect(() => {
        const fetchAbout = async () => {
            try {
                const res = await api.get("/admin/about-cms");
                setAbout(res.data);
            } catch (err) {
                console.error("Failed to fetch about page contents:", err);
                setAbout({
                    title: "About SPLND",
                    description:
                        "SPLND is more than just clothing — it’s a lifestyle. We create modern, timeless pieces designed for everyday comfort, self-expression, and confidence.",
                    sections: [
                        {
                            icon: "Shield",
                            title: "What SPLND Stands For",
                            details: "SPLND means “Same Person Living New Dreams.”",
                        },
                    ],
                });
            } finally {
                setLoading(false);
            }
        };
        fetchAbout();


        // Real-time updates via socket
        const handleUpdate = (latestAbout) => {
            setAbout(latestAbout);
        };
        socket.on("about-updated", handleUpdate);

        return () => {
            socket.off("about-updated", handleUpdate);
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


    if (!about)
        return (
            <div className="flex justify-center items-center min-h-[40vh] text-gray-500">
                No about page content available.
            </div>
        );

    return (
        <div className="max-w-4xl mx-auto px-6 py-12 text-gray-800 mt-[5rem]">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{about.title}</h1>
                <p className="text-gray-600">{about.description}</p>
            </div>
            {/* Sections */}
            {(about.sections || []).map((section, idx) => {
                const Icon = ICON_MAP[section.icon] || FileText;
                return (
                    <div className="flex items-start gap-3 mb-8" key={idx}>
                        <Icon className={iconClass} />
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
    );
};