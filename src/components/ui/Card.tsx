import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "outlined";
}

export default function Card({
  children,
  className = "",
  variant = "default",
}: CardProps) {
  const variantStyles = {
    default: "bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow",
    elevated:
      "bg-white rounded-lg shadow-lg hover:shadow-2xl transition-shadow",
    outlined:
      "bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors",
  };

  return (
    <div className={`${variantStyles[variant]} ${className}`}>{children}</div>
  );
}
