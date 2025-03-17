import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function DentamindLogo({ className = "", size = "md" }: LogoProps) {
  const sizeMap = {
    sm: "h-8 w-auto",
    md: "h-12 w-auto",
    lg: "h-16 w-auto",
  };

  return (
    <div className={`flex items-center ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        className={sizeMap[size]}
        fill="currentColor"
      >
        <path
          d="M32 8C18.746 8 8 18.746 8 32c0 13.254 10.746 24 24 24s24-10.746 24-24C56 18.746 45.254 8 32 8zm0 44c-11.046 0-20-8.954-20-20s8.954-20 20-20 20 8.954 20 20-8.954 20-20 20z"
          fill="currentColor"
          className="text-primary"
        />
        <path
          d="M40.172 23.172a4 4 0 00-5.657 0C33.79 23.898 32.944 24 32 24s-1.79-.102-2.515-.828a4 4 0 00-5.657 0A3.988 3.988 0 0022 26c0 .954.102 1.8.828 2.515l8.515 8.515a1 1 0 001.414 0l8.515-8.515c.726-.726.828-1.56.828-2.515a3.988 3.988 0 00-1.828-2.828z"
          fill="currentColor"
          className="text-primary"
        />
        <path
          d="M34.243 40c-1.36 0-2.5-.99-2.743-2.305C31.257 37.01 30 35.424 30 33.6V26a2 2 0 114 0v7.6c0 .22.18.4.4.4.198 0 .362-.145.393-.336.457-2.892 2.943-5.059 5.923-5.059 3.309 0 6 2.691 6 6 0 3.125-2.387 5.685-5.432 5.958A2.756 2.756 0 0134.243 40z"
          fill="currentColor"
          className="text-primary"
        />
      </svg>
      <div className="ml-2">
        <span className="font-bold text-primary text-xl">DentaMind</span>
      </div>
    </div>
  );
}