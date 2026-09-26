import { FaCircleCheck } from 'react-icons/fa6'
import Link from './LocaleLink'
import { useT } from '../i18n/useT'

/**
 * The short version of a legal page, beside the full text. The full text is a
 * reading column (max-w-prose); on a wide screen that left a blank half-page
 * next to it. This fills it with what most readers actually want to know,
 * and stays in view while they read.
 */
const LegalSummary = ({ points }) => {
  const t = useT()
  return (
    <aside className="lg:col-span-4">
      <div className="rounded-sm border hairline bg-ink-50 p-6 lg:sticky lg:top-[calc(var(--nav-h)+2rem)]">
        <p className="eyebrow">{t('In short')}</p>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-700">
          {points.map((p) => (
            <li key={p} className="flex gap-2.5">
              <FaCircleCheck className="mt-1 shrink-0 text-brand-700" aria-hidden="true" />
              <span>{t(p)}</span>
            </li>
          ))}
        </ul>
        <Link to="/contact" className="mt-5 inline-block text-sm font-semibold text-ink-900 underline underline-offset-4">
          {t('Questions? Contact the office')}
        </Link>
      </div>
    </aside>
  )
}

export default LegalSummary
