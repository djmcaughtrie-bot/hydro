import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, id, ...props }, ref) => {
    const errorId = id ? `${id}-error` : undefined

    return (
      // Note: ref and all props (including data-testid, style) are spread onto
      // the <input> element, not this wrapper div.
      <div className="w-full">
        <input
          ref={ref}
          id={id}
          aria-describedby={error && errorId ? errorId : undefined}
          className={cn(
            'w-full rounded-lg border bg-white px-4 py-3 font-sans text-sm text-ink placeholder-ink-light',
            'focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent',
            'transition-colors',
            error ? 'border-red-400' : 'border-ink-light/40',
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1 font-sans text-xs text-red-500">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
