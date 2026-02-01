import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  variant?: 'default' | 'circular' | 'text'
}

export function Skeleton({ className = '', variant = 'default' }: SkeletonProps) {
  const baseClasses = 'bg-mayssa-cream relative overflow-hidden'
  const variantClasses = {
    default: 'rounded-xl',
    circular: 'rounded-full',
    text: 'rounded-md h-4'
  }

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 sm:gap-4 overflow-hidden rounded-2xl sm:rounded-[2rem] bg-white/60 p-3 sm:p-4 shadow-xl ring-1 ring-white/40">
      {/* Image skeleton */}
      <Skeleton className="aspect-[4/3] rounded-xl sm:rounded-2xl" />

      {/* Content skeleton */}
      <div className="flex flex-col gap-2 sm:gap-3">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-3/4 h-5" />
          <Skeleton variant="text" className="w-full h-3" />
          <Skeleton variant="text" className="w-2/3 h-3" />
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="space-y-1">
            <Skeleton variant="text" className="w-16 h-3" />
            <Skeleton variant="text" className="w-20 h-6" />
          </div>
          <Skeleton variant="circular" className="h-10 w-10 sm:h-12 sm:w-12" />
        </div>
      </div>
    </div>
  )
}

export function MobileProductCardSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 shadow-lg">
      <div className="flex gap-3">
        {/* Image skeleton */}
        <Skeleton className="w-20 h-20 flex-shrink-0 rounded-xl" />

        {/* Content skeleton */}
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton variant="text" className="w-3/4 h-4" />
          <Skeleton variant="text" className="w-full h-3" />
          <div className="flex items-center justify-between mt-2">
            <Skeleton variant="text" className="w-16 h-5" />
            <div className="flex gap-2">
              <Skeleton variant="circular" className="h-8 w-8" />
              <Skeleton variant="circular" className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CategoryChipSkeleton() {
  return (
    <Skeleton className="h-10 w-24 rounded-full" />
  )
}

export function ProductGridSkeleton({ count = 6, isMobile = false }: { count?: number; isMobile?: boolean }) {
  if (isMobile) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <MobileProductCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function CategoryBarSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-2 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <CategoryChipSkeleton key={i} />
      ))}
    </div>
  )
}
