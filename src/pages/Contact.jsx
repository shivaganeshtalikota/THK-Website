import { useState } from 'react'
import { FaInstagram, FaFacebookF, FaXTwitter } from 'react-icons/fa6'
import { FaEnvelope, FaMapMarkerAlt, FaPaperPlane, FaExclamationTriangle } from 'react-icons/fa'
import Seo from '../components/Seo'
import PageHero from '../components/PageHero'
import Reveal from '../components/Reveal'
import { site, contact, social, subjectOptions } from '../data/site'

const socialIcons = { Instagram: FaInstagram, Facebook: FaFacebookF, X: FaXTwitter }

/**
 * Web3Forms access key. Set VITE_WEB3FORMS_KEY in .env (see .env.example).
 *
 * TODO(office): create a free key at https://web3forms.com — it emails
 * submissions straight to the office inbox, no server required.
 *
 * If the key is absent the form is disabled and says so. It must never
 * pretend to send. The previous version ran a 2-second setTimeout, threw the
 * message away, and told the constituent "Thank you for your message! We'll
 * get back to you soon." Nobody ever received any of it.
 */
const ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_KEY ?? ''
const IS_CONFIGURED = ACCESS_KEY.length > 0

const EMPTY = { name: '', email: '', phone: '', subject: '', location: '', message: '' }

