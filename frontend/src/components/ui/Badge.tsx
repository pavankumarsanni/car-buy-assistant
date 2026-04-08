import { clsx } from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'electric' | 'hybrid'
  className?: string
}

const VARIANTS = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  electric: 'bg-blue-100 text-blue-700',
  hybrid: 'bg-teal-100 text-teal-700',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', VARIANTS[variant], className)}>
      {children}
    </span>
  )
}
