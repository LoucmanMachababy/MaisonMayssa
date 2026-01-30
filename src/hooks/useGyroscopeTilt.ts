import { useEffect, useState } from 'react'

interface TiltState {
  rotateX: number
  rotateY: number
}

export function useGyroscopeTilt(intensity: number = 10) {
  const [tilt, setTilt] = useState<TiltState>({ rotateX: 0, rotateY: 0 })
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Check if DeviceOrientation is supported
    if (!('DeviceOrientationEvent' in window)) {
      return
    }

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const { beta, gamma } = event

      if (beta === null || gamma === null) return

      // beta: front-to-back tilt (-180 to 180)
      // gamma: left-to-right tilt (-90 to 90)

      // Normalize and limit the values
      const rotateX = Math.max(-intensity, Math.min(intensity, (beta - 45) * 0.3))
      const rotateY = Math.max(-intensity, Math.min(intensity, gamma * 0.3))

      setTilt({ rotateX, rotateY })
      setIsSupported(true)
    }

    // Request permission on iOS 13+
    const requestPermission = async () => {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const permission = await (DeviceOrientationEvent as any).requestPermission()
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation)
          }
        } catch {
          // Permission denied or error
        }
      } else {
        // Non-iOS or older iOS
        window.addEventListener('deviceorientation', handleOrientation)
      }
    }

    requestPermission()

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation)
    }
  }, [intensity])

  const style = isSupported
    ? {
        transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
        transition: 'transform 0.1s ease-out',
      }
    : {}

  return { tilt, style, isSupported }
}
