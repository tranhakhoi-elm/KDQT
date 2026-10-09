import React from "react";

interface ElmichLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const ElmichLogo: React.FC<ElmichLogoProps> = ({
  className = "",
  size = "md",
}) => {
  const sizeMap = {
    sm: { height: 26, scale: 0.22 },
    md: { height: 34, scale: 0.28 },
    lg: { height: 46, scale: 0.38 },
  };

  const config = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      {/* Exact official Elmich logo matching provided brand reference:
          Red circle with dynamic sweeping black orbital arc + geometric "elmich" text */}
      <svg
        height={config.height}
        viewBox="0 0 380 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-auto shrink-0 drop-shadow-2xs"
      >
        {/* Red circle */}
        <circle cx="85" cy="70" r="50" fill="#E31E24" />

        {/* Dynamic sweeping black swoosh arc orbiting the red sphere */}
        <path
          d="M32 108C52 105 82 92 108 72C130 55 140 38 135 34C130 30 115 42 98 56C72 76 48 94 32 108Z"
          fill="#1D1D1B"
        />
        <path
          d="M28 112C45 108 72 96 98 78C126 58 144 38 142 32C140 28 132 32 120 44C136 34 148 38 146 48C142 62 124 82 98 98C70 116 46 124 28 112Z"
          fill="#1D1D1B"
        />

        {/* Wordmark "elmich" in exact geometric brand styling */}
        <g fill="#1D1D1B">
          {/* 'e' */}
          <path
            d="M174 74C174 58.5 163 47 148 47C133 47 121 59 121 75C121 91 133 103 150 103C161 103 169 98 173 91L163 85C160 89 155 93 149 93C139 93 132 86 132 76H174V74ZM132 68C134 60 140 56 148 56C156 56 162 60 164 68H132Z"
          />

          {/* 'l' */}
          <rect x="182" y="32" width="10" height="70" rx="1" />

          {/* 'm' */}
          <path
            d="M201 49H211V57C214 51.5 221 47 229 47C236 47 242 51 245 57C249 51.5 256 47 265 47C276 47 283 54 283 67V102H273V69C273 60 268 56 261 56C254 56 248 61 248 70V102H238V69C238 60 233 56 226 56C219 56 211 61 211 70V102H201V49Z"
          />

          {/* 'i' */}
          <rect x="293" y="49" width="10" height="53" rx="1" />
          <circle cx="298" cy="36" r="5.5" />

          {/* 'c' */}
          <path
            d="M338 58L330 65C327 59 321 56 315 56C304 56 296 65 296 75C296 85 304 94 315 94C321 94 327 91 330 85L338 92C333 99 325 103 315 103C298 103 286 91 286 75C286 59 298 47 315 47C325 47 333 51 338 58Z"
          />

          {/* 'h' */}
          <path
            d="M348 32H358V57C362 51 369 47 378 47C389 47 396 54 396 67V102H386V69C386 60 380 56 373 56C366 56 358 61 358 70V102H348V32Z"
          />
        </g>
      </svg>
    </div>
  );
};
