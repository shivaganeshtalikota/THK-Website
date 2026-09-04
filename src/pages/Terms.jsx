import Seo from '../components/Seo'
import PageHero from '../components/PageHero'
import Reveal from '../components/Reveal'
import { site, party } from '../data/site'

/**
 * Baseline terms + the political-content disclaimer the source document calls
 * for under Election Commission of India guidelines.
 * TODO(office): legal review before launch.
 */
const Terms = () => (
  <>
    <Seo
      title="Terms of Use"
      description={`Terms governing the use of the official website of ${site.name}.`}
    />

    <PageHero
      eyebrow="Legal"
      title="Terms of Use"
      lead="The terms that govern your use of this website."
    />

    <section className="section bg-white">
      <div className="container-custom">
        <Reveal className="mx-auto max-w-prose space-y-9 text-ink-600">
          <Block title="About this website">
            <p>
              This is the official website of {site.name}, {site.role}, {party.name}. It is
              published by his office for the purpose of political communication, public
              information, and constituent service.
            </p>
          </Block>

          <Block title="Political content disclaimer">
            <p>
              This website contains political content published by, and on behalf of,{' '}
              {site.name} in his capacity as {site.role}. Views expressed represent his
              positions and those of the {party.abbr}. The site complies with Election
              Commission of India guidelines applicable to political communication.
            </p>
          </Block>

          <Block title="Accuracy of information">
            <p>
              Information is published in good faith and reviewed for accuracy. Content
              describing party history, roles and positions reflects the position at the
              time of publication and may change. If you believe something on this site is
              inaccurate, please contact the office so it can be corrected.
            </p>
          </Block>

          <Block title="Intellectual property">
            <p>
              Text, photography and graphics on this site are the property of the office of{' '}
              {site.name} unless otherwise credited, and may not be reproduced for
              commercial purposes without permission. Party names, symbols and marks remain
              the property of {party.name}.
            </p>
          </Block>

          <Block title="External links">
            <p>
              This site links to external websites and social media platforms, including
              the official {party.abbr} website. Those sites are not under the control of
              this office, and we are not responsible for their content or their privacy
              practices.
            </p>
          </Block>

          <Block title="Limitation of liability">
            <p>
              This website is provided on an “as is” basis. While every effort is made to
              keep it available and accurate, no warranty is given that it will be
              uninterrupted or error-free.
            </p>
          </Block>
        </Reveal>
      </div>
    </section>
  </>
)

const Block = ({ title, children }) => (
  <div>
    <h2 className="font-display text-headline text-ink-900">{title}</h2>
    <div className="mt-3 space-y-3 text-ink-600">{children}</div>
  </div>
)

export default Terms
