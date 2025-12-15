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
    Inbox, Heart, Globe, Gift, Bell, Camera, Cloud, Edit, Flag, Folder, Home, Info, MessageSquare, Star, CreditCard
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Lucide icon options for chatbot categories
const ICON_OPTIONS = [
    { label: "ShoppingCart", value: "ShoppingCart", icon: Shield },
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
    { label: "MessageSquare", value: "MessageSquare", icon: MessageSquare },
    { label: "Star", value: "Star", icon: Star },
    { label: "CreditCard", value: "CreditCard", icon: CreditCard },
];

const ICON_MAP = Object.fromEntries(ICON_OPTIONS.map(opt => [opt.value, opt.icon]));

const DEFAULT_CHATBOT = [
    {
        category: "🛒 Products",
        icon: "ShoppingCart",
        questions: [
            { q: "What products do you sell?", a: "Right now, we’re all about cozy hoodies perfect for the rainy season, but keep an eye out for new apparels coming soon!" },
            { q: "What materials do you use?", a: "Our products are made with high-quality fabrics like cotton and polyester blends to ensure comfort and durability." },
            { q: "What sizes are available?", a: "Most items come in sizes ranging from Small to XXL. Be sure to check the size guide when viewing an item to find your perfect fit!" },
            { q: "How do I take care of the products?", a: "We recommend gentle machine wash in cold water, inside-out, and air dry or tumble dry low." },
            { q: "Do your colors match the photos?", a: "We try our best to represent colors accurately, but actual product colors may vary slightly due to screen settings or lighting." },
            { q: "Can I request custom designs or prints?", a: "Currently, we focus on our ready-made designs, but stay tuned—we may offer customization options in the future!" },
            { q: "Do you restock sold-out items?", a: "Popular items are often restocked! Keep an eye on our store so you don’t miss the latest drops." },
        ],
    },
    {
        category: "📦 Orders",
        icon: "FileText",
        questions: [
            { q: "How to order?", a: "Just browse our collection, add to cart, checkout, and pay. You’ll get a confirmation email right after" },
            { q: "Do I need an account to order?", a: "Yes, signing in is needed to complete your order and track it. But feel free to browse and add items to your cart even without an account!" },
            { q: "How long does it take to process my order?", a: "Orders are usually processed within 1-2 business days before shipping." },
            { q: "How do I track my order?", a: "Once your order has been shipped, you’ll receive a tracking number. You can view it anytime, just go to 'My Orders' under your account in your Account Settings." },
            { q: "Can I change my address after placing an order?", a: "Unfortunately, once your payment is confirmed, the order details (including your address) can no longer be changed. Please double-check your information before completing your purchase." },
            { q: "Can I pre-order new items?", a: "We don’t have pre-orders at the moment. You can only grab the items that are currently available on our site." },
        ],
    },
    {
        category: "💳 Payments",
        icon: "CreditCard",
        questions: [
            { q: "What are the payment methods?", a: "We accept Credit & Debit Cards (Visa, MasterCard) and E-wallets via Maya." },
            { q: "Is Cash on Delivery (COD) available?", a: "Cash on Delivery isn’t available for now. Payment must be completed first to process your order." },
            { q: "Do you accept bank transfers?", a: "Bank transfers aren’t supported at the moment. After choosing an item, you will be redirected to our payment gateway, which only accepts the listed payment methods." },
            { q: "Can I pay in installments?", a: "At the moment, we don’t offer installment plans. Full payment is required upon checkout." },
        ],
    },
    {
        category: "⭐ Promotions & Discounts",
        icon: "Star",
        questions: [
            { q: "Do you offer discounts?", a: "Yes! We often have promotions and seasonal sales. Check 'Vouchers' at the top right under your account to see and claim any available offers!" },
            { q: "How do I use a discount?", a: "Simply go to 'Vouchers' in your Account Settings, claim the offer you want, and apply it during checkout." },
        ],
    },
    {
        category: "🚚 Shipping & Delivery",
        icon: "Truck",
        questions: [
            { q: "Do you ship nationwide?", a: "Yes! We ship nationwide via J&T." },
            { q: "Do you ship internationally?", a: "Currently, we only ship within the Philippines." },
            { q: "How long does shipping and delivery take?", a: "Shipping and delivery usually take 3-7 business days, depending on your location. Once your order is shipped, you’ll receive a tracking number to monitor your package." },
            { q: "Is shipping free?", a: "We occasionally offer free shipping promotions! Check 'Vouchers' in your Account settings to view available coupons, or follow us on social media for updates." },
        ],
    },
    {
        category: "📝 Feedback & Reviews",
        icon: "MessageSquare",
        questions: [
            { q: "How can I leave a review for a product?", a: "You can leave a review after receiving your order. Just go to 'My Orders' in your Account Settings and click 'Write a Review' to share your thoughts!" },
            { q: "Can I edit or delete my review after posting it?", a: "Once your feedback is posted, it can’t be edited or deleted, so please make sure it’s accurate and appropriate. We appreciate respectful and helpful comments!" },
            { q: "Where can I give feedback about your store?", a: "We’d love to hear from you! You can submit feedback by sending us a message via the social media buttons below." },
            { q: "Do I need an account to leave a review?", a: "Yes, you’ll need to be signed in to leave a review so it can be linked to your order. Don’t worry, it’s quick and easy, just go to 'My Orders' in your Account Settings and click 'Write a Review'." },
        ],
    },
    {
        category: "🔙 Return as Coupon",
        icon: "RotateCcw",
        questions: [
            { q: "How do I request a return?", a: "If your product is missing, damaged, defective, or incorrect, you can request a refund under 'My Orders' in your Account Settings within 7 days of receiving it. Approved returns will give you store credit equal to your order amount, which you can use on your next purchase." },
            { q: "How long does it take for a return to be approved?", a: "Return requests are reviewed within 1-3 business days. Once approved, store credit will be issued immediately, which you can use on your next purchase." },
        ],
    },
];

