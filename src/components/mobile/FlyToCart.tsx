import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FlyingItem {
  id: number
  startX: number
  startY: number
  image?: string
  name: string
}

interface FlyToCartProps {
  trigger: number
  productImage?: string
  productName: string
  startPosition?: { x: number; y: number }
}

export function FlyToCart({ trigger, productImage, productName, startPosition }: FlyToCartProps) {
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([])

  useEffect(() => {
    if (trigger === 0) return

    const newItem: FlyingItem = {
      id: Date.now(),
      startX: startPosition?.x ?? window.innerWidth / 2,
      startY: startPosition?.y ?? window.innerHeight / 2,
      image: productImage,
      name: productName,
    }

    setFlyingItems((prev) => [...prev, newItem])

    // Remove after animation
    setTimeout(() => {
      setFlyingItems((prev) => prev.filter((item) => item.id !== newItem.id))
    }, 800)
  }, [trigger, productImage, productName, startPosition])

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <AnimatePresence>
        {flyingItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{
              x: item.startX,
              y: item.startY,
              scale: 1,
              opacity: 1,
            }}
            animate={{
              x: window.innerWidth - 60, // Position of cart icon
              y: window.innerHeight - 40, // Bottom nav position
              scale: 0.2,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.6,
              ease: [0.32, 0, 0.67, 0],
            }}
            className="absolute w-16 h-16 rounded-xl overflow-hidden shadow-2xl"
          >
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-mayssa-caramel flex items-center justify-center">
                <span className="text-white text-2xl">🧁</span>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Hook to manage fly-to-cart animation
export function useFlyToCart() {
  const [trigger, setTrigger] = useState(0)
  const [currentProduct, setCurrentProduct] = useState<{
    image?: string
    name: string
    position?: { x: number; y: number }
  }>({ name: '' })

  const fly = (
    productName: string,
    productImage?: string,
    position?: { x: number; y: number }
  ) => {
    setCurrentProduct({ name: productName, image: productImage, position })
    setTrigger((t) => t + 1)
  }

  return {
    trigger,
    currentProduct,
    fly,
  }
}
