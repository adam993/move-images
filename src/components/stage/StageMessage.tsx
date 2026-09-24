import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function StageMessage({
  title,
  tone = 'neutral',
  children,
}: {
  title: string
  tone?: 'neutral' | 'error'
  children: ReactNode
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : undefined}
      className={cn(
        'absolute max-w-sm rounded-lg border p-4 text-sm',
        tone === 'error' ? 'border-destructive/40 bg-destructive/15' : 'border-border bg-card',
      )}
    >
      <p className="mb-1 font-medium">{title}</p>
      <p className="text-muted-foreground">{children}</p>
    </div>
  )
}