export const AdminChatbotPage = () => {
    const [loading, setLoading] = useState(true);
    const [edit, setEdit] = useState(DEFAULT_CHATBOT);
    const [chatbotContent, setChatbotContent] = useState(DEFAULT_CHATBOT);
    const [savingAll, setSavingAll] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [adding, setAdding] = useState(false);
    const [deleting, setDeleting] = useState({});

    useEffect(() => {
        const fetchChatbotContent = async () => {
            setLoading(true);
            try {
                const res = await api.get("/admin/cms/chatbot");
                if (res.data && res.data.content) {
                    setChatbotContent(res.data.content);
                    setEdit(res.data.content);
                } else {
                    setChatbotContent(DEFAULT_CHATBOT);
                    setEdit(DEFAULT_CHATBOT);
                }
            } catch (e) {
                console.error("Failed to fetch chatbot content:", e);
                setChatbotContent(DEFAULT_CHATBOT);
                setEdit(DEFAULT_CHATBOT);
                toast.error("Failed to fetch chatbot content. Showing default.");
            } finally {
                setLoading(false);
            }
        };
        fetchChatbotContent();
    }, []);

    const handleCategoryChange = (idx, field, value) => {
        setEdit((prev) => {
            const next = prev.map((cat, i) =>
                i === idx ? { ...cat, [field]: value } : cat
            );
            return next;
        });
    };

    const handleDeleteCategory = async (idx) => {
        setDeleting((prev) => ({ ...prev, [idx]: true }));
        try {
            await new Promise((resolve) => setTimeout(resolve, 600));
            const updatedCats = edit.filter((_, i) => i !== idx);
            setEdit(updatedCats);
            await api.post("/admin/cms/chatbot", { content: updatedCats });
            setChatbotContent(updatedCats);
            toast.success("Category deleted!");
        } catch {
            toast.error("Failed to delete category.");
        } finally {
            setDeleting((prev) => ({ ...prev, [idx]: false }));
        }
    };

    const handleAddCategory = async () => {
        setAdding(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 600));
            setEdit((prev) => [
                ...prev,
                {
                    category: "",
                    icon: ICON_OPTIONS[0].value,
                    questions: [],
                },
            ]);
            toast.success("Category added!");
        } catch {
            toast.error("Failed to add category.");
        } finally {
            setAdding(false);
        }
    };

    const handleAddQuestion = (catIdx) => {
        setEdit((prev) => {
            const next = prev.map((cat, i) =>
                i === catIdx
                    ? {
                        ...cat,
                        questions: [
                            ...cat.questions,
                            { q: "", a: "" }
                        ],
                    }
                    : cat
            );
            return next;
        });
    };

    const handleQuestionChange = (catIdx, qIdx, field, value) => {
        setEdit((prev) => {
            const next = prev.map((cat, i) =>
                i === catIdx
                    ? {
                        ...cat,
                        questions: cat.questions.map((q, j) =>
                            j === qIdx ? { ...q, [field]: value } : q
                        ),
                    }
                    : cat
            );
            return next;
        });
    };

    const handleDeleteQuestion = (catIdx, qIdx) => {
        setEdit((prev) => {
            const next = prev.map((cat, i) =>
                i === catIdx
                    ? {
                        ...cat,
                        questions: cat.questions.filter((_, j) => j !== qIdx),
                    }
                    : cat
            );
            return next;
        });
    };

    const handleSaveAll = async () => {
        setSavingAll(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 800));
            const cleaned = edit.map(cat => ({
                ...cat,
                questions: cat.questions.filter(q => q.q.trim() || q.a.trim()),
                category: cat.category.trim(),
            })).filter(cat => cat.category && cat.questions.length);
            await api.post("/admin/cms/chatbot", { content: cleaned });
            setEdit(cleaned);
            setChatbotContent(cleaned);
            toast.success("All changes saved!");
        } catch (e) {
            console.error("Failed to save chatbot content:", e);
            toast.error("Failed to save changes.");
        } finally {
            setSavingAll(false);
        }
    };

    const handleRestore = async () => {
        setRestoring(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await api.post("/admin/cms/chatbot/restore");
            setEdit(DEFAULT_CHATBOT);
            setChatbotContent(DEFAULT_CHATBOT);
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
                <Skeleton className="h-10 w-72 bg-gray-400 mb-6" />
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 min-w-0 w-full max-w-full overflow-hidden">
                        <div className="p-6 h-[40rem] bg-white rounded-lg shadow-md flex flex-col gap-5">
                            <Skeleton className="h-7 w-40 bg-gray-200 mb-2" />
                            <Skeleton className="h-6 w-36 bg-gray-100 mb-4" />
                            <div className="h-[20rem] p-3 space-y-5">
                                {[...Array(2)].map((_, i) => (
                                    <div key={i} className="bg-gray-50 rounded-lg border p-4 flex flex-col gap-2 items-start">
                                        <Skeleton className="h-10 w-40 bg-gray-100 mb-2" />
                                        <Skeleton className="h-10 w-full bg-gray-100 mb-2" />
                                        <Skeleton className="h-16 w-full bg-gray-100" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
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

    if (!chatbotContent || !edit)
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
                    Admin Chatbot CMS
                </h1>
            </div>
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left: Edit Form */}
                <Card className="flex-1 min-w-0 w-full max-w-full overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-[1.125rem] text-gray-700 font-semibold">
                            Edit Chatbot Categories and Q&A
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* ScrollArea for categories */}
                        <ScrollArea className="h-[32rem] p-3">
                            <div className="space-y-6">
                                {edit.map((cat, idx) => {
                                    const IconComponent = ICON_MAP[cat.icon] || FileText;
                                    return (
                                        <div
                                            key={idx}
                                            className="bg-gray-50 rounded-lg border p-4 flex flex-col gap-4 items-start relative"
                                        >
                                            <div className="flex items-center gap-2 min-w-[160px]">
                                                <Select
                                                    value={cat.icon}
                                                    onValueChange={(value) => handleCategoryChange(idx, "icon", value)}
                                                    disabled={deleting[idx]}
                                                >
                                                    <SelectTrigger className="w-[8rem]">
                                                        <SelectValue>
                                                            <span className="flex items-center gap-2">
                                                                <IconComponent className="w-5 h-5 text-[#BC6C25]" />
                                                                {cat.icon}
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
                                                <Input
                                                    placeholder="Category Title"
                                                    value={cat.category}
                                                    onChange={(e) =>
                                                        handleCategoryChange(idx, "category", e.target.value)
                                                    }
                                                    disabled={deleting[idx]}
                                                    className="ml-2"
                                                />
                                                {edit.length > 1 && (
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        className="ml-2 w-20 flex items-center justify-center"
                                                        onClick={() => handleDeleteCategory(idx)}
                                                        disabled={deleting[idx]}
                                                    >
                                                        {deleting[idx] ? (
                                                            <Loader2 className="animate-spin w-4 h-4 mr-2" />
                                                        ) : null}
                                                        Delete
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-3 w-full">
                                                <div className="font-semibold mb-1">Questions & Answers:</div>
                                                {(cat.questions || []).map((q, qIdx) => (
                                                    <div key={qIdx} className="flex gap-2 items-start mb-2">
                                                        <Input
                                                            placeholder="Question"
                                                            value={q.q}
                                                            onChange={(e) =>
                                                                handleQuestionChange(idx, qIdx, "q", e.target.value)
                                                            }
                                                            className="w-[45%]"
                                                        />
                                                        <Textarea
                                                            rows={2}
                                                            placeholder="Answer"
                                                            value={q.a}
                                                            onChange={(e) =>
                                                                handleQuestionChange(idx, qIdx, "a", e.target.value)
                                                            }
                                                            className="w-[55%]"
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="self-center"
                                                            onClick={() => handleDeleteQuestion(idx, qIdx)}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </div>
                                                ))}
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleAddQuestion(idx)}
                                                    className="mt-2"
                                                >
                                                    + Add Q&A
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div className="flex justify-center pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleAddCategory}
                                        disabled={adding}
                                        className="flex items-center justify-center"
                                    >
                                        {adding ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                                        + Add New Category
                                    </Button>
                                </div>
                            </div>
                        </ScrollArea>
                        {/* Save and Restore buttons */}
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
                            <div className="space-y-8">
                                {(edit || []).map((cat, idx) => {
                                    const IconComponent = ICON_MAP[cat.icon] || FileText;
                                    return (
                                        <div key={idx} className="flex gap-3 items-start">
                                            <IconComponent className="w-7 h-7 text-[#BC6C25] flex-shrink-0 mt-1" />
                                            <div>
                                                <h2 className="text-xl font-semibold mb-2">
                                                    {cat.category}
                                                </h2>
                                                <ul className="space-y-2">
                                                    {(cat.questions || []).map((q, qIdx) => (
                                                        <li key={qIdx}>
                                                            <span className="font-semibold">{q.q}</span>
                                                            <div className="text-gray-700 whitespace-pre-line">{q.a}</div>
                                                        </li>
                                                    ))}
                                                </ul>
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