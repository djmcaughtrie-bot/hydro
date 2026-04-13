const TECH_POINTS = [
  {
    heading: 'SPE\u00a0/\u00a0PEM membrane',
    body: 'Solid Polymer Electrolyte technology splits water into hydrogen and oxygen at the molecular level \u2014 no salt, no additives, no by-products. The same membrane category used in research-grade laboratory electrolyzers.',
  },
  {
    heading: 'USA-made N117 electrolyzer',
    body: 'The N117 is a Nafion\u00ae membrane made in the United States \u2014 widely regarded as the benchmark for purity and longevity in PEM electrolysis. It is the cell type most frequently referenced in the academic literature we cite.',
  },
  {
    heading: 'Hydrogen separated at source',
    body: 'The electrolysis cell separates hydrogen from oxygen before it leaves the machine. What reaches you is \u226599.99% pure molecular hydrogen \u2014 not a mixture, not an approximation.',
  },
  {
    heading: 'No PFAS. No catalysts.',
    body: 'The entire gas path is free from PFAS \u2014 the class of \u201cforever chemicals\u201d found in some older-generation devices. No catalysts are added to the electrolysis process.',
  },
  {
    heading: '10,000-hour cell lifespan',
    body: 'At one 30-minute session per day, the electrolysis cell lasts over 54 years of use. The machine is built to outlast the practice.',
  },
  {
    heading: '2-year UK warranty',
    body: 'All three models include a full 2-year UK warranty with direct support. We hold stock and provide service from the UK \u2014 not a third-party fulfilment arrangement.',
  },
]

export function TechnologySection() {
  return (
    <section className="bg-ink py-16">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-teal">
          Under the surface
        </p>
        <h2 className="mb-10 font-display text-3xl text-white">
          The technology inside every H2 Revive device.
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TECH_POINTS.map(({ heading, body }) => (
            <div key={heading} className="rounded-lg border border-white/10 p-6">
              <p className="mb-2 font-display text-lg text-white">{heading}</p>
              <p className="font-sans text-sm leading-relaxed text-ink-light">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
