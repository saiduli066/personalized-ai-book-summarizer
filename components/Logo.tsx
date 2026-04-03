"use client";

import * as React from "react";
import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  showText?: boolean;
  showTagline?: boolean;
  className?: string;
}

// Logo includes the brand name in the image itself (like Disney)
// Text/tagline are optional additions for context
const sizeMap = {
  sm: { logo: 100, tagline: "text-[10px]" },
  md: { logo: 120, tagline: "text-xs" },
  lg: { logo: 130, tagline: "text-xs" },
  xl: { logo: 150, tagline: "text-sm" },
  "2xl": { logo: 180, tagline: "text-sm" },
};

export function Logo({ size = "md", showTagline = false, className = "" }: LogoProps) {
  const dimensions = sizeMap[size];

  return (
    <div className={`flex flex-col items-start max-w-full ${className}`}>
      <div className="relative flex-shrink-0" style={{ width: dimensions.logo, maxWidth: "100%", height: "auto" }}>
        {/* Light theme logo - hidden in dark mode */}
        <Image
          src="/logo/Introsia light logo with gradient swoosh-1-bgless.png"
          alt="Introsia"
          width={dimensions.logo}
          height={Math.round(dimensions.logo * 0.4)}
          className="object-contain dark:hidden transition-opacity duration-200 w-full h-auto"
          priority
        />
        {/* Dark theme logo - only visible in dark mode */}
        <Image
          src="/logo/Introsia dark logo bgless with gradient wave design-1.png"
          alt="Introsia"
          width={dimensions.logo}
          height={Math.round(dimensions.logo * 0.4)}
          className="object-contain hidden dark:block transition-opacity duration-200 w-full h-auto"
          priority
        />
      </div>
      {showTagline && (
        <span className={`text-muted-foreground italic mt-1 ${dimensions.tagline} truncate max-w-full`}>
          Find the words that find you
        </span>
      )}
    </div>
  );
}
