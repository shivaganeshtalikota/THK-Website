import { Link } from 'react-router-dom'
import { FaArrowRight } from 'react-icons/fa'
import Seo from '../components/Seo'
import { nav } from '../data/site'

const NotFound = () => (
  <>
    {/* noindex: a 404 must never be indexed as real content. */}
    <Seo
      title="Page not found"
      description="The page you are looking for could not be found."
      noindex
    />

    {/* Dark, like every other page hero — the fixed header goes transparent
        over the top of the viewport and needs a dark ground beneath it. */}
    <section className="on-dark relative -mt-[var(--nav-h)] overflow-hidden bg-ink-950">
      <div className="container-custom relative grid min-h-[100svh] place-items-center py-20">
        <div className="max-w-lg text-center">
          <p className="font-display text-[6rem] font-bold leading-none tracking-tight text-brand-500 sm:text-[9rem]">
            404
          </p>
          <h1 className="mt-2 font-display text-title text-white">
            This page could not be found
          </h1>
          <p className="mt-5 text-white/70">
            The page may have been moved or removed, or the address may be mistyped.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/" className="btn-brand">
              Back to home <FaArrowRight aria-hidden="true" />
            </Link>
            <Link to="/contact" className="btn-ghost-light">
              Contact the office
            </Link>
          </div>

          <nav aria-label="Site pages" className="mt-12">
            <h2 className="eyebrow">Or try one of these</h2>
            <ul className="mt-4 flex flex-wrap justify-center gap-2">
              {nav.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="inline-block rounded-sm border border-white/25 px-4 py-2.5 text-xs font-medium text-white/75 transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-ink-900"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </section>
  </>
)

export default NotFound
