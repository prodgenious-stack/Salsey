"use client"

import { useEffect, useRef, useState } from "react"

export function useInView<T extends Element>(threshold = 0.2) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      // Fire slightly before the element is fully on screen so motion settles as it arrives.
      { threshold, rootMargin: "0px 0px -8% 0px" },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, inView }
}

export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.15)
  return (
    <div ref={ref} data-shown={inView} style={{ transitionDelay: `${delay}ms` }} className={`reveal ${className}`}>
      {children}
    </div>
  )
}
