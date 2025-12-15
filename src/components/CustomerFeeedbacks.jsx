import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

/* ---------- profanity filter helpers ---------- */
const BAD_WORDS = [
  // Strong Filipino profanity
  "putangina", "putang ina", "tangina", "tang ina", "pota", "puta", "potangina",
  "gago", "gagu", "ulol", "ulul", "pakshet", "lintik", "bwisit", "leche",

  // English profanity
  "fuck", "fck", "fuk", "f*ck", "f**k", "fucking", "motherfucker", "mf", "mofo",
  "shit", "sh1t", "sh*t", "crap", "asshole", "bitch", "b*tch", "bastard", "damn",

  // Filipino insults (general + casual panlalait)
  "bobo", "bubu", "tanga", "engot", "inutil", "hunghang",
  "siraulo", "sira ulo", "sira-ulo", "tangengot",
  "pangit", "panget", "pange", "chaka", "jologs",

  // Physical insults (you requested this: *baboy*)
  "baboy", "mataba", "tabachoy", "taba", "burik", "kamote",

  // Taglish directed insults
  "bobo mo", "tanga mo", "pangit mo", "ulol mo", "gago mo", "baboy mo",

  // Jejemon / stylized / censored variants
  "p*ta", "t*ngina", "p@ngit", "b0b0", "t4nga", "t@nga", "b@boy",
  "fuk", "fcku", "sh1et", "paksht",

  // Shortened chat slang
  "tngina", "tngn", "tnga", "pota", "pta"
];


const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// build a regex that matches the letters of a word even if separated by non-word chars
// e.g. "f u c k", "f.u.c.k", "fuck", "fuckyou" (when included in list)
const buildObfuscatedRegex = (word) => {
  const pieces = word.split("").map((ch) => `${escapeRegex(ch)}\\W*`);
  const pattern = pieces.join("").replace(/\\W\*$/, "");
  return new RegExp(pattern, "gi");
};

// replace letters/digits in the matched substring with '*' but keep separators (spaces/punct)
const maskMatch = (match) => match.replace(/[A-Za-z0-9]/g, "*");

// main censor function
const censorText = (input) => {
  if (!input) return input ?? "";
  const words = [...BAD_WORDS].sort((a, b) => b.length - a.length);
  let out = input;
  for (const w of words) {
    const re = buildObfuscatedRegex(w);
    out = out.replace(re, (m) => maskMatch(m));
  }
  return out;
};

/* ---------- helper for rating stars ---------- */
const Stars = ({ n = 5 }) => {
  const clamped = Math.max(0, Math.min(5, Number.isFinite(n) ? n : 0));
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={i < clamped ? "text-yellow-500" : "text-gray-300"}
          aria-hidden
        >
          ★
        </span>
      ))}
    </div>
  );
};

// 🧩 Single feedback card
function FeedbackCard({
  name,
  date,
  rating,
  text,
  image_urls = [],
  is_anonymous = false,
}) {
  // apply censorship before rendering
  const displayNameRaw = is_anonymous ? "Anonymous" : name || "";
  const displayName = censorText(displayNameRaw);
  const avatarLetter = is_anonymous
    ? "A"
    : (displayName?.trim()?.[0]?.toUpperCase() || "?");
  const safeText = censorText(text);

  return (
    <div className="feedback-card w-[15rem] sm:w-[20rem] md:w-[30rem] h-auto shrink-0 rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* header */}
      <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-center">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt={displayName || "User"} />
            <AvatarFallback>{avatarLetter}</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <p className="text-sm font-medium">{displayName || " "}</p>
            <p className="text-[11px] text-muted-foreground">{date}</p>
          </div>
        </div>
        <Stars n={rating} />
      </div>

      {/* feedback text */}
      <div className="mt-5">
        <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
          {safeText}
        </p>
      </div>

      {/* photo strip */}
      {Array.isArray(image_urls) && image_urls.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-4">
          {image_urls.slice(0, 3).map((url, index) => (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src={url}
                alt={`Feedback Image ${index + 1}`}
                className="border border-gray-200 h-40 w-40 object-cover rounded"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// 📦 Feedback section
export function CustomerFeedbacks({ feedbacks = [] }) {
  if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
    return (
      <section className="mx-auto w-full max-w-6xl py-8 text-center">
        <div className="mb-10">
          <h2 className="text-2xl font-bold">Customer Feedbacks</h2>
        </div>
        <p className="text-gray-500">No feedbacks yet.</p>
      </section>
    );
  }

  // Note: this repeats the list for the marquee effect.
  const repeated = Array.from({ length: 50 }).flatMap(() => feedbacks);

  return (
    <section className="mx-auto w-full max-w-6xl py-8 overflow-hidden">
      <div className="mb-10">
        <h2 className="text-2xl font-bold">Customer Feedbacks</h2>
      </div>

      {/* top row */}
      <div className="relative overflow-hidden group mb-6 p-5">
        <div className="flex w-max gap-4 animate-marquee group-hover:paused">
          {repeated.map((f, i) => (
            <FeedbackCard key={`top-${f.id ?? i}-${i}`} {...f} />
          ))}
        </div>
      </div>

      {/* bottom row */}
      <div className="relative overflow-hidden group p-5">
        <div className="flex w-max gap-4 animate-marquee-reverse group-hover:paused">
          {repeated.map((f, i) => (
            <FeedbackCard key={`bottom-${f.id ?? i}-${i}`} {...f} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee { animation: marquee 720s linear infinite; }
        .animate-marquee-reverse { animation: marquee-reverse 720s linear infinite; }
        .group:hover .animate-marquee,
        .group:hover .animate-marquee-reverse { animation-play-state: paused; }
      `}</style>
    </section>
  );
}