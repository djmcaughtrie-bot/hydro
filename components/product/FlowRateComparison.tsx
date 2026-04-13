const COMPARISON_BARS = [
  {
    label: 'Most home devices',
    sublabel: '50\u2013150\u00a0ml/min',
    rate: 130,
    max: 3000,
    barClass: 'bg-ink-light/40',
    labelClass: 'text-ink-light',
  },
  {
    label: 'H2 Revive Pulse',
    sublabel: '1,200\u00a0ml/min',
    rate: 1200,
    max: 3000,
    barClass: 'bg-teal/60',
    labelClass: 'text-ink',
  },
  {
    label: 'H2 Revive Flow',
    sublabel: '1,500\u00a0ml/min',
    rate: 1500,
    max: 3000,
    barClass: 'bg-teal',
    labelClass: 'text-ink font-medium',
  },
  {
    label: 'H2 Revive Clinical',
    sublabel: '3,000\u00a0ml/min',
    rate: 3000,
    max: 3000,
    barClass: 'bg-ink',
    labelClass: 'text-ink',
  },
]

export function FlowRateComparison() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-2">

          {/* Flow rate bars */}
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-teal">
              Flow rate
            </p>
            <h2 className="mb-4 font-display text-3xl text-ink">
              The number that matters most.
            </h2>
            <p className="mb-8 font-sans text-sm leading-relaxed text-ink-mid">
              Most home hydrogen devices on the market deliver between 50 and
              150&nbsp;ml per minute &mdash; often dispersed into open air, not
              directly inhaled. At that rate, a full 20-minute session delivers
              roughly 2,000&ndash;3,000&nbsp;ml of hydrogen-enriched air in
              total. The H2 Revive Flow delivers 1,500&nbsp;ml in a single
              minute, directly through a nasal cannula.
            </p>

            <div className="space-y-5">
              {COMPARISON_BARS.map(({ label, sublabel, rate, max, barClass, labelClass }) => (
                <div key={label}>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className={`font-sans text-sm ${labelClass}`}>{label}</span>
                    <span className="font-mono text-xs text-ink-mid">{sublabel}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-cream">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barClass}`}
                      style={{ width: `${Math.round((rate / max) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 font-sans text-xs leading-relaxed text-ink-light">
              Flow rate comparison shown relative to the H2 Revive Clinical
              (3,000&nbsp;ml/min). &ldquo;Most home devices&rdquo; refers to
              proximity-nozzle devices commonly available at equivalent price
              points.
            </p>
          </div>

          {/* Delivery method */}
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-teal">
              Delivery method
            </p>
            <h2 className="mb-4 font-display text-3xl text-ink">
              Direct, not ambient.
            </h2>
            <p className="mb-8 font-sans text-sm leading-relaxed text-ink-mid">
              Many hydrogen devices disperse gas into the air around you. You
              breathe whatever reaches you &mdash; diluted by room air, affected
              by distance and ventilation. H2 Revive delivers hydrogen directly
              through a nasal cannula: machine to lung, with no dilution.
            </p>

            <div className="space-y-6">
              <div className="rounded-lg border border-ink-light/20 p-5">
                <p className="mb-2 font-sans text-sm font-medium text-ink-mid">
                  Passive proximity delivery
                </p>
                <p className="font-sans text-sm leading-relaxed text-ink-light">
                  Gas released near the face. Concentration varies by distance,
                  airflow, and room ventilation. The further you are, the less
                  you receive. Output rate is often under 150&nbsp;ml/min.
                </p>
              </div>

              <div className="rounded-lg border-2 border-teal p-5">
                <p className="mb-2 font-sans text-sm font-medium text-teal">
                  Direct nasal cannula &mdash; H2 Revive
                </p>
                <p className="font-sans text-sm leading-relaxed text-ink-mid">
                  A lightweight cannula delivers hydrogen from machine to nasal
                  passage. Concentration is consistent and controlled. Output
                  starts at 450&nbsp;ml/min and scales to 1,500 or
                  3,000&nbsp;ml/min depending on your device.
                </p>
              </div>
            </div>

            <p className="mt-6 font-sans text-xs italic leading-relaxed text-ink-light">
              The research studies referenced in our Science Hub used direct
              nasal or facial mask delivery at controlled flow rates of
              300&nbsp;ml/min and above.
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}
