import { useState, useRef, useEffect } from "react";
import ChatbotIcon from "../Images/HUDI.png";
import { FaInstagram, FaFacebookMessenger, FaEnvelope } from "react-icons/fa";
import { Undo2, RotateCcw, X, ShoppingCart, FileText, CreditCard, Star, Truck, MessageSquare } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import api from "@/api/axios";
import chatbotDataLocal from "@/data/chatbotData";

// Icon map for chatbot categories
const ICON_MAP = {
  ShoppingCart,
  FileText,
  CreditCard,
  Star,
  Truck,
  MessageSquare,
  RotateCcw,
};

const DEFAULT_CHATBOT = [
  {
    category: "🛒 Products",
    icon: "ShoppingCart",
    questions: chatbotDataLocal["🛒 Products"],
  },
  {
    category: "📦 Orders",
    icon: "FileText",
    questions: chatbotDataLocal["📦 Orders"],
  },
  {
    category: "💳 Payments",
    icon: "CreditCard",
    questions: chatbotDataLocal["💳 Payments"],
  },
  {
    category: "⭐ Promotions & Discounts",
    icon: "Star",
    questions: chatbotDataLocal["⭐ Promotions & Discounts"],
  },
  {
    category: "🚚 Shipping & Delivery",
    icon: "Truck",
    questions: chatbotDataLocal["🚚 Shipping & Delivery"],
  },
  {
    category: "📝 Feedback & Reviews",
    icon: "MessageSquare",
    questions: chatbotDataLocal["📝 Feedback & Reviews"],
  },
  {
    category: "🔙 Return as Coupon",
    icon: "RotateCcw",
    questions: chatbotDataLocal["🔙 Return as Coupon"],
  },
];

