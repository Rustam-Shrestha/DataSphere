import { cn } from '@/utils'

export interface CircularLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'white'
  className?: string
}

export const CircularLoader: React.FC<CircularLoaderProps> = ({
  size = 'md',
  variant = 'primary',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  }

  const variantClasses = {
    primary: 'border-[#15803D] border-t-transparent',
    secondary: 'border-slate-700 border-t-transparent',
    white: 'border-white border-t-transparent',
  }

  return (
    <span
      className={cn(
        'inline-block rounded-full animate-spin',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    />
  )
}

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => (
  <div className={cn('space-y-2.5 w-full animate-pulse', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={cn(
          'h-4 bg-slate-200 rounded-sm',
          i === lines - 1 ? 'w-2/3' : 'w-full'
        )}
      />
    ))}
  </div>
)

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={cn(
      'rounded-lg border border-slate-200 p-6 bg-white animate-pulse space-y-4 shadow-subtle',
      className
    )}
  >
    <div className="w-full h-44 bg-slate-100 rounded-md" />
    <div className="h-6 w-3/4 bg-slate-200 rounded-sm" />
    <div className="space-y-2">
      <div className="h-4 w-full bg-slate-200 rounded-sm" />
      <div className="h-4 w-5/6 bg-slate-200 rounded-sm" />
    </div>
  </div>
)

export const PageLoader: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
    <CircularLoader size="lg" />
    <p className="text-xs font-mono font-medium text-slate-500">LOADING SYSTEM MODULES...</p>
  </div>
)

export default CircularLoader
