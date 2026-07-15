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

    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-0 bg-grid opacity-60" aria-hidden="true" />
      <div className="container-custom relative grid min-h-[70vh] place-items-center py-20">
        <div className="max-w-lg text-center">
          <p className="font-heading text-[6rem] font-extrabold leading-none tracking-tighter text-brand-700 sm:text-[8rem]">
            404
          </p>
          <h1 className="mt-2 text-title">This page could not be found</h1>
          <p className="mt-4 text-ink-600">
            The page may have been moved or removed, or the address may be mistyped.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/" className="btn-brand">
              Back to home <FaArrowRight aria-hidden="true" />
            </Link>
            <Link to="/contact" className="btn-outline">
              Contact the office
            </Link>
          </div>

          <nav aria-label="Site pages" className="mt-12">
            <h2 className="font-heading text-xs font-bold uppercase tracking-[0.14em] text-ink-500">
              Or try one of these
            </h2>
            <ul className="mt-4 flex flex-wrap justify-center gap-2">
              {nav.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="inline-block rounded-full border border-ink-200 px-4 py-2 text-xs font-semibold text-ink-600 transition-colors hover:border-brand-500 hover:bg-brand-50 hover:text-brand-800"
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