export const ChatBot = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: "Hi! I'm HUDI 👋, your 24/7 virtual assistant. How can I help you today? Choose a category below to begin.",
      sender: "bot",
    },
  ]);
  const [chatbotContent, setChatbotContent] = useState(DEFAULT_CHATBOT);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchChatbotContent = async () => {
      try {
        const res = await api.get("/admin/cms/chatbot");
        if (res.data && res.data.content && Array.isArray(res.data.content)) {
          setChatbotContent(res.data.content);
        } else {
          setChatbotContent(DEFAULT_CHATBOT);
        }
      } catch (e) {
        console.error("Failed to fetch chatbot content:", e);
        setChatbotContent(DEFAULT_CHATBOT);
      }
    };
    fetchChatbotContent();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const restartChat = () => {
    setMessages([
      {
        text: "Hi! I'm HUDI 👋. How can I help you today? Choose a category below to begin.",
        sender: "bot",
      },
    ]);
    setSelectedCategory(null);
  };

  const handleCategoryClick = (categoryObj) => {
    setSelectedCategory(categoryObj);
    setMessages((prev) => [
      ...prev,
      { text: `📂 You selected: ${categoryObj.category}`, sender: "user" },
      {
        text: "Alright! Please pick one of the questions below 👇",
        sender: "bot",
      },
    ]);
  };

  const handleQuestionSelect = (questionText) => {
    if (!questionText || !selectedCategory) return;
    const answer = selectedCategory.questions.find(
      (item) => item.q === questionText
    )?.a;

    setMessages((prev) => [...prev, { text: questionText, sender: "user" }]);
    setIsTyping(true);

    setTimeout(() => {
      setMessages((prev) => [...prev, { text: answer || "No answer found.", sender: "bot" }]);
      setIsTyping(false);
    }, 1200);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setMessages((prev) => [
      ...prev,
      {
        text: "🔙 Back to main menu. Please choose another category.",
        sender: "bot",
      },
    ]);
  };

  // Helper to render links inside messages
  const renderMessageText = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, i) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed bottom-3 right-5 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="rounded-full bg-[#2e2e2e] shadow-[inset_0_2px_6px_rgba(255,255,255,0.2)] cursor-pointer transition transform hover:scale-105 relative animate-bounce"
      >
        <img
          src={ChatbotIcon}
          alt="HUDI Chatbot"
          className="w-16 h-16 rounded-full p-1"
        />
      </button>

      {/* Chat Window */}
      <div
        className={`flex justify-center fixed bottom-5 left-0 right-0 md:bottom-15 md:right-5 md:left-auto transition-all duration-500 ease-in-out transform ${chatOpen
          ? "opacity-100 scale-100 translate-y-0 "
          : "opacity-0 scale-90 translate-y-5 pointer-events-none"
          }`}
      >
        <div
          className="w-[90%] h-[80dvh] md:w-[20rem] md:h-[27rem] shadow-xl rounded-lg border border-[#8eabab]/40 flex flex-col"
          style={{
            backgroundColor: "#fff",
            backgroundImage: `
      repeating-linear-gradient(
        0deg, 
        rgba(97, 176, 148, 0.2) 0 1px, 
        transparent 1px 29px
      ),
      repeating-linear-gradient(
        90deg, 
        rgba(97, 176, 148, 0.2) 0 1px, 
        transparent 1px 29px
      )
    `,
          }}
        >
          {/* Header */}
          <div className="bg-[#393939] rounded-t-lg text-[#f5f0e8] p-3 flex justify-between items-center">
            <span className="text-white">HUDI - Customer Support</span>
            <div className="flex gap-2">
              <button onClick={restartChat} title="Reset">
                <RotateCcw size={18} className="cursor-pointer" />
              </button>
              <button onClick={() => setChatOpen(false)}><X size={20} className="cursor-pointer" /></button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col space-y-2">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                >
                  <div
                    className={`px-3 py-2 rounded-xl max-w-[80%] break-words text-sm ${msg.sender === "user"
                      ? "bg-[#8eabab] text-white"
                      : "bg-white border border-[#8eabab]/30 text-[#2e2b28]"
                      }`}
                  >
                    {renderMessageText(msg.text)}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-xl bg-[#e8efee] text-[#2e2b28] text-sm animate-pulse">
                    HUDI is thinking...
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* Actions Area */}
          <div className="bg-white p-3 pb-0 border-t border-[#e8efee]">
            {!selectedCategory ? (
              <div className="relative w-full flex justify-center">
                <Carousel opts={{ align: "start" }} className="w-[85%]">
                  <CarouselContent className="-ml-1 flex">
                    {chatbotContent.map((cat, idx) => {
                      const IconComponent = ICON_MAP[cat.icon] || FileText;
                      return (
                        <CarouselItem key={idx} className="basis-auto pl-2">
                          <button
                            onClick={() => handleCategoryClick(cat)}
                            className="bg-[#e8efee] hover:bg-[#dce4e3] cursor-pointer text-[#2e2b28] px-4.5 py-2 rounded-lg transition whitespace-nowrap flex items-center gap-2"
                          >
                            <IconComponent size={16} className="text-[#61b094]" />
                            {cat.category}
                          </button>
                        </CarouselItem>
                      );
                    })}
                  </CarouselContent>
                  <CarouselPrevious className="absolute -left-8 top-1/2 -translate-y-1/2 bg-white text-[#61b094]/50 p-2 rounded-full hover:bg-[#e8efee] hover:text-[#61b094] transition opacity-100 h-7 w-7" />
                  <CarouselNext className="absolute -right-8 top-1/2 -translate-y-1/2 bg-white text-[#61b094]/50 p-2 rounded-full hover:bg-[#e8efee] hover:text-[#61b094] transition opacity-100 h-7 w-7" />
                </Carousel>
              </div>
            ) : (
              <div className="space-y-2">
                <Select onValueChange={handleQuestionSelect}>
                  <SelectTrigger className="w-full bg-white border border-[#8eabab]/30 text-[#2e2b28] cursor-pointer">
                    <SelectValue placeholder=" Select a question " />
                  </SelectTrigger>
                  <SelectContent className="max-h-[10rem]">
                    {selectedCategory.questions.map((item, idx) => (
                      <SelectItem key={idx} value={item.q}>
                        {item.q}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <button
                  onClick={handleBackToCategories}
                  className="w-full bg-[#e8efee] hover:bg-[#dfe9e7] cursor-pointer text-black py-2 rounded-lg transition"
                >
                  <div className="flex justify-center items-center gap-2">
                    <Undo2 size={18} className="text-black/40" /> Back to Categories
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-around gap-1 rounded-b-lg p-3 bg-white">
            <a
              href="https://www.facebook.com/shop.splndd"
              target="_blank"
              rel="noopener noreferrer"
              className="flex justify-center items-center w-[31%] bg-[#393939] text-white rounded-lg py-3 hover:bg-[#222727] transition"
            >
              <FaFacebookMessenger size={20} />
            </a>
            <a
              href="https://www.instagram.com/shop.splndd/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-[32%] flex justify-center items-center bg-[#393939] text-white rounded-lg hover:bg-[#222727] transition"
            >
              <FaInstagram size={20} />
            </a>
            <a
              href="mailto:splendidhoodies@gmail.com"
              className="w-[31%] flex justify-center items-center bg-[#393939] text-white rounded-lg hover:bg-[#222727] transition"
            >
              <FaEnvelope />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};