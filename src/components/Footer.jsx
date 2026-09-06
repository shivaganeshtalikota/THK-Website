import { Link } from 'react-router-dom'
import { FaInstagram, FaFacebookF, FaXTwitter, FaYoutube } from 'react-icons/fa6'
import { FaEnvelope, FaMapMarkerAlt, FaPhone } from 'react-icons/fa'
import PartyMark from './PartyMark'
import { site, social, contact, party } from '../data/site'

const socialIcons = { Instagram: FaInstagram, Facebook: FaFacebookF, X: FaXTwitter, YouTube: FaYoutube }

const Footer = () => {
  const year = new Date().getFullYear()

  const columns = [
    {
      title: 'Explore',
      links: [
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
        { name: 'Political Leadership', path: '/political' },
        { name: 'Community Service', path: '/community' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { name: 'Media & Updates', path: '/media' },
        { name: 'Contact', path: '/contact' },
        { name: 'Privacy Policy', path: '/privacy' },
        { name: 'Terms of Use', path: '/terms' },
      ],
    },
  ]

  return (
    <footer className="on-dark border-t-4 border-brand-500 bg-ink-950 text-ink-300">
      <div className="container-custom py-14 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Identity */}
          <div className="space-y-5 lg:col-span-5">
            {/* Wordmark, matching the header: both names carry equal weight. */}
            <div>
              <span className="relative inline-block font-display text-[1.7rem] font-bold leading-tight tracking-tight text-white">
                Hari Krishna Talikota
                <span
                  className="absolute -bottom-2 left-0 h-[2px] w-full bg-brand-500"
                  aria-hidden="true"
                />
              </span>
              <span className="mt-6 block text-sm text-ink-400">{site.role}</span>
              <span className="mt-1 block text-sm text-ink-400">{site.secondaryRole}</span>
            </div>

            <p className="max-w-sm text-sm leading-relaxed text-ink-400">
              Dedicated to serving the people of Telangana through principled political
              leadership and community service. Working for Telugu pride and regional
              development.
            </p>

            {/* Party affiliation. He is a TDP office-bearer, so the emblem
                belongs here rather than in the wordmark, which stays
                typographic. */}
            <a
              href={party.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-sm py-1 transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
            >
              <PartyMark size={40} tone="dark" />
            </a>

            <ul className="flex gap-2.5">
              {social.map((s) => {
                const Glyph = socialIcons[s.name]
                return (
                  <li key={s.name}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer me"
                      aria-label={`${site.name} on ${s.name} (opens in a new tab)`}
                      className="grid h-10 w-10 place-items-center bg-white/5 text-ink-300 transition-colors hover:bg-brand-500 hover:text-ink-900"
                    >
                      <Glyph aria-hidden="true" />
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>

          {columns.map((col) => (
            <nav key={col.title} className="lg:col-span-2" aria-label={col.title}>
              <h2 className="mb-4 font-sans text-micro uppercase text-brand-300">
                {col.title}
              </h2>
              <ul className="space-y-0.5">
                {col.links.map((link) => (
                  <li key={link.path}>
                    {/* inline-block + py: bare links measured 19px tall, under
                        the 24px minimum tap target (WCAG 2.5.8). */}
                    <Link
                      to={link.path}
                      className="inline-block py-1.5 text-sm text-ink-400 transition-colors hover:text-brand-300"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Contact — only renders details that are actually confirmed. */}
          <div className="lg:col-span-3">
            <h2 className="mb-4 font-sans text-micro uppercase text-brand-300">
              Contact
            </h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <FaMapMarkerAlt className="mt-1 shrink-0 text-brand-400" aria-hidden="true" />
                <span className="text-ink-400">{contact.office.value}</span>
              </li>
              {contact.email.verified && (
                <li className="flex items-start gap-3">
                  <FaEnvelope className="mt-1 shrink-0 text-brand-400" aria-hidden="true" />
                  <a
                    href={`mailto:${contact.email.value}`}
                    className="break-all text-ink-400 transition-colors hover:text-brand-300"
                  >
                    {contact.email.value}
                  </a>
                </li>
              )}
              {contact.phone.verified && (
                <li className="flex items-start gap-3">
                  <FaPhone className="mt-1 shrink-0 text-brand-400" aria-hidden="true" />
                  <a
                    href={`tel:${contact.phone.value}`}
                    className="text-ink-400 transition-colors hover:text-brand-300"
                  >
                    {contact.phone.display}
                  </a>
                </li>
              )}
              <li>
                <Link
                  to="/contact"
                  className="inline-block py-1.5 text-sm font-semibold text-brand-300 hover:text-brand-200"
                >
                  Send a message →
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        {/* ink-400 not ink-500: on the near-black footer, ink-500 lands at
            3.45:1. ink-400 is 6.35:1. */}
        <div className="container-custom flex flex-col items-center justify-between gap-3 py-6 text-xs text-ink-400 sm:flex-row">
          <p>© {year} {site.name}. All rights reserved.</p>
          <p className="text-center sm:text-right">
            Published by the office of {site.name}, {site.roleShort}, {party.name}.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
