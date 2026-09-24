import { cn } from '@/lib/utils'

/** A chip showing an image color; the color is data from the image, so it is an inline style, not a token. */
export function ColorSwatch({ hex, className }: { hex: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block size-4 shrink-0 rounded-sm ring-1 ring-foreground/15', className)}
      style={{ backgroundColor: hex }}
    />
  )
}
