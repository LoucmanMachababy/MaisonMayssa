import { motion } from 'framer-motion'
import { PRODUCT_SHOWCASE_MARQUEE } from '../../lib/decorativeAssets'

interface TrompeLoeilMarqueeProps {
  /** dark = fond espresso, light = fond ivoire */
  variant?: 'dark' | 'light'
  className?: string
}

export function TrompeLoeilMarquee({ variant = 'light', className = '' }: TrompeLoeilMarqueeProps) {
  const isDark = variant === 'dark'
  const items = PRODUCT_SHOWCASE_MARQUEE

  return (
    <section
      className={`overflow-hidden py-10 md:py-14 border-y ${
        isDark
          ? 'bg-mayssa-espresso border-mayssa-gold/10'
          : 'bg-mayssa-ivory border-mayssa-brown/5'
      } ${className}`}
      aria-hidden="true"
    >
      <motion.div
        className="flex w-max gap-6 md:gap-10 px-4"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 55, ease: 'linear', repeat: Infinity }}
      >
        {[1, 2].map((set) => (
          <div key={set} className="flex gap-6 md:gap-10">
            {items.map((item, i) => (
              <div
                key={`${set}-${i}`}
                className={`relative shrink-0 w-24 h-32 sm:w-28 sm:h-36 md:w-32 md:h-44 overflow-hidden ${
                  isDark ? 'opacity-90' : 'opacity-95'
                }`}
              >
                <img
                  src={item.src}
                  alt=""
                  className="w-full h-full object-cover object-center scale-110"
                  loading="lazy"
                  draggable={false}
                />
                <div
                  className={`absolute inset-0 ${
                    isDark
                      ? 'bg-gradient-to-t from-mayssa-espresso/40 to-transparent'
                      : 'bg-gradient-to-t from-mayssa-ivory/30 to-transparent'
                  }`}
                />
              </div>
            ))}
          </div>
        ))}
      </motion.div>
    </section>
  )
}
