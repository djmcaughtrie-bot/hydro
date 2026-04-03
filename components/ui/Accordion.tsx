'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'

interface AccordionItem {
  question: string
  answer: string
}

interface AccordionProps {
  items: AccordionItem[]
  className?: string
}

export function Accordion({ items, className }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className={cn('divide-y divide-ink-light/20', className)}>
      {items.map((item, index) => (
        <div key={index}>
          <button
            type="button"
            className="flex w-full items-center justify-between py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            aria-expanded={openIndex === index}
          >
            <span className="font-sans text-base font-medium text-ink">
              {item.question}
            </span>
            <span
              className={cn(
                'font-mono text-xl text-teal transition-transform duration-200',
                openIndex === index && 'rotate-45'
              )}
              aria-hidden="true"
            >
              +
            </span>
          </button>
          <div
            className={cn(
              'overflow-hidden transition-all duration-200',
              openIndex === index ? 'max-h-96 pb-4' : 'max-h-0'
            )}
          >
            <p className="font-sans text-sm leading-relaxed text-ink-mid">
              {item.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

Accordion.displayName = 'Accordion'
