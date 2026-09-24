import { useLayoutEffect, useState, type RefObject } from 'react'

type Size = { width: number; height: number }

/** Largest box with the given aspect ratio (width / height) that fits inside the container's content box. */
export function useFittedSize(containerRef: RefObject<HTMLElement | null>, aspect: number | null): Size | null {
  const [container, setContainer] = useState<Size | null>(null)

  useLayoutEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      setContainer({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [containerRef])

  if (!container || !aspect) return null
  const width = Math.floor(Math.min(container.width, container.height * aspect))
  return { width, height: Math.floor(width / aspect) }
}
