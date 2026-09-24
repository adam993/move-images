import { useEffect } from 'react'

/**
 * A file dropped anywhere outside the stage would make the browser open it, discarding the whole layer
 * stack. Cancelling file drags at the window keeps the page; the stage still handles its own drops.
 */
export function usePreventFileDropNavigation(): void {
  useEffect(() => {
    const preventFileDrop = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes('Files')) event.preventDefault()
    }
    window.addEventListener('dragover', preventFileDrop)
    window.addEventListener('drop', preventFileDrop)
    return () => {
      window.removeEventListener('dragover', preventFileDrop)
      window.removeEventListener('drop', preventFileDrop)
    }
  }, [])
}
