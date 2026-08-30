// Compteur animé : monte de 0 à target avec un easing doux une fois que
// started passe à true (déclenché au scroll par useInView).
import { useEffect, useState } from 'react'

export function useCountUp(target, started, duration = 1400) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!started) return undefined
    let frame
    const startTime = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [started, target, duration])

  return value
}
