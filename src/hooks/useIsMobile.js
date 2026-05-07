import { useState, useEffect } from 'react'

/**
 * Надёжно определяет мобильный экран через matchMedia (CSS media query),
 * а не через window.innerWidth (который может глючить при открытии клавиатуры).
 */
export function useIsMobile(breakpoint = 768) {
  const getMatch = () =>
    typeof window !== 'undefined' && window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches

  const [isMobile, setIsMobile] = useState(getMatch)

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const handler = (e) => setIsMobile(e.matches)
    // modern browsers
    if (mq.addEventListener) {
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    } else {
      // Safari < 14 fallback
      mq.addListener(handler)
      return () => mq.removeListener(handler)
    }
  }, [breakpoint])

  return isMobile
}
