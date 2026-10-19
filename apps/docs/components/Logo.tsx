import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  subtitle?: string;
  className?: string;
}

export function Logo({
  size = "md",
  showText = true,
  subtitle = "Meta WABA Platform",
  className = "",
}: LogoProps) {
  const iconSizeClasses = {
    sm: "h-7 w-7 text-xs rounded-lg",
    md: "h-9 w-9 text-sm rounded-xl",
    lg: "h-11 w-11 text-base rounded-2xl",
  }[size];

  const titleSizeClasses = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  }[size];

  const subtitleSizeClasses = {
    sm: "text-[9px]",
    md: "text-[10px]",
    lg: "text-xs",
  }[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icon Monogram Graphic */}
      <div
        className={`${iconSizeClasses} relative bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center text-white font-black tracking-tighter shadow-md shadow-emerald-500/20 flex-shrink-0 transition-transform group-hover:scale-105`}
        role="img"
        aria-label="NotifyIQ Logo Icon"
      >
        <span className="select-none">IQ</span>
        {/* Active notification indicator dot */}
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-white dark:border-slate-950 rounded-full" />
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col">
          <span
            className={`font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-100 ${titleSizeClasses} group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors`}
          >
            Notify<span className="text-emerald-600 dark:text-emerald-400">IQ</span>
          </span>
          {subtitle && (
            <span
              className={`${subtitleSizeClasses} uppercase font-semibold tracking-wider text-slate-500 dark:text-slate-400`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
