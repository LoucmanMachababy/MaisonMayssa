import React, { forwardRef } from 'react'
import { cn } from '../../lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label className="text-[10px] font-bold uppercase tracking-widest text-mayssa-brown/60 ml-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full px-5 py-3.5 bg-white/60 border border-mayssa-brown/10 rounded-2xl",
            "text-mayssa-brown placeholder:text-mayssa-brown/30",
            "focus:outline-none focus:ring-2 focus:ring-mayssa-gold/50 focus:border-transparent",
            "transition-all duration-300",
            error && "border-red-500/50 focus:ring-red-500/50",
            className
          )}
          {...props}
        />
        {error && (
          <span className="text-[10px] font-semibold text-red-500 ml-1">
            {error}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
