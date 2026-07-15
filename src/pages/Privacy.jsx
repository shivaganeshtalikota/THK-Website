import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import PageHero from '../components/PageHero'
import Reveal from '../components/Reveal'
import { site, contact } from '../data/site'

/**
 * The footer linked to /privacy from day one but no route existed, so the link
 * rendered a blank page. This is a working baseline covering what the site
 * actually does today.
 *
 * TODO(office): have legal counsel review before launch — the source document
 * flags Indian data-protection law and Election Commission of India guidelines
 * for political content as compliance requirements.
 */
const Privacy = () => (
  <>
    <Seo
      title="Privacy Policy"
      description={`How the official website of ${site.name} handles visitor information.`}
    />

    <PageHero
      eyebrow="Legal"
      title="Privacy Policy"
      lead={`How this website handles the information you share with the office of ${site.name}.`}
    />

    <section className="section bg-white">
      <div className="container-custom">
        <Reveal className="prose-body mx-auto space-y-8 !text-base">
          <Block title="Information we collect">
            <p>
              This website collects personal information only when you choose to submit it
              through the contact form. That includes your name, email address, phone
              number, the subject of your enquiry, your location or constituency if you
              provide it, and the content of your message.
            </p>
          </Block>

          <Block title="How your information is used">
            <p>
              Information you submit is used solely to respond to your enquiry and to
              provide constituent services. It is not sold, rented, or traded. It is not
              used for any purpose you did not contact us about.
            </p>
          </Block>

          <Block title="Third-party services">
            <p>
              Contact form submissions are delivered by Web3Forms, which transmits your
              message to the office inbox. Web fonts are served by Google Fonts. These
              providers may process technical data such as your IP address in the course of
              delivering the service.
            </p>
          </Block>

          <Block title="Cookies and analytics">
            <p>
              This website does not set advertising or tracking cookies, and does not build
              a profile of your browsing. If analytics are introduced in future, this page
              will be updated before they go live.
            </p>
          </Block>

          <Block title="Your rights">
            <p>
              You may request access to the personal information the office holds about
              you, ask for it to be corrected, or ask for it to be deleted. Contact the
              office using the details on the contact page to make a request.
            </p>
          </Block>

          <Block title="Contact">
            <p>
              Questions about this policy can be directed to the office of {site.name}
              {contact.email.verified ? ` at ${contact.email.value}` : ''} via the{' '}
              {/* Link, not <a href>: a raw href triggers a full document
                  reload and throws away the SPA's loaded bundle. */}
              <Link to="/contact" className="font-semibold text-brand-800 underline underline-offset-2">
                contact page
              </Link>
              .
            </p>
          </Block>

          <p className="border-t border-ink-100 pt-6 text-sm text-ink-500">
            This policy describes current practice and will be updated if the site’s data
            handling changes.
          </p>
        </Reveal>
      </div>
    </section>
  </>
)

const Block = ({ title, children }) => (
  <div>
    <h2 className="font-heading text-lg font-bold text-ink-900">{title}</h2>
    <div className="mt-3 space-y-3 text-ink-600">{children}</div>
  </div>
)

export default Privacy
