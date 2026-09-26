import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: "brand" | "slate" | "emerald" | "amber";
  className?: string;
}

export function Badge({
  children,
  variant = "brand",
  className = "",
  ...props
}: BadgeProps) {
  const variantStyles = {
    brand: "bg-sky-50 text-sky-800 border-sky-200",
    slate: "bg-slate-100 text-slate-800 border-slate-200",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium tracking-wide ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
