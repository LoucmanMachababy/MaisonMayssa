import React, { forwardRef } from 'react'
import { cn } from '../../lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center font-bold uppercase tracking-[0.2em] transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-mayssa-gold/50"
    
    const variants = {
      primary: "bg-mayssa-brown text-white shadow-premium-shadow hover:bg-mayssa-gold",
      secondary: "bg-white text-mayssa-brown shadow-md hover:bg-mayssa-soft",
      outline: "border border-mayssa-brown/20 text-mayssa-brown hover:border-mayssa-gold hover:text-mayssa-gold",
      ghost: "text-mayssa-brown hover:bg-mayssa-brown/5",
      glass: "bg-white/10 text-white backdrop-blur-md border border-white/60 hover:bg-white/20",
    }
    
    const sizes = {
      sm: "px-5 py-2.5 text-[10px] rounded-full",
      md: "px-7 py-3 text-[11px] sm:text-xs rounded-full",
      lg: "px-9 py-4 text-xs sm:text-sm rounded-full",
      icon: "w-12 h-12 rounded-full",
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : null}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
