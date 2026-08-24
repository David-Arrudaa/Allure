import React, { forwardRef } from "react";

export const Input = forwardRef(({ 
  icon: Icon, 
  className = "", 
  wrapperClassName = "",
  error,
  ...props 
}, ref) => {
  const hasError = !!error;
  
  return (
    <div className={`relative w-full ${wrapperClassName}`}>
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <Icon size={18} />
        </div>
      )}
      <input
        ref={ref}
        className={`w-full px-4 py-2.5 rounded-xl border transition-all text-sm focus:outline-none focus:ring-2 focus:border-transparent
          ${Icon ? "pl-10" : ""}
          ${hasError 
            ? "border-red-300 focus:ring-red-500" 
            : "border-gray-200 focus:ring-primary"
          }
          ${className}`}
        {...props}
      />
    </div>
  );
});

Input.displayName = "Input";
