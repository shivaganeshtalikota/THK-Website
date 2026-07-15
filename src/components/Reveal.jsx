import { motion, useReducedMotion } from 'framer-motion'

/**
 * Scroll-reveal wrapper.
 *
 * Replaces the initial/whileInView/viewport triplet that was copy-pasted onto
 * ~40 elements across the old pages. Crucially it checks the OS reduce-motion
 * setting and renders static content instead of animating — the old build
 * animated every section unconditionally.
 */
const Reveal = ({ children, delay = 0, y = 16, as = 'div', className, ...rest }) => {
  const reduce = useReducedMotion()
  const MotionTag = motion[as] ?? motion.div

  if (reduce) {
    const Tag = as
    return <Tag className={className} {...rest}>{children}</Tag>
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </MotionTag>
  )
}

export default Reveal
