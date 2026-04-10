import React from "react";

function HexLogo() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="hexGrad"
          x1="3"
          y1="3"
          x2="29"
          y2="29"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <path
        d="M16 3L29 10.5V21.5L16 29L3 21.5V10.5L16 3Z"
        fill="url(#hexGrad)"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="0.5"
      />
      <path
        d="M11 16h10M16 11v10"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
export default HexLogo;
