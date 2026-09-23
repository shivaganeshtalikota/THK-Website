import { FaArrowRight, FaCamera, FaPenNib, FaWhatsapp, FaCircleCheck } from 'react-icons/fa6'
import Link from './LocaleLink'
import Reveal from './Reveal'
import { posterImage } from '../data/posters'
import { useT, useLang } from '../i18n/useT'

/**
 * The header of /posters, in two halves.
 *
 * It used to be the shared PageHero with no photograph: a heading and a
 * paragraph at the top-left of a tall black band, and nothing else — the
 * office's word for it was "empty". Here the left half says what the page does
 * and gets somebody moving (one button, three steps), and the right half SHOWS
 * it: the campaign's own artwork, fanned like printed posters, under the
 * tagline in the heavy poster face, with the two places a supporter's photo
 * and name will go marked on it.
 *
 * The artwork is the same file the first card below loads, so the showcase
 * costs no extra download.
 */
const PostersHero = ({ posters }) => {
  const t = useT()
  const lang = useLang()
  const lead = posters[0]
  const second = posters[1] || posters[0]

  const steps = [
    { icon: FaCamera, title: 'Add your photo', text: 'The background is removed for you.' },
    { icon: FaPenNib, title: 'Type your name', text: 'Telugu or English, with your designation.' },
    { icon: FaWhatsapp, title: 'Share it', text: 'Download it, or send the link on WhatsApp.' },
  ]

  return (
    <section className="relative isolate overflow-hidden border-b-[6px] border-brand-500 bg-ink-950">
      {/* A warm glow behind the showcase, so the right half is lit rather than
          a second black field. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_78%_45%,rgba(255,212,0,0.16),transparent_58%)]"
        aria-hidden="true"
      />

      {/*
        Three blocks, placed differently by width. On a phone they stack in
        source order — the offer, then the showcase, then the steps — so the
        poster is on screen straight after the heading instead of below three
        cards. From lg the offer and the steps share the left column and the
        showcase takes the right, spanning both rows.
      */}
      <div className="on-dark container-custom grid gap-10 pb-14 pt-10 sm:pt-14 lg:grid-cols-12 lg:grid-rows-[auto_auto] lg:gap-x-10 lg:gap-y-10 lg:pb-20 lg:pt-16">
        {/* ---- the offer ---- */}
        <div className="lg:col-span-6 lg:row-start-1 lg:self-end">
          <Reveal as="p" delay={0.05} className="label-rule !text-brand-400 before:!bg-brand-500">
            {t('Campaign Material')}
          </Reveal>
          <Reveal
            as="h1"
            delay={0.12}
            className="display-wrap mt-6 font-display text-[clamp(2rem,1.2rem+3vw,3.75rem)] font-bold leading-[1.02] tracking-[-0.02em] text-white"
          >
            {t('Create your own poster')}
          </Reveal>
          <Reveal as="p" delay={0.19} className="mt-6 max-w-xl text-lead text-white/75">
            {t(
              'Pick a campaign, add your photo and your name, and download a poster ready to share. It takes under a minute, it works on a phone, and your photograph never leaves your device.',
            )}
          </Reveal>

          <Reveal delay={0.26} className="mt-8 flex flex-wrap items-center gap-3">
            <Link to={`/posters/${lead.slug}`} className="btn-brand">
              {t('Make my poster')}
              <FaArrowRight aria-hidden="true" />
            </Link>
            <a href="#campaigns" className="btn-ghost-light">
              {t('See all campaigns')}
            </a>
          </Reveal>
        </div>

        {/* ---- the showcase ---- */}
        <Reveal delay={0.18} className="lg:col-span-6 lg:col-start-7 lg:row-span-2 lg:row-start-1 lg:self-center">
          <div className="mx-auto w-full max-w-[22rem] sm:max-w-[28rem] lg:max-w-[30rem]">
            <p
              lang="te"
              className="text-center font-poster text-[clamp(1.9rem,1.3rem+2.2vw,3rem)] font-extrabold leading-[1.15] text-brand-400"
            >
              మీ పేరు. మీ ఫోటో. మీ పోస్టర్.
            </p>
            {lang !== 'te' && (
              <p className="mt-2 text-center font-sans text-[0.78rem] font-semibold uppercase tracking-[0.2em] text-white/60">
                {t('Your name. Your photo. Your poster.')}
              </p>
            )}

            <div className="relative mx-auto mt-9 w-[78%] sm:w-[74%]">
              <div className="relative aspect-[4/5]">
                {/* the poster behind, fanned left */}
                <img
                  src={posterImage(second)}
                  alt=""
                  aria-hidden="true"
                  loading="eager"
                  decoding="async"
                  className="absolute inset-0 h-full w-full -translate-x-[16%] translate-y-[3%] -rotate-[8deg] scale-[0.94] rounded-sm object-cover opacity-45 shadow-2xl ring-1 ring-white/10"
                />
                {/* the poster in front */}
                <Link
                  to={`/posters/${lead.slug}`}
                  className="group absolute inset-0 block rotate-[3deg] overflow-hidden rounded-sm shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/15 transition-transform duration-500 hover:rotate-[1deg] hover:scale-[1.02]"
                  aria-label={t('Make my poster')}
                >
                  <img
                    src={posterImage(lead)}
                    alt={t(`${lead.titleEn} — Telugu Desam Party campaign poster`)}
                    width={lead.width}
                    height={lead.height}
                    loading="eager"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                  {/* where the supporter's photo goes */}
                  <span className="absolute bottom-[7%] right-[5%] grid aspect-square w-[34%] place-items-center rounded-full border-2 border-dashed border-brand-400 bg-ink-950/55 text-center backdrop-blur-[2px]">
                    <span className="px-2">
                      <FaCamera className="mx-auto text-lg text-brand-400" aria-hidden="true" />
                      <span className="mt-1 block font-sans text-[0.62rem] font-bold uppercase leading-tight tracking-[0.08em] text-white">
                        {t('Your photo here')}
                      </span>
                    </span>
                  </span>
                </Link>
              </div>
              {/* where the name goes */}
              <span className="absolute -bottom-4 -left-6 inline-flex rotate-[-3deg] items-center gap-2 rounded-sm bg-brand-500 px-3.5 py-2 font-sans text-[0.72rem] font-bold uppercase tracking-[0.08em] text-ink-950 shadow-lg sm:-left-10">
                <FaPenNib aria-hidden="true" />
                {t('Your name here')}
              </span>
            </div>

            <ul className="mt-12 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[0.78rem] text-white/70">
              {['Free', 'Works on a phone', 'Ready in a minute'].map((x) => (
                <li key={x} className="inline-flex items-center gap-1.5">
                  <FaCircleCheck className="text-brand-400" aria-hidden="true" />
                  {t(x)}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* ---- the steps ---- */}
        <Reveal as="ol" delay={0.3} className="grid gap-3 sm:grid-cols-3 lg:col-span-6 lg:row-start-2 lg:self-start">
          {steps.map((s, i) => (
            <li key={s.title} className="flex items-start gap-3 rounded-sm border border-white/10 bg-white/[0.04] p-4 sm:block">
              <span className="flex shrink-0 items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-500 text-sm text-ink-950">
                  <s.icon aria-hidden="true" />
                </span>
                <span className="hidden font-sans text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-brand-400 sm:inline">
                  {t('Step')} {i + 1}
                </span>
              </span>
              <span className="block min-w-0">
                <span className="block font-sans text-sm font-semibold text-white sm:mt-3">{t(s.title)}</span>
                <span className="mt-1 block text-xs leading-relaxed text-white/60">{t(s.text)}</span>
              </span>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

export default PostersHero
