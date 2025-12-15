import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const SlideFromDirectionSection = ({
  children,
  direction = "left", // "left" or "right"
  distance = 100,      // percentage distance to start from
}) => {
  const containerRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const el = contentRef.current;
    const container = containerRef.current;

    let xOffset = 0;
    if (direction === "left") xOffset = -distance;
    if (direction === "right") xOffset = distance;

    // GSAP context for cleanup
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { x: `${xOffset}%`, opacity: 0 },
        {
          x: "0%",
          opacity: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: container,       // ✅ use container
            start: "top 50% ",      // ✅ starts when section enters viewport
            end: "top 25%",           // ✅ finishes when top reaches 25% of viewport
            scrub: 1.5,
            toggleActions: "play none none reverse", // reverse when scrolling back
          },
        }
      );
    }, container);

    return () => ctx.revert(); // ✅ cleanup on unmount
  }, [direction, distance]);

  return (
    <div ref={containerRef} style={{ overflowX: "hidden" }}>
      <div ref={contentRef}>{children}</div>
    </div>
  );
};

export default SlideFromDirectionSection;
