import type { ReactNode } from 'react'

export function SectionLabel({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{children}</h2>
      {aside}
    </div>
  )
}
