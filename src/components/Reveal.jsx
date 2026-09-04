import { useEffect, useRef, useState } from 'react'

/**
 * Scroll reveal.
 *
 * CSS-driven, not framer-motion. The motion version set `initial={{opacity:0}}`
 * as an inline style, which meant the prerendered HTML shipped its content
 * invisible and only became readable once JavaScript ran an animation frame.
 * That broke in three ways worth caring about: JS disabled or failed, a slow
 * connection where JS lands late, and background tabs, where
 * requestAnimationFrame does not tick at all.
 *
 * Here the hiding lives in CSS behind a `.js` class that an inline <head>
 * script sets before first paint, so the no-JS path renders visible content.
 * IntersectionObserver only adds `.is-visible`; if it is unsupported or never
 * fires, `useEffect`'s fallback reveals everything immediately. The reveal
 * itself is a transition rather than an animation, so a frozen animation clock
 * degrades to an instant reveal instead of leaving the page blank.
 */
const Reveal = ({
  children,
  delay = 0,
  as: Tag = 'div',
  variant = 'rise',
  className = '',
  ...rest
}) => {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // No IntersectionObserver (or a very old browser): show it and move on.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    // Already in view on mount — reveal without waiting for a scroll event.
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setVisible(true)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.01 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      data-reveal={variant}
      className={`${visible ? 'is-visible' : ''} ${className}`.trim()}
      style={delay ? { '--reveal-delay': `${delay}s` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export default Reveal
