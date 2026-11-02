import { useState, useId, type ReactNode } from 'react'
import { cn } from '@/utils'

export interface TooltipProps {
  content: ReactNode
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
}) => {
  const [open, setOpen] = useState(false)
  const id = useId()

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span
        aria-describedby={id}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        className="inline-flex cursor-pointer focus:outline-none"
      >
        {children}
      </span>

      {open && content && (
        <span
          id={id}
          role="tooltip"
          className={cn(
            'absolute z-50 px-2.5 py-1 text-xs font-medium text-white bg-slate-900 border border-slate-700/80 rounded-md shadow-lg whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150',
            positionClasses[position],
            className
          )}
        >
          {content}
        </span>
      )}
    </span>
  )
}

export default Tooltip
