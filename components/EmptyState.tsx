'use client'

import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  message: string
  className?: string
}

export function EmptyState({
  icon: Icon,
  message,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`text-center py-16 ${className}`}>
      <Icon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <p className="text-xl text-gray-500">{message}</p>
    </div>
  )
}
