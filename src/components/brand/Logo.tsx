import React from "react";
import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  subtitle?: string;
  className?: string;
}

export function Logo({ size = "md", showWordmark = true, subtitle, className = "" }: LogoProps) {
  const dimensionMap = {
    sm: { icon: 24, text: "text-lg", gap: "gap-2" },
    md: { icon: 34, text: "text-xl", gap: "gap-2.5" },
    lg: { icon: 44, text: "text-2xl", gap: "gap-3" },
    xl: { icon: 56, text: "text-3xl", gap: "gap-3.5" },
  };

  const { icon, text, gap } = dimensionMap[size];

  return (
    <div className={`inline-flex items-center ${gap} ${className}`}>
      {/* Precision Geometric Hexagonal SVG Badge */}
      <div 
        className="relative flex items-center justify-center shrink-0"
        style={{ width: icon, height: icon }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm transition-transform duration-200 hover:scale-105"
        >
          {/* Top Angled Architectural Beam (Construction Orange) */}
          <polygon
            points="50,15 88,32 68,43 50,30"
            fill="#F36B32"
          />
          {/* Main Left Upright Column (Charcoal) */}
          <polygon
            points="42,20 49,25 49,76 42,72"
            fill="#202321"
          />
          {/* Orange Accent Pilaster */}
          <polygon
            points="34,31 40,35 40,70 34,66"
            fill="#F36B32"
          />
          {/* Outer Left Wall (Charcoal) */}
          <polygon
            points="26,42 32,46 32,65 26,61"
            fill="#202321"
          />
          {/* Central Structural Hex Vault (Charcoal with geometric cut) */}
          <polygon
            points="50,32 85,48 85,62 70,72 50,60"
            fill="#202321"
          />
          {/* Bottom Isometric Foundation */}
          <polygon
            points="42,75 50,80 70,72 50,60"
            fill="#202321"
            opacity="0.85"
          />
        </svg>
      </div>

      {showWordmark && (
        <div className="flex flex-col select-none">
          <span className={`font-heading font-extrabold tracking-tight ${text} text-construct-text leading-none`}>
            Construct<span className="text-construct-orange">IQ</span>
          </span>
          {subtitle && (
            <span className="text-[8px] font-mono font-bold tracking-[0.22em] text-construct-secondary uppercase mt-1 leading-none">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function LogoIcon({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <div style={{ width: size, height: size }} className={`relative shrink-0 ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <polygon points="50,15 88,32 68,43 50,30" fill="#F36B32" />
        <polygon points="42,20 49,25 49,76 42,72" fill="#202321" />
        <polygon points="34,31 40,35 40,70 34,66" fill="#F36B32" />
        <polygon points="26,42 32,46 32,65 26,61" fill="#202321" />
        <polygon points="50,32 85,48 85,62 70,72 50,60" fill="#202321" />
        <polygon points="42,75 50,80 70,72 50,60" fill="#202321" opacity="0.85" />
      </svg>
    </div>
  );
}