const Contact = () => {
  const [formData, setFormData] = useState(EMPTY)
  const [status, setStatus] = useState({ state: 'idle', message: '' })

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!IS_CONFIGURED) return

    setStatus({ state: 'sending', message: '' })

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject: `[Website] ${formData.subject || 'General Inquiry'} — ${formData.name}`,
          from_name: `${site.name} Website`,
          ...formData,
        }),
      })
      const data = await res.json()

      // Only claim success when the API actually confirms it.
      if (res.ok && data.success) {
        setStatus({
          state: 'success',
          message: 'Thank you — your message has been sent to the office. You will receive a reply as soon as possible.',
        })
        setFormData(EMPTY)
      } else {
        throw new Error(data.message || 'The message could not be sent.')
      }
    } catch (err) {
      setStatus({
        state: 'error',
        message: `${err.message} Please try again, or reach the office directly using the details on this page.`,
      })
    }
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Contact ${site.name}`,
    url: `${site.url}/contact`,
    mainEntity: { '@id': `${site.url}/#person` },
  }

  const isSending = status.state === 'sending'

  return (
    <>
      <Seo
        title="Contact"
        description="Contact Hari Krishna Talikota for political inquiries, media requests, constituent services, or to get involved with TDP Telangana."
        schema={schema}
      />

      <PageHero
        eyebrow="Contact"
        title="Get in touch"
        lead="I am here to serve the people of Telangana. Whether you have political inquiries, need constituent services, or want to get involved with our movement, I welcome your contact."
      />

      {/* ---- Details + form ------------------------------------------------ */}
      <section className="section bg-white">
        <div className="container-custom grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Sidebar */}
          <Reveal className="lg:col-span-4">
            <p className="eyebrow">Direct Contact</p>
            <h2 className="mt-3 text-headline">Reach the office</h2>
            <div className="rule mt-5" />

            <ul className="mt-8 space-y-6">
              <li className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-800 ring-1 ring-brand-200">
                  <FaMapMarkerAlt aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-heading text-sm font-bold text-ink-900">Office</h3>
                  <p className="mt-0.5 text-sm text-ink-600">{contact.office.value}</p>
                </div>
              </li>

              {contact.email.verified ? (
                <li className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-800 ring-1 ring-brand-200">
                    <FaEnvelope aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-heading text-sm font-bold text-ink-900">Email</h3>
                    <a
                      href={`mailto:${contact.email.value}`}
                      className="mt-0.5 block break-all text-sm text-brand-800 underline-offset-2 hover:underline"
                    >
                      {contact.email.value}
                    </a>
                  </div>
                </li>
              ) : (
                // Rendering an unconfirmed address/number would send constituent
                // mail into a void. Better to show nothing than something wrong.
                <li className="rounded-xl border border-ink-200 bg-ink-50 p-4">
                  <p className="text-xs leading-relaxed text-ink-500">
                    Direct email and phone details will be published here once confirmed by
                    the office. Until then, please use the form or the social channels below.
                  </p>
                </li>
              )}
            </ul>

            <h3 className="mt-10 font-heading text-xs font-bold uppercase tracking-[0.14em] text-ink-500">
              Social
            </h3>
            <ul className="mt-4 flex gap-2.5">
              {social.map((s) => {
                const Glyph = socialIcons[s.name]
                return (
                  <li key={s.name}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer me"
                      aria-label={`${site.name} on ${s.name} (opens in a new tab)`}
                      className="grid h-11 w-11 place-items-center rounded-xl bg-ink-900 text-brand-400 transition-colors hover:bg-ink-700"
                    >
                      <Glyph aria-hidden="true" />
                    </a>
                  </li>
                )
              })}
            </ul>
          </Reveal>

          {/* Form */}
          <Reveal delay={0.1} className="lg:col-span-8">
            <div className="rounded-3xl border border-ink-100 bg-white p-7 shadow-card sm:p-10">
              <h2 className="text-headline">Send a message</h2>
              <p className="mt-2 text-sm text-ink-500">
                Fields marked with an asterisk are required.
              </p>

              {!IS_CONFIGURED && (
                <div
                  role="alert"
                  className="mt-6 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4"
                >
                  <FaExclamationTriangle
                    className="mt-0.5 shrink-0 text-amber-600"
                    aria-hidden="true"
                  />
                  <p className="text-sm leading-relaxed text-amber-900">
                    <strong className="font-bold">This form isn’t connected yet.</strong>{' '}
                    Message delivery needs a Web3Forms key in{' '}
                    <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">
                      VITE_WEB3FORMS_KEY
                    </code>
                    . It is disabled until then, so that nobody is told their message was
                    sent when it wasn’t.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                <fieldset disabled={!IS_CONFIGURED || isSending} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label="Full name" name="name" value={formData.name}
                      onChange={handleChange} required autoComplete="name"
                      placeholder="Your full name"
                    />
                    <Field
                      label="Email address" name="email" type="email" value={formData.email}
                      onChange={handleChange} required autoComplete="email"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label="Phone number" name="phone" type="tel" value={formData.phone}
                      onChange={handleChange} required autoComplete="tel"
                      placeholder="+91 00000 00000"
                    />
                    <div>
                      <Label htmlFor="subject" required>Subject</Label>
                      <select
                        id="subject" name="subject" value={formData.subject}
                        onChange={handleChange} required className={controlClass}
                      >
                        <option value="">Select a subject</option>
                        {subjectOptions.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Field
                    label="Location / constituency" name="location" value={formData.location}
                    onChange={handleChange} placeholder="Your city or constituency"
                  />

                  <div>
                    <Label htmlFor="message" required>Message</Label>
                    <textarea
                      id="message" name="message" rows="6" value={formData.message}
                      onChange={handleChange} required
                      placeholder="Write your message here…"
                      className={`${controlClass} resize-y`}
                    />
                  </div>

                  <button type="submit" className="btn-brand w-full sm:w-auto">
                    {isSending ? (
                      <>
                        <span
                          className="h-4 w-4 animate-spin rounded-full border-2 border-ink-900/30 border-t-ink-900"
                          aria-hidden="true"
                        />
                        Sending…
                      </>
                    ) : (
                      <>Send message <FaPaperPlane aria-hidden="true" /></>
                    )}
                  </button>
                </fieldset>

                {/* aria-live announces the result to screen readers, which the
                    old silent success div never did. */}
                <div aria-live="polite" aria-atomic="true">
                  {status.state === 'success' && (
                    <p className="rounded-xl border border-leaf-100 bg-leaf-50 p-4 text-sm text-leaf-700">
                      {status.message}
                    </p>
                  )}
                  {status.state === 'error' && (
                    <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                      {status.message}
                    </p>
                  )}
                </div>
              </form>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}

const controlClass =
  'w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 ' +
  'placeholder:text-ink-400 transition-colors ' +
  'focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-500/20 ' +
  'disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400'

const Label = ({ htmlFor, required, children }) => (
  <label
    htmlFor={htmlFor}
    className="mb-1.5 block font-heading text-xs font-bold text-ink-700"
  >
    {children}
    {required && (
      <>
        <span aria-hidden="true" className="ml-0.5 text-brand-800">*</span>
        <span className="sr-only"> (required)</span>
      </>
    )}
  </label>
)

const Field = ({ label, name, required, ...rest }) => (
  <div>
    <Label htmlFor={name} required={required}>{label}</Label>
    <input id={name} name={name} required={required} className={controlClass} {...rest} />
  </div>
)

export default Contact
