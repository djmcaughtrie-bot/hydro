import { cn } from '@/lib/cn'
import { MODELS, MODEL_KEYS } from '@/lib/product-models'
import type { ModelKey } from '@/lib/product-models'

interface Props {
  selected: ModelKey
  onSelect: (key: ModelKey) => void
}

export function ModelSelector({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {MODEL_KEYS.map((key) => {
        const m = MODELS[key]
        const isSelected = selected === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={cn(
              'relative flex flex-col items-start rounded-lg border-2 p-6 text-left transition-all',
              isSelected
                ? 'border-teal bg-white shadow-md'
                : 'border-ink-light/20 bg-white hover:border-teal/40'
            )}
          >
            <div className="mb-3 h-6 flex items-center">
              {m.badge ? (
                <span className={cn('rounded-pill px-3 py-1 font-mono text-xs font-medium', m.badgeStyle)}>
                  {m.badge}
                </span>
              ) : null}
            </div>

            <p className="mb-1 font-display text-lg text-ink">{m.name}</p>
            <p className="mb-4 font-sans text-xs text-ink-light">{m.tagline}</p>

            <div className="mb-4 w-full border-t border-ink-light/20 pt-4">
              <p className="font-mono text-3xl font-bold text-teal">
                {m.flowRate.toLocaleString()}
                <span className="ml-1 font-sans text-sm font-normal text-ink-mid">ml/min</span>
              </p>
              <p className="mt-0.5 font-sans text-xs text-ink-light">max flow rate</p>
            </div>

            <p className="mt-auto font-display text-2xl text-ink">
              £{m.price.toLocaleString()}
            </p>

            <div
              className={cn(
                'mt-4 w-full rounded-pill py-2 text-center font-sans text-sm font-medium transition-colors',
                isSelected
                  ? 'bg-teal text-white'
                  : 'bg-cream text-ink-mid hover:bg-teal/10'
              )}
            >
              {isSelected ? 'Selected' : 'Select'}
            </div>
          </button>
        )
      })}
    </div>
  )
}
