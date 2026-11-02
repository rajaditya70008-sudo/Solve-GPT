import React from 'react';

interface GptLogoProps {
  className?: string;
  size?: number;
}

export const GptLogo: React.FC<GptLogoProps> = ({ className = 'h-6 w-6', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle badge if needed */}
      <rect width="100" height="100" rx="28" fill="#10A37F" />
      {/* Minimalist ChatGPT-inspired spiral vortex */}
      <g stroke="#FFFFFF" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Six interlocking looping petals */}
        <path d="M50 20 C62 20, 72 28, 72 40 C72 48, 66 54, 58 57 L50 60 L50 78" />
        <path d="M76 35 C82 45, 80 58, 70 64 C63 68, 55 67, 47 62 L40 58 L25 67" />
        <path d="M76 65 C70 75, 58 80, 48 76 C41 72, 38 64, 39 56 L40 48 L25 39" />
        <path d="M50 80 C38 80, 28 72, 28 60 C28 52, 34 46, 42 43 L50 40 L50 22" />
        <path d="M24 65 C18 55, 20 42, 30 36 C37 32, 45 33, 53 38 L60 42 L75 33" />
        <path d="M24 35 C30 25, 42 20, 52 24 C59 28, 62 36, 61 44 L60 52 L75 61" />
      </g>
      {/* Central core node */}
      <circle cx="50" cy="50" r="5" fill="#FFFFFF" />
    </svg>
  );
};

export const GptMonochromeLogo: React.FC<GptLogoProps> = ({ className = 'h-5 w-5', size = 20 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M50 18 C63 18, 74 27, 74 40 C74 48, 67 55, 58 58 L50 61 L50 80" />
        <path d="M78 34 C85 45, 83 59, 72 65 C65 69, 56 68, 48 63 L41 59 L25 68" />
        <path d="M78 66 C71 77, 58 83, 47 78 C40 74, 37 65, 38 57 L39 49 L23 40" />
        <path d="M50 82 C37 82, 26 73, 26 60 C26 52, 33 45, 42 42 L50 39 L50 20" />
        <path d="M22 66 C15 55, 17 41, 28 35 C35 31, 44 32, 52 37 L59 41 L75 32" />
        <path d="M22 34 C29 23, 42 17, 53 22 C60 26, 63 35, 62 43 L61 51 L77 60" />
      </g>
      <circle cx="50" cy="50" r="6" fill="currentColor" />
    </svg>
  );
};
