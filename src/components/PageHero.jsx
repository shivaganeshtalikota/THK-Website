import Reveal from './Reveal'

/**
 * Shared page header. The old build repeated a near-identical yellow hero
 * block in five page files with slightly different spacing in each.
 */
const PageHero = ({ eyebrow, title, lead, children }) => (
  <section className="on-brand relative overflow-hidden bg-brand-texture">
    <div className="absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
    <div className="container-custom relative py-16 sm:py-20 lg:py-24">
      <Reveal className="max-w-3xl">
        {eyebrow && (
          <p className="font-heading text-xs font-bold uppercase tracking-[0.18em] text-ink-900/70">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-3 text-title text-ink-900">{title}</h1>
        {lead && <p className="mt-5 max-w-2xl text-lead text-ink-800">{lead}</p>}
        {children}
      </Reveal>
    </div>
  </section>
)

export default PageHero
