'use client'

type FocalPoint =
  | 'top-left' | 'top' | 'top-right'
  | 'left' | 'center' | 'right'
  | 'bottom-left' | 'bottom' | 'bottom-right'

interface Props {
  value: FocalPoint
  onChange: (point: FocalPoint) => void
}

const GRID: FocalPoint[][] = [
  ['top-left',    'top',    'top-right'],
  ['left',        'center', 'right'],
  ['bottom-left', 'bottom', 'bottom-right'],
]

export function FocalPointSelector({ value, onChange }: Props) {
  return (
    <div className="inline-grid grid-cols-3 gap-1" role="group" aria-label="Focal point">
      {GRID.map((row) =>
        row.map((point) => (
          <button
            key={point}
            type="button"
            aria-label={point}
            aria-pressed={value === point}
            onClick={() => onChange(point)}
            className={`h-7 w-7 rounded border transition-colors ${
              value === point
                ? 'border-teal bg-teal'
                : 'border-gray-200 bg-white hover:border-teal/50'
            }`}
          >
            <span
              className={`block h-2 w-2 rounded-full mx-auto ${
                value === point ? 'bg-white' : 'bg-gray-300'
              }`}
            />
          </button>
        ))
      )}
    </div>
  )
}
