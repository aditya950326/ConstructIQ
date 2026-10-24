"use client";

import React, { useEffect, useRef } from "react";
import { inView, animate } from "motion";

interface InViewTextProps {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
  once?: boolean;
  amount?: "some" | "all" | number;
}

export function InViewText({
  children,
  as: Tag = "div",
  className = "",
  delay = 0,
  duration = 0.6,
  yOffset = 24,
  once = true,
  amount = 0.2,
}: InViewTextProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;
    // Set initial state
    element.style.opacity = "0";
    element.style.transform = `translateY(${yOffset}px)`;
    element.style.willChange = "transform, opacity";

    const stop = inView(
      element,
      () => {
        animate(
          element,
          { opacity: 1, transform: "translateY(0px)" },
          { duration, delay, ease: [0.22, 1, 0.36, 1] }
        );

        if (!once) {
          return () => {
            animate(
              element,
              { opacity: 0, transform: `translateY(${yOffset}px)` },
              { duration: 0.3 }
            );
          };
        }
      },
      { amount }
    );

    return () => stop();
  }, [delay, duration, yOffset, once, amount]);

  return React.createElement(
    Tag,
    { ref, className },
    children
  );
}

interface InViewWordsProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  stagger?: number;
  once?: boolean;
  highlightWord?: string;
  highlightClass?: string;
}

export function InViewWords({
  text,
  as: Tag = "h1",
  className = "",
  stagger = 0.08,
  once = true,
  highlightWord,
  highlightClass = "text-construct-orange",
}: InViewWordsProps) {
  const containerRef = useRef<HTMLElement>(null);
  const words = text.split(" ");

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const wordElements = container.querySelectorAll(".in-view-word");

    wordElements.forEach((el) => {
      (el as HTMLElement).style.opacity = "0";
      (el as HTMLElement).style.transform = "translateY(28px)";
    });

    const stop = inView(
      container,
      () => {
        wordElements.forEach((el, index) => {
          animate(
            el,
            { opacity: 1, transform: "translateY(0px)" },
            {
              duration: 0.6,
              delay: index * stagger,
              ease: [0.22, 1, 0.36, 1],
            }
          );
        });

        if (!once) {
          return () => {
            wordElements.forEach((el) => {
              animate(
                el,
                { opacity: 0, transform: "translateY(28px)" },
                { duration: 0.3 }
              );
            });
          };
        }
      },
      { amount: 0.25 }
    );

    return () => stop();
  }, [stagger, once]);

  return React.createElement(
    Tag,
    { ref: containerRef, className: `flex flex-wrap gap-x-[0.25em] ${className}` },
    words.map((word, idx) => {
      const isHighlighted = highlightWord && word.includes(highlightWord);
      return (
        <span key={idx} className="inline-block overflow-hidden pb-1">
          <span
            className={`in-view-word inline-block will-change-transform ${
              isHighlighted ? highlightClass : ""
            }`}
          >
            {word}
          </span>
        </span>
      );
    })
  );
}
