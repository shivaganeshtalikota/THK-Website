import Link from '../components/LocaleLink'
import Seo from '../components/Seo'
import PageHero from '../components/PageHero'
import Reveal from '../components/Reveal'
import { site, contact } from '../data/site'
import { useT } from '../i18n/useT'

/**
 * The footer linked to /privacy from day one but no route existed, so the link
 * rendered a blank page. This is a working baseline covering what the site
 * actually does today.
 *
 * TODO(office): have legal counsel review before launch — the source document
 * flags Indian data-protection law and Election Commission of India guidelines
 * for political content as compliance requirements.
 */
const Privacy = () => {
  const t = useT()
  return (
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
        <Reveal className="mx-auto max-w-prose space-y-9 text-ink-600">
          <Block title="Information we collect">
            <p>
              {t("This website collects personal information only when you choose to submit it through the contact form. That includes your name, email address, phone number, the subject of your enquiry, your location or constituency if you provide it, and the content of your message.")}
            </p>
          </Block>

          <Block title="The poster maker">
            <p>
              {t("When you make a campaign poster, your photograph is processed inside your own browser: the background is removed and the poster is composed on your device. The photograph itself is never uploaded.")}
            </p>
            <p>
              {t("When you generate a poster, the finished poster image and a small preview of it are stored so that the link you share can show it. They are kept at an address nobody can guess and are deleted automatically after 30 days. The name and designation you type appear only on the poster itself.")}
            </p>
          </Block>

          <Block title="How your information is used">
            <p>
              {t("Information you submit is used solely to respond to your enquiry and to provide constituent services. It is not sold, rented, or traded. It is not used for any purpose you did not contact us about.")}
            </p>
          </Block>

          <Block title="Third-party services">
            <p>
              {t("Contact form submissions are delivered by Web3Forms, which transmits your message to the office inbox. The website is hosted by Vercel, and shared posters are stored with Cloudflare. Fonts are served from this website itself. These providers may process technical data such as your IP address in the course of delivering the service.")}
            </p>
          </Block>

          <Block title="Cookies and analytics">
            <p>
              {t("This website does not set advertising or tracking cookies, and does not build a profile of your browsing. It uses Vercel Web Analytics, which counts page visits without cookies and without identifying you.")}
            </p>
          </Block>

          <Block title="Your rights">
            <p>
              {t("You may request access to the personal information the office holds about you, ask for it to be corrected, or ask for it to be deleted. Contact the office using the details on the contact page to make a request.")}
            </p>
          </Block>

          <Block title="Contact">
            <p>
              {/* One unit up to the link, with the name substituted, so Telugu
                  can order the clause its own way. Both languages end on the
                  link, which is the only fixed point the sentence needs. */}
              {t(
                `Questions about this policy can be directed to the office of ${site.name}${
                  contact.email.verified ? ` at ${contact.email.value}` : ''
                } via the`
              )}{' '}
              {/* Link, not <a href>: a raw href triggers a full document
                  reload and throws away the SPA's loaded bundle. */}
              <Link to="/contact" className="font-semibold text-brand-800 underline underline-offset-2">
                {t("contact page")}
              </Link>
              .
            </p>
          </Block>

          <p className="border-t border-ink-100 pt-6 text-sm text-ink-500">
            {t("This policy describes current practice and will be updated if the site’s data handling changes.")}
          </p>
        </Reveal>
      </div>
    </section>
  </>
  )
}

const Block = ({ title, children }) => {
  const t = useT()
  return (
  <div>
    <h2 className="font-display text-headline text-ink-900">{t(title)}</h2>
    <div className="mt-3 space-y-3 text-ink-600">{children}</div>
  </div>
  )
}

export default Privacy
