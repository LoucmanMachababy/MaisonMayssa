import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <motion.div
      className={cn(
        'bg-gradient-to-r from-mayssa-cream via-white to-mayssa-cream bg-[length:200%_100%]',
        'rounded-lg',
        className
      )}
      animate={{
        backgroundPosition: ['200% 0', '-200% 0'],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white/80 p-3 shadow-lg space-y-3">
      <div className="flex gap-3">
        {/* Image skeleton */}
        <Skeleton className="w-20 h-20 flex-shrink-0 rounded-xl" />

        {/* Content skeleton */}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <div className="flex items-center justify-between mt-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3 md:hidden">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function CategoryTabsSkeleton() {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-20 flex-shrink-0 rounded-xl" />
      ))}
    </div>
  )
}

export function CartItemSkeleton() {
  return (
    <div className="flex gap-3 p-2.5 rounded-xl bg-white/80">
      <Skeleton className="w-14 h-14 flex-shrink-0 rounded-lg" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2.5 w-1/2" />
        <div className="flex items-center justify-between mt-1">
          <Skeleton className="h-4 w-12" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-6 w-6 rounded-md" />
            <Skeleton className="h-4 w-5" />
            <Skeleton className="h-6 w-6 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Image skeleton with shimmer and fade-in when loaded
export function ImageWithSkeleton({
  src,
  alt,
  className
}: {
  src?: string
  alt: string
  className?: string
}) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Skeleton background */}
      <Skeleton className="absolute inset-0" />

      {/* Actual image */}
      {src && (
        <motion.img
          src={src}
          alt={alt}
          loading="lazy"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative w-full h-full object-cover"
          onLoad={(e) => {
            (e.target as HTMLImageElement).style.opacity = '1'
          }}
        />
      )}
    </div>
  )
}
