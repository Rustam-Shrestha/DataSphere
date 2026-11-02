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
    primary: 'border-[#166534] border-t-transparent',
    secondary: 'border-[#374151] border-t-transparent',
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
          'h-4 bg-[#E5E7EB] rounded-[4px]',
          i === lines - 1 ? 'w-2/3' : 'w-full'
        )}
      />
    ))}
  </div>
)

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={cn(
      'rounded-[12px] border border-[#E5E7EB] p-6 bg-white animate-pulse space-y-4',
      className
    )}
  >
    <div className="w-full h-44 bg-[#F5F7F6] rounded-[8px]" />
    <div className="h-6 w-3/4 bg-[#E5E7EB] rounded-[4px]" />
    <div className="space-y-2">
      <div className="h-4 w-full bg-[#E5E7EB] rounded-[4px]" />
      <div className="h-4 w-5/6 bg-[#E5E7EB] rounded-[4px]" />
    </div>
  </div>
)

export const PageLoader: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
    <CircularLoader size="lg" />
    <p className="text-xs font-mono font-medium text-[#6B7280]">LOADING SYSTEM MODULES...</p>
  </div>
)

export default CircularLoader
