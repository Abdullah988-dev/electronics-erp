 
import React from 'react';

export default function InputField({ label, icon: Icon, error, ...props }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Premium small capitalized labels */}
      {label && (
        <label className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
          {label}
        </label>
      )}
      
      <div className="relative flex items-center">
        {/* Dynamic Lucide Icon Injection */}
        {Icon && (
          <Icon className="absolute left-4 text-slate-400 w-5 h-5 pointer-events-none transition-colors group-focus-within:text-indigo-500" />
        )}
        
        <input
          {...props}
          className={`w-full py-3 ${Icon ? 'pl-12' : 'px-4'} pr-4 bg-white border ${
            error 
              ? 'border-red-400 focus:ring-red-100 focus:border-red-500' 
              : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-500'
          } rounded-xl shadow-sm text-sm transition-all focus:outline-none focus:ring-4 placeholder:text-slate-400`}
        />
      </div>
      
      {/* Custom Validation Error Message Block */}
      {error && (
        <span className="text-xs text-red-500 font-medium mt-0.5 animate-pulse">
          {error}
        </span>
      )}
    </div>
  );
}